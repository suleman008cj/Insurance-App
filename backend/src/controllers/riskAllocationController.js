const RiskAllocation = require('../models/RiskAllocation');
const { calculateReinsuranceAllocation } = require('../services/reinsuranceEngine');

exports.getByPolicyId = async (req, res) => {
  try {
    const allocation = await RiskAllocation.findOne({ policyId: req.params.policyId })
      .populate('allocations.reinsurerId', 'name code')
      .populate('allocations.treatyId', 'treatyName treatyType sharePercentage')
      .populate('calculatedBy', 'username role')
      .lean();
    if (!allocation) return res.status(404).json({ message: 'No risk allocation found for this policy' });
    return res.json(allocation);
  } catch (error) {
    console.error('Get risk allocation error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.recalculate = async (req, res) => {
  try {
    const result = await calculateReinsuranceAllocation(req.params.policyId, req.user._id);
    if (!result) {
      return res.json({ message: 'Policy below reinsurance threshold or no active treaties; allocation cleared.' });
    }
    const allocation = await RiskAllocation.findOne({ policyId: req.params.policyId })
      .populate('allocations.reinsurerId', 'name code')
      .populate('allocations.treatyId', 'treatyName sharePercentage')
      .lean();
    return res.json({ message: 'Recalculated', allocation });
  } catch (error) {
    console.error('Recalculate allocation error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
