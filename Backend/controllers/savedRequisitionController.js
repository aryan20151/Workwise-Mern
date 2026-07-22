const SavedRequisition = require('../models/SavedRequisition');
const User = require('../models/User');

// Helper to resolve user ID
const resolveUserId = async (req) => {
  if (req.session && req.session.userId) {
    return req.session.userId;
  }
  const headerUserId = req.headers['x-user-id'];
  if (headerUserId) {
    return headerUserId;
  }
  return null;
};

// @desc    Get user's saved job requisitions
// @route   GET /api/saved-requisitions
const getSavedRequisitions = async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const saved = await SavedRequisition.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      savedRequisitions: saved,
      count: saved.length
    });
  } catch (err) {
    console.error('Error fetching saved requisitions:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch saved requisitions',
      error: err.message
    });
  }
};

// @desc    Save a job requisition
// @route   POST /api/saved-requisitions
const saveRequisition = async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { 
      requisitionId, 
      title, 
      companyId, 
      companyName, 
      location, 
      budget, 
      jobType, 
      techStack, 
      description 
    } = req.body;

    if (!requisitionId || !title) {
      return res.status(400).json({
        success: false,
        message: 'Requisition ID and title are required'
      });
    }

    // Check if already saved
    const existing = await SavedRequisition.findOne({ userId, requisitionId });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Job requisition already saved',
        savedRequisition: existing
      });
    }

    const newSaved = new SavedRequisition({
      userId,
      requisitionId,
      title,
      companyId: companyId || requisitionId,
      companyName: companyName || 'Company',
      location: location || 'Remote',
      budget: budget || 'Negotiable',
      jobType: jobType || 'Full-Time',
      techStack: Array.isArray(techStack) ? techStack : [],
      description: description || ''
    });

    await newSaved.save();

    res.status(201).json({
      success: true,
      message: 'Job requisition saved successfully',
      savedRequisition: newSaved
    });
  } catch (err) {
    console.error('Error saving requisition:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to save job requisition',
      error: err.message
    });
  }
};

// @desc    Remove a saved job requisition
// @route   DELETE /api/saved-requisitions/:requisitionId
const removeSavedRequisition = async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { requisitionId } = req.params;

    const result = await SavedRequisition.deleteOne({ userId, requisitionId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Saved requisition record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Removed from saved job requisitions'
    });
  } catch (err) {
    console.error('Error removing saved requisition:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to remove saved job requisition',
      error: err.message
    });
  }
};

module.exports = {
  getSavedRequisitions,
  saveRequisition,
  removeSavedRequisition
};
