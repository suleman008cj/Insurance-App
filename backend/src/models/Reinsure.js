const mongoose = require('mongoose');

const reinsureSchema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId, 
    name: String, 
    code: String, 
    country: String, 
    rating: {
        type: String,
        enum: ["AAA", "AA", "A", "BBB"]
    },
    contactEmail: String, 
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE"]
    },
    createdAt: Date, 
    updatedAt: Date
});

module.exports = mongoose.model('Reinsure', reinsureSchema);