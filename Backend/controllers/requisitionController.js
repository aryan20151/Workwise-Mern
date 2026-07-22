const mongoose = require('mongoose');
const Requisition = require('../models/Requisition');
const Company = require('../models/Company');

// @desc    Get all job requisitions / posts
// @route   GET /api/requisitions
const getRequisitions = async (req, res) => {
    try {
        const requisitions = await Requisition.find({}).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            requisitions: requisitions || []
        });
    } catch (err) {
        console.error('Error fetching requisitions:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch job requisitions',
            error: err.message
        });
    }
};

// @desc    Get job requisitions posted by current employer vs all requisitions
// @route   GET /api/requisitions/my-listings
const getMyRequisitions = async (req, res) => {
    try {
        const userId = req.session?.userId;
        const allRequisitions = await Requisition.find({}).sort({ createdAt: -1 });

        const myRequisitions = (allRequisitions || []).filter(r => {
            if (!userId) return false;
            return r.postedBy && String(r.postedBy) === String(userId);
        });

        res.status(200).json({
            success: true,
            requisitions: allRequisitions || [],
            myRequisitions: myRequisitions || [],
            totalCount: (allRequisitions || []).length,
            myCount: (myRequisitions || []).length
        });
    } catch (err) {
        console.error('Error fetching employer requisitions:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employer requisitions',
            error: err.message
        });
    }
};

// @desc    Create a new job requisition / post
// @route   POST /api/requisitions
const createRequisition = async (req, res) => {
    try {
        const { title, companyId, companyName, industry, location, jobType, budget, techStack, description } = req.body;

        if (!title || !companyName || !location || !description) {
            return res.status(400).json({
                success: false,
                message: 'Job Title, Company Name, Location, and Description are required.'
            });
        }

        const requisitionId = `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        const parsedTechStack = Array.isArray(techStack)
            ? techStack
            : (typeof techStack === 'string' && techStack ? techStack.split(',').map(s => s.trim()) : []);

        const requisition = new Requisition({
            requisitionId,
            title,
            companyId: companyId || `comp_${Date.now()}`,
            companyName,
            industry: industry || 'Technology',
            location,
            jobType: jobType || 'Full-Time',
            budget: budget || 'Negotiable',
            techStack: parsedTechStack,
            description,
            postedBy: req.session ? req.session.userId : null
        });

        await requisition.save();

        res.status(201).json({
            success: true,
            message: 'Job requisition posted successfully!',
            requisition
        });
    } catch (err) {
        console.error('Error creating requisition:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to create job requisition',
            error: err.message
        });
    }
};

// @desc    Update a job requisition
// @route   PUT /api/requisitions/:requisitionId
const updateRequisition = async (req, res) => {
    try {
        const { requisitionId } = req.params;
        const { title, companyName, industry, location, jobType, budget, techStack, description, status } = req.body;

        // Check ownership if employer
        if (req.session?.role === 'employer' && req.session?.userId) {
            const existing = await Requisition.findOne({ requisitionId });
            if (existing && existing.postedBy && String(existing.postedBy) !== String(req.session.userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: You can only edit requisitions that you created.'
                });
            }
        }

        const parsedTechStack = Array.isArray(techStack)
            ? techStack
            : (typeof techStack === 'string' && techStack ? techStack.split(',').map(s => s.trim()) : []);

        const updateData = {
            title,
            companyName,
            industry,
            location,
            jobType,
            budget,
            techStack: parsedTechStack,
            description,
            ...(status ? { status } : {})
        };

        const requisition = await Requisition.findOneAndUpdate(
            { requisitionId },
            { $set: updateData },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Job requisition updated successfully!',
            requisition
        });
    } catch (err) {
        console.error('Error updating requisition:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to update job requisition',
            error: err.message
        });
    }
};

// @desc    Delete a job requisition
// @route   DELETE /api/requisitions/:requisitionId
const deleteRequisition = async (req, res) => {
    try {
        const { requisitionId } = req.params;

        // Check ownership if employer
        if (req.session?.role === 'employer' && req.session?.userId) {
            const existing = await Requisition.findOne({ requisitionId });
            if (existing && existing.postedBy && String(existing.postedBy) !== String(req.session.userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: You can only delete requisitions that you created.'
                });
            }
        }

        await Requisition.findOneAndDelete({ requisitionId });

        res.status(200).json({
            success: true,
            message: 'Job requisition deleted successfully!'
        });
    } catch (err) {
        console.error('Error deleting requisition:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to delete job requisition',
            error: err.message
        });
    }
};

module.exports = {
    getRequisitions,
    getMyRequisitions,
    createRequisition,
    updateRequisition,
    deleteRequisition
};
