const mongoose = require('mongoose');
const Policy = require('../models/Policy');
const Treaty = require('../models/Treaty');
const RiskAllocation = require('../models/RiskAllocation');

const THRESHOLD_SUM_INSURED = 5000000; // ₹50,00,000 – above this we cede to reinsurers

async function getActiveTreatiesForLOB(lineOfBusiness) {
  const now = new Date();
  return Treaty.find({
    status: 'ACTIVE',
    applicableLOBs: lineOfBusiness,
    effectiveFrom: { $lte: now },
    effectiveTo: { $gte: now },
  })
    .populate('reinsurerId', 'name code')
    .lean();
}

exports.calculateReinsuranceAllocation = async (policyId, calculatedBy) => {
  const policy = await Policy.findById(policyId).lean();
  if (!policy || policy.sumInsured < THRESHOLD_SUM_INSURED) {
    await RiskAllocation.deleteOne({ policyId });
    return null;
  }

  const treaties = await getActiveTreatiesForLOB(policy.lineOfBusiness);
  if (treaties.length === 0) {
    await RiskAllocation.deleteOne({ policyId });
    return null;
  }

  const totalShare = treaties.reduce((s, t) => s + (t.sharePercentage || 0), 0);
  if (totalShare <= 0) return null;

  const sumInsured = policy.sumInsured;
  const allocations = treaties.map((t) => {
    const pct = (t.sharePercentage || 0) / 100;
    const allocatedAmount = Math.min(
      sumInsured * pct,
      (t.treatyLimit || Number.MAX_SAFE_INTEGER) - 0
    );
    return {
      reinsurerId: t.reinsurerId?._id || t.reinsurerId,
      treatyId: t._id,
      allocatedAmount,
      allocatedPercentage: t.sharePercentage || 0,
    };
  });

  const totalCeded = allocations.reduce((s, a) => s + a.allocatedAmount, 0);
  const retainedAmount = Math.max(0, sumInsured - totalCeded);

  await RiskAllocation.findOneAndUpdate(
    { policyId },
    {
      policyId,
      allocations,
      retainedAmount,
      calculatedAt: new Date(),
      calculatedBy,
    },
    { upsert: true, new: true }
  );

  return { allocations, retainedAmount };
};
