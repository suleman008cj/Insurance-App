const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({ 
    _id: mongoose.Types.ObjectId, 
    policyNumber: String, 
    insuredName: String, 
    insuredType: {
            type: String,
            enum: ["INDIVIDUAL", "CORPORATE"]
        },
    lineOfBusiness: {
            type: String,
            enum: ["HEALTH", "MOTOR", "LIFE", "PROPERTY"]
        }, 
    sumInsured: Number, 
    premium: Number, 
    retentionLimit: Number, 
    status: {
            type: String,
            enum: ["DRAFT", "ACTIVE", "SUSPENDED", "EXPIRED"]
        },
    effectiveFrom: Date, 
    effectiveTo: Date, 
    createdBy: mongoose.Types.ObjectId, 
    approvedBy: mongoose.Types.ObjectId, 
    createdAt: Date, 
    updatedAt: Date 
});

module.exports = mongoose.model('Policy', policySchema);