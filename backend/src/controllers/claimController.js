const mongoose = require('mongoose');
const Claim = require('../models/Claim');
const Policy = require('../models/Policy');
const { log: auditLog } = require('../utils/audit');

const CLAIM_NUMBER_PREFIX = 'CLM';

async function getNextClaimNumber() {
  const last = await Claim.findOne().sort({ claimNumber: -1 }).select('claimNumber').lean();
  const lastNum = last?.claimNumber?.replace(CLAIM_NUMBER_PREFIX, '') || '0';
  const next = String(parseInt(lastNum, 10) + 1).padStart(8, '0');
  return `${CLAIM_NUMBER_PREFIX}${next}`;
}

function checkCoverage(policy, claimAmount, incidentDate) {
  if (!policy) return { valid: false, reason: 'Policy not found' };
  if (policy.status !== 'ACTIVE') return { valid: false, reason: 'Policy is not active' };
  if (policy.effectiveFrom && new Date(incidentDate) < new Date(policy.effectiveFrom)) {
    return { valid: false, reason: 'Incident date before policy start' };
  }
  if (policy.effectiveTo && new Date(incidentDate) > new Date(policy.effectiveTo)) {
    return { valid: false, reason: 'Incident date after policy end' };
  }
  if (claimAmount > policy.sumInsured) {
    return { valid: false, reason: 'Claim amount exceeds sum insured' };
  }
  return { valid: true };
}

function fraudFlags(claim, policy) {
  const flags = [];
  if (claim.claimAmount > policy.sumInsured * 0.9) flags.push('HIGH_AMOUNT');
  const reportedDelay = (new Date(claim.reportedDate) - new Date(claim.incidentDate)) / (1000 * 60 * 60 * 24);
  if (reportedDelay > 30) flags.push('LATE_REPORT');
  return flags;
}

exports.createClaim = async (req, res) => {
  try {
    const { policyId, claimAmount, incidentDate, reportedDate, remarks } = req.body;
    if (!policyId || claimAmount == null) {
      return res.status(400).json({ message: 'policyId and claimAmount are required' });
    }

    const policy = await Policy.findById(policyId).lean();
    const incident = incidentDate ? new Date(incidentDate) : new Date();
    const reported = reportedDate ? new Date(reportedDate) : new Date();
    const coverage = checkCoverage(policy, Number(claimAmount), incident);
    if (!coverage.valid) {
      return res.status(400).json({ message: 'Coverage check failed', reason: coverage.reason });
    }

    const claimNumber = await getNextClaimNumber();
    const claim = new Claim({
      _id: new mongoose.Types.ObjectId(),
      claimNumber,
      policyId: new mongoose.Types.ObjectId(policyId),
      claimAmount: Number(claimAmount),
      approvedAmount: undefined,
      status: 'SUBMITTED',
      incidentDate: incident,
      reportedDate: reported,
      handledBy: undefined,
      remarks: remarks || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const saved = await claim.save();
    const fraud = fraudFlags(saved, policy);
    const populated = await Claim.findById(saved._id).populate('policyId', 'policyNumber sumInsured status').lean();
    auditLog({ entityType: 'CLAIM', entityId: saved._id, action: 'CREATE', newValue: populated || saved, performedBy: req.user._id, ipAddress: req.ip });
    return res.status(201).json({
      claim: populated || saved,
      fraudFlags: fraud.length ? fraud : undefined,
    });
  } catch (error) {
    console.error('Create claim error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.listClaims = async (req, res) => {
  try {
    const { status, policyId, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (policyId) filter.policyId = policyId;
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, Math.max(1, parseInt(limit, 10)));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const [claims, total] = await Promise.all([
      Claim.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).populate('policyId', 'policyNumber sumInsured').populate('handledBy', 'username role').lean(),
      Claim.countDocuments(filter),
    ]);
    return res.json({ claims, total, page: parseInt(page, 10), limit: limitNum });
  } catch (error) {
    console.error('List claims error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getClaim = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('policyId', 'policyNumber sumInsured status lineOfBusiness')
      .populate('handledBy', 'username email role')
      .lean();
    if (!claim) return res.status(404).json({ message: 'Claim not found' });
    return res.json(claim);
  } catch (error) {
    console.error('Get claim error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateClaimStatus = async (req, res) => {
  try {
    const { status, approvedAmount, remarks } = req.body;
    const validTransitions = {
      SUBMITTED: ['IN_REVIEW'],
      IN_REVIEW: ['APPROVED', 'REJECTED'],
      APPROVED: ['SETTLED'],
      REJECTED: [],
      SETTLED: [],
    };
    const claim = await Claim.findById(req.params.id).populate('policyId', 'sumInsured');
    if (!claim) return res.status(404).json({ message: 'Claim not found' });
    const allowed = validTransitions[claim.status];
    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({ message: `Cannot transition from ${claim.status} to ${status}` });
    }
    claim.status = status;
    claim.handledBy = req.user._id;
    claim.updatedAt = new Date();
    if (remarks !== undefined) claim.remarks = remarks;
    if (status === 'APPROVED' || status === 'SETTLED') {
      const amount = approvedAmount != null ? Number(approvedAmount) : claim.claimAmount;
      if (claim.policyId && amount > claim.policyId.sumInsured) {
        return res.status(400).json({ message: 'Approved amount cannot exceed sum insured' });
      }
      claim.approvedAmount = amount;
    }
    await claim.save();
    const populated = await Claim.findById(claim._id)
      .populate('policyId', 'policyNumber sumInsured')
      .populate('handledBy', 'username role')
      .lean();
    auditLog({ entityType: 'CLAIM', entityId: claim._id, action: 'UPDATE', newValue: populated, performedBy: req.user._id, ipAddress: req.ip });
    return res.json({ claim: populated, message: 'Claim updated' });
  } catch (error) {
    console.error('Update claim error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
