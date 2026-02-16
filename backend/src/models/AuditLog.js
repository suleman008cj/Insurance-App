const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({ 

    _id: mongoose.Types.ObjectId, 
    entityType: {
        type: String,
        enum: ["POLICY", "CLAIM", "TREATY", "USER"]
    },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: false }, 
    action: {
        type: String,
        enum: ["CREATE", "UPDATE", "DELETE", "APPROVE"]
    },
    oldValue: Object, 
    newValue: Object, 
    performedBy: mongoose.Types.ObjectId, 
    performedAt: Date, 
    ipAddress: String
});

module.exports = mongoose.model('AuditLog', auditLogSchema);