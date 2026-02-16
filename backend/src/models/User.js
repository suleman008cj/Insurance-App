const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({ 
    _id: mongoose.Types.ObjectId, 
    username: String, 
    email: String, 
    passwordHash: String, 
    role: {
        type: String,
        enum: ["UNDERWRITER", "CLAIMS_ADJUSTER", "REINSURANCE_MANAGER", "ADMIN"]
    },
    permissions: [String], 
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE"]
    },
    lastLoginAt: Date, 
    createdAt: Date, 
    updatedAt: Date 
});

module.exports = mongoose.model('User', userSchema);