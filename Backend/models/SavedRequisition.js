const mongoose = require('mongoose');

const SavedRequisitionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requisitionId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  companyId: {
    type: String
  },
  companyName: {
    type: String,
    default: 'Company'
  },
  location: {
    type: String,
    default: 'Remote'
  },
  budget: {
    type: String,
    default: 'Negotiable'
  },
  jobType: {
    type: String,
    default: 'Full-Time'
  },
  techStack: {
    type: [String],
    default: []
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Unique index so a user cannot bookmark the same requisition multiple times
SavedRequisitionSchema.index({ userId: 1, requisitionId: 1 }, { unique: true });

module.exports = mongoose.model('SavedRequisition', SavedRequisitionSchema);
