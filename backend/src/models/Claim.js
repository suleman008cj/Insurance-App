const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({ 
    _id: mongoose.Types.ObjectId, 
    claimNumber: String, 
    policyId: mongoose.Types.ObjectId, 
    claimAmount: Number, 
    approvedAmount: Number, 
    status: {
        type: String,
        enum: ["SUBMITTED", "IN_REVIEW", "APPROVED", "REJECTED", "SETTLED"]
    },
    incidentDate: Date, 
    reportedDate: Date, 
    handledBy: mongoose.Types.ObjectId, 
    remarks: String, 
    createdAt: Date, 
    updatedAt: Date 
});

module.exports = mongoose.model('Claim', claimSchema);