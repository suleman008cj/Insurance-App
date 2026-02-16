const Policy = require('../models/Policy');
const Claim = require('../models/Claim');
const RiskAllocation = require('../models/RiskAllocation');

exports.exposureByPolicyType = async (req, res) => {
  try {
    const match = { status: 'ACTIVE' };
    const data = await Policy.aggregate([
      { $match: match },
      { $group: { _id: '$lineOfBusiness', totalExposure: { $sum: '$sumInsured' }, count: { $sum: 1 }, totalPremium: { $sum: '$premium' } } },
      { $sort: { totalExposure: -1 } },
    ]);
    return res.json(data);
  } catch (error) {
    console.error('Exposure by policy type error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.claimsRatio = async (req, res) => {
  try {
    const totalPremium = await Policy.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: null, sum: { $sum: '$premium' } } },
    ]);
    const claimStatusFilter = { status: { $in: ['APPROVED', 'SETTLED'] } };
    const totalClaims = await Claim.aggregate([
      { $match: claimStatusFilter },
      { $group: { _id: null, sum: { $sum: '$approvedAmount' } } },
    ]);
    const premium = totalPremium[0]?.sum || 0;
    const claims = totalClaims[0]?.sum || 0;
    const ratio = premium > 0 ? (claims / premium) * 100 : 0;
    return res.json({ totalPremium: premium, totalClaimsApproved: claims, claimsRatioPercent: Math.round(ratio * 100) / 100 });
  } catch (error) {
    console.error('Claims ratio error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.reinsurerRiskDistribution = async (req, res) => {
  try {
    const data = await RiskAllocation.aggregate([
      { $unwind: '$allocations' },
      { $group: { _id: '$allocations.reinsurerId', totalAllocated: { $sum: '$allocations.allocatedAmount' }, count: { $sum: 1 } } },
      { $lookup: { from: 'reinsures', localField: '_id', foreignField: '_id', as: 'reinsurer' } },
      { $unwind: { path: '$reinsurer', preserveNullAndEmptyArrays: true } },
      { $project: { reinsurerId: '$_id', totalAllocated: 1, policyCount: '$count', reinsurerName: '$reinsurer.name', reinsurerCode: '$reinsurer.code' } },
      { $sort: { totalAllocated: -1 } },
    ]);
    return res.json(data);
  } catch (error) {
    console.error('Reinsurer risk distribution error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.lossRatioTrends = async (req, res) => {
  try {
    const months = parseInt(req.query.months, 10) || 12;
    const from = new Date();
    from.setMonth(from.getMonth() - months);
    const data = await Claim.aggregate([
      { $match: { status: { $in: ['APPROVED', 'SETTLED'] }, createdAt: { $gte: from } } },
      { $project: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, approvedAmount: 1 } },
      { $group: { _id: { year: '$year', month: '$month' }, totalApproved: { $sum: '$approvedAmount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
    return res.json(data);
  } catch (error) {
    console.error('Loss ratio trends error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
