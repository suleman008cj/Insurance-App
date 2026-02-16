const mongoose = require('mongoose');
const Treaty = require('../models/Treaty');

exports.createTreaty = async (req, res) => {
  try {
    const {
      treatyName,
      treatyType,
      reinsurerId,
      sharePercentage,
      retentionLimit,
      treatyLimit,
      applicableLOBs,
      effectiveFrom,
      effectiveTo,
      status,
    } = req.body;
    if (!treatyName || !treatyType || !reinsurerId) {
      return res.status(400).json({ message: 'treatyName, treatyType and reinsurerId are required' });
    }

    const doc = new Treaty({
      _id: new mongoose.Types.ObjectId(),
      treatyName,
      treatyType,
      reinsurerId: new mongoose.Types.ObjectId(reinsurerId),
      sharePercentage: sharePercentage != null ? Number(sharePercentage) : 0,
      retentionLimit: retentionLimit != null ? Number(retentionLimit) : undefined,
      treatyLimit: treatyLimit != null ? Number(treatyLimit) : undefined,
      applicableLOBs: Array.isArray(applicableLOBs) ? applicableLOBs : ['HEALTH', 'MOTOR'],
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined,
      status: status || 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const saved = await doc.save();
    const populated = await Treaty.findById(saved._id).populate('reinsurerId', 'name code').lean();
    return res.status(201).json(populated || saved);
  } catch (error) {
    console.error('Create treaty error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.listTreaties = async (req, res) => {
  try {
    const { status, reinsurerId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (reinsurerId) filter.reinsurerId = reinsurerId;
    const list = await Treaty.find(filter).populate('reinsurerId', 'name code rating').sort({ effectiveFrom: -1 }).lean();
    return res.json(list);
  } catch (error) {
    console.error('List treaties error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getTreaty = async (req, res) => {
  try {
    const doc = await Treaty.findById(req.params.id).populate('reinsurerId', 'name code country rating contactEmail').lean();
    if (!doc) return res.status(404).json({ message: 'Treaty not found' });
    return res.json(doc);
  } catch (error) {
    console.error('Get treaty error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateTreaty = async (req, res) => {
  try {
    const {
      treatyName,
      sharePercentage,
      retentionLimit,
      treatyLimit,
      applicableLOBs,
      effectiveFrom,
      effectiveTo,
      status,
    } = req.body;
    const update = { updatedAt: new Date() };
    if (treatyName !== undefined) update.treatyName = treatyName;
    if (sharePercentage !== undefined) update.sharePercentage = Number(sharePercentage);
    if (retentionLimit !== undefined) update.retentionLimit = Number(retentionLimit);
    if (treatyLimit !== undefined) update.treatyLimit = Number(treatyLimit);
    if (applicableLOBs !== undefined) update.applicableLOBs = applicableLOBs;
    if (effectiveFrom !== undefined) update.effectiveFrom = new Date(effectiveFrom);
    if (effectiveTo !== undefined) update.effectiveTo = new Date(effectiveTo);
    if (status !== undefined) update.status = status;

    const doc = await Treaty.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('reinsurerId', 'name code')
      .lean();
    if (!doc) return res.status(404).json({ message: 'Treaty not found' });
    return res.json(doc);
  } catch (error) {
    console.error('Update treaty error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
