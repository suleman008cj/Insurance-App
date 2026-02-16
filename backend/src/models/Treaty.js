const mongoose = require('mongoose');

const treatySchema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId, 
    treatyName: String, 
    treatyType: {
        type: String,
        enum: ["QUOTA_SHARE", "SURPLUS"]
    },
    reinsurerId: mongoose.Types.ObjectId, 
    sharePercentage: Number, 
    retentionLimit: Number, 
    treatyLimit: Number, 
    applicableLOBs: ["HEALTH", "MOTOR"], 
    effectiveFrom: Date, 
    effectiveTo: Date, 
    status: {
        type: String,
        enum: ["ACTIVE", "EXPIRED"]
    },
    createdAt: Date, 
    updatedAt: Date 
}) 

module.exports = mongoose.model('Treaty', treatySchema);
