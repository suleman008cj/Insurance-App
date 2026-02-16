const mongoose = require('mongoose');
const Policy = require('../models/Policy');
const { calculateReinsuranceAllocation } = require('../services/reinsuranceEngine');
const { log: auditLog } = require('../utils/audit');

const POLICY_NUMBER_PREFIX = 'POL';

async function getNextPolicyNumber() {
  const last = await Policy.findOne().sort({ policyNumber: -1 }).select('policyNumber').lean();
  const lastNum = last?.policyNumber?.replace(POLICY_NUMBER_PREFIX, '') || '0';
  const next = String(parseInt(lastNum, 10) + 1).padStart(8, '0');
  return `${POLICY_NUMBER_PREFIX}${next}`;
}

exports.createPolicy = async (req, res) => {
  try {
    const {
      insuredName,
      insuredType,
      lineOfBusiness,
      sumInsured,
      premium,
      retentionLimit,
      effectiveFrom,
      effectiveTo,
    } = req.body;

    if (!insuredName || !insuredType || !lineOfBusiness || !sumInsured || !premium) {
      return res.status(400).json({ message: 'Required fields: insuredName, insuredType, lineOfBusiness, sumInsured, premium' });
    }

    const policyNumber = await getNextPolicyNumber();
    const policy = new Policy({
      _id: new mongoose.Types.ObjectId(),
      policyNumber,
      insuredName,
      insuredType,
      lineOfBusiness,
      sumInsured: Number(sumInsured),
      premium: Number(premium),
      retentionLimit: retentionLimit != null ? Number(retentionLimit) : undefined,
      status: 'DRAFT',
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
      effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined,
      createdBy: req.user._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await policy.save();
    await calculateReinsuranceAllocation(saved._id, req.user._id).catch((e) =>
      console.error('Reinsurance allocation error:', e)
    );
    const populated = await Policy.findById(saved._id)
      .populate('createdBy', 'username email role')
      .lean();
    auditLog({ entityType: 'POLICY', entityId: saved._id, action: 'CREATE', newValue: populated || saved, performedBy: req.user._id, ipAddress: req.ip });
    return res.status(201).json({ policy: populated || saved });
  } catch (error) {
    console.error('Create policy error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.listPolicies = async (req, res) => {
  try {
    const { status, lineOfBusiness, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (lineOfBusiness) filter.lineOfBusiness = lineOfBusiness;
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, Math.max(1, parseInt(limit, 10)));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const [policies, total] = await Promise.all([
      Policy.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).populate('createdBy', 'username role').lean(),
      Policy.countDocuments(filter),
    ]);
    return res.json({ policies, total, page: parseInt(page, 10), limit: limitNum });
  } catch (error) {
    console.error('List policies error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getPolicy = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id)
      .populate('createdBy', 'username email role')
      .populate('approvedBy', 'username role')
      .lean();
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    return res.json(policy);
  } catch (error) {
    console.error('Get policy error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updatePolicy = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    if (policy.status !== 'DRAFT') {
      return res.status(400).json({ message: 'Only DRAFT policies can be updated' });
    }

    const allowed = [
      'insuredName', 'insuredType', 'lineOfBusiness', 'sumInsured', 'premium',
      'retentionLimit', 'effectiveFrom', 'effectiveTo',
    ];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) policy[key] = key.match(/Date|From|To/) ? new Date(req.body[key]) : req.body[key];
    });
    policy.updatedAt = new Date();
    await policy.save();
    await calculateReinsuranceAllocation(policy._id, req.user._id).catch((e) =>
      console.error('Reinsurance allocation error:', e)
    );
    const populated = await Policy.findById(policy._id)
      .populate('createdBy', 'username email role')
      .lean();
    auditLog({ entityType: 'POLICY', entityId: policy._id, action: 'UPDATE', newValue: populated, performedBy: req.user._id, ipAddress: req.ip });
    return res.json({ policy: populated || policy });
  } catch (error) {
    console.error('Update policy error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.approvePolicy = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    if (policy.status !== 'DRAFT') {
      return res.status(400).json({ message: 'Only DRAFT policies can be approved' });
    }
    policy.status = 'ACTIVE';
    policy.approvedBy = req.user._id;
    policy.updatedAt = new Date();
    if (!policy.effectiveFrom) policy.effectiveFrom = new Date();
    await policy.save();
    await calculateReinsuranceAllocation(policy._id, req.user._id).catch((e) =>
      console.error('Reinsurance allocation error on approve:', e)
    );
    const populated = await Policy.findById(policy._id)
      .populate('createdBy', 'username role')
      .populate('approvedBy', 'username role')
      .lean();
    auditLog({ entityType: 'POLICY', entityId: policy._id, action: 'APPROVE', newValue: populated, performedBy: req.user._id, ipAddress: req.ip });
    return res.json({ policy: populated, message: 'Policy approved' });
  } catch (error) {
    console.error('Approve policy error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.rejectPolicy = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    if (policy.status !== 'DRAFT') {
      return res.status(400).json({ message: 'Only DRAFT policies can be rejected' });
    }
    policy.status = 'EXPIRED';
    policy.updatedAt = new Date();
    await policy.save();
    return res.json({ policy, message: 'Policy rejected' });
  } catch (error) {
    console.error('Reject policy error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.suspendPolicy = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    if (policy.status !== 'ACTIVE') {
      return res.status(400).json({ message: 'Only ACTIVE policies can be suspended' });
    }
    policy.status = 'SUSPENDED';
    policy.updatedAt = new Date();
    await policy.save();
    return res.json({ policy, message: 'Policy suspended' });
  } catch (error) {
    console.error('Suspend policy error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
