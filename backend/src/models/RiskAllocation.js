const mongoose = require('mongoose');

const riskAllocationSchema = new mongoose.Schema({ 
    _id: mongoose.Types.ObjectId, 
    policyId: mongoose.Types.ObjectId, 
    allocations: [ 
        { 
        reinsurerId: mongoose.Types.ObjectId, 
        treatyId: mongoose.Types.ObjectId, 
        allocatedAmount: Number, 
        allocatedPercentage: Number 
        } 
    ], 
    retainedAmount: Number, 
    calculatedAt: Date, 
    calculatedBy: mongoose.Types.ObjectId 
});

module.exports = mongoose.model('RiskAllocation', riskAllocationSchema);