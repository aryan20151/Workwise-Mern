const mongoose = require('mongoose');

const requisitionSchema = new mongoose.Schema({
    requisitionId: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    companyId: {
        type: String,
        required: true
    },
    companyName: {
        type: String,
        required: true
    },
    industry: {
        type: String,
        default: 'General'
    },
    location: {
        type: String,
        required: true
    },
    jobType: {
        type: String,
        default: 'Full-Time'
    },
    budget: {
        type: String,
        default: 'Negotiable'
    },
    techStack: {
        type: [String],
        default: []
    },
    description: {
        type: String,
        required: true
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['Open', 'Closed'],
        default: 'Open'
    }
}, {
    timestamps: true,
    collection: 'Requisitions'
});

module.exports = mongoose.model('Requisition', requisitionSchema);
