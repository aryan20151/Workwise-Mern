const mongoose = require('mongoose');
const Company = require('../models/Company');

// Helper to fetch and deduplicate companies across all collection variants
const fetchUnifiedCompanies = async () => {
    try {
        const db = mongoose.connection.db;
        const list1 = await db.collection('companies').find({}).toArray().catch(() => []);
        const list2 = await db.collection('Companies').find({}).toArray().catch(() => []);
        const list3 = await Company.find({}).lean().catch(() => []);

        const map = new Map();
        [...list1, ...list2, ...list3].forEach(c => {
            const key = String(c.companyId || c._id);
            if (key && !map.has(key)) {
                map.set(key, c);
            }
        });
        return Array.from(map.values());
    } catch (e) {
        console.error('Error fetching unified companies:', e);
        return [];
    }
};

// @desc    Get all companies directly from MongoDB
// @route   GET /api/companies
const getCompanies = async (req, res) => {
    console.log('📊 Fetching ALL companies from MongoDB Atlas...');
    try {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        const companies = await fetchUnifiedCompanies();

        console.log(`✅ Successfully fetched ${companies.length} companies from MongoDB Atlas`);
        
        res.status(200).json({ 
            success: true, 
            companies: companies,
            total: companies.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('❌ Error fetching companies from MongoDB Atlas:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch companies from database',
            error: err.message 
        });
    }
};

// @desc    Search companies in MongoDB
// @route   GET /api/companies/search
const searchCompanies = async (req, res) => {
    const searchTerm = req.query.name || req.query.query || '';
    console.log('🔍 Searching companies in MongoDB Atlas with term:', searchTerm);
    
    try {
        const db = mongoose.connection.db;
        const filter = searchTerm 
            ? { 
                $or: [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { industry: { $regex: searchTerm, $options: 'i' } },
                    { headquarters: { $regex: searchTerm, $options: 'i' } },
                    { description: { $regex: searchTerm, $options: 'i' } }
                ]
              } 
            : {};
        
        // Query directly from MongoDB collection to handle collection name case sensitivity
        let companies = await db.collection('companies').find(filter).toArray();
        if (companies.length === 0) {
            companies = await db.collection('Companies').find(filter).toArray();
        }
        
        console.log(`✅ Found ${companies.length} companies matching "${searchTerm}"`);
        
        res.status(200).json({ 
            success: true, 
            companies: companies,
            total: companies.length,
            searchTerm: searchTerm
        });
    } catch (err) {
        console.error('❌ Error searching companies in MongoDB Atlas:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to search companies in database',
            error: err.message 
        });
    }
};

// @desc    Run database diagnostics
// @route   GET /api/debug/database
const getDatabaseDiagnostics = async (req, res) => {
    console.log('📊 Running database diagnostics...');
    try {
        // Check database details
        const result = await Company.checkAllCompanies();
        
        // Check if users collection exists and has data
        const db = mongoose.connection.db;
        const userCount = await db.collection('users').countDocuments();
        const applicationCount = await db.collection('applications').countDocuments();
        
        res.status(200).json({
            success: true,
            database: mongoose.connection.db.databaseName,
            collections: {
                companies: {
                    directCount: result.directCount,
                    mongooseCount: result.mongooseCount,
                    sampleCompanies: result.companies.slice(0, 5).map(c => c.name)
                },
                users: {
                    count: userCount
                },
                applications: {
                    count: applicationCount
                }
            }
        });
    } catch (err) {
        console.error('❌ Error during database diagnostics:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to run database diagnostics',
            error: err.message
        });
    }
};

// @desc    Create a new company / job listing (Employers / Admins only)
// @route   POST /api/companies
const createCompany = async (req, res) => {
    try {
        const { name, industry, headquarters, budget, type, techStack, description } = req.body;

        if (!name || !industry || !headquarters || !description) {
            return res.status(400).json({
                success: false,
                message: 'Company name, industry, location, and description are required.'
            });
        }

        // Limit check: Employers can create at most 1 company profile
        if (req.session?.role === 'employer' && req.session?.userId) {
            const userId = req.session.userId;
            const existingCount = await Company.countDocuments({
                $or: [{ postedBy: userId }, { postedBy: String(userId) }]
            });
            if (existingCount >= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Employer account can only create 1 company profile. You can edit your existing company.'
                });
            }
        }

        // Generate unique companyId
        const companyId = `comp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        const parsedTechStack = Array.isArray(techStack) 
            ? techStack 
            : (typeof techStack === 'string' && techStack ? techStack.split(',').map(s => s.trim()) : []);

        const newCompanyData = {
            companyId,
            name,
            industry,
            headquarters,
            budget: budget || 'Negotiable',
            type: type || 'Full-Time',
            techStack: parsedTechStack,
            description,
            postedBy: req.session ? req.session.userId : null
        };

        const company = new Company(newCompanyData);
        await company.save();

        // Also insert into direct 'companies' collection to ensure consistency across MongoDB collection references
        try {
            const db = mongoose.connection.db;
            await db.collection('companies').updateOne(
                { companyId: companyId },
                { $set: newCompanyData },
                { upsert: true }
            );
        } catch (dbErr) {
            console.log('Notice: Direct db update notice:', dbErr.message);
        }

        console.log('✅ New Company created by employer:', company.name);

        res.status(201).json({
            success: true,
            message: 'Company listing created successfully!',
            company
        });
    } catch (err) {
        console.error('❌ Error creating company listing:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to create company listing',
            error: err.message
        });
    }
};

// @desc    Update an existing company / listing
// @route   PUT /api/companies/:companyId
const updateCompany = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { name, industry, headquarters, budget, type, techStack, description } = req.body;

        // Check ownership if user is an employer
        if (req.session?.role === 'employer' && req.session?.userId) {
            const existing = await Company.findOne({ companyId });
            if (existing && existing.postedBy && String(existing.postedBy) !== String(req.session.userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: You can only edit listings that you created.'
                });
            }
        }

        const parsedTechStack = Array.isArray(techStack) 
            ? techStack 
            : (typeof techStack === 'string' && techStack ? techStack.split(',').map(s => s.trim()) : []);

        const updateData = {
            name,
            industry,
            headquarters,
            budget: budget || 'Negotiable',
            type: type || 'Full-Time',
            techStack: parsedTechStack,
            description
        };

        // Find and update in Mongoose
        let company = await Company.findOneAndUpdate(
            { companyId },
            { $set: updateData },
            { new: true }
        );

        // Also update direct MongoDB collection to keep collections in sync
        try {
            const db = mongoose.connection.db;
            await db.collection('companies').updateOne(
                { companyId },
                { $set: updateData }
            );
            await db.collection('Companies').updateOne(
                { companyId },
                { $set: updateData }
            );
        } catch (dbErr) {
            console.log('Notice: Direct update notice:', dbErr.message);
        }

        if (!company) {
            const db = mongoose.connection.db;
            company = await db.collection('companies').findOne({ companyId });
        }

        console.log('✅ Company updated:', companyId);

        res.status(200).json({
            success: true,
            message: 'Company listing updated successfully!',
            company
        });
    } catch (err) {
        console.error('❌ Error updating company listing:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to update company listing',
            error: err.message
        });
    }
};

// @desc    Delete a company / listing
// @route   DELETE /api/companies/:companyId
const deleteCompany = async (req, res) => {
    try {
        const { companyId } = req.params;

        // Check ownership if user is an employer
        if (req.session?.role === 'employer' && req.session?.userId) {
            const existing = await Company.findOne({ companyId });
            if (existing && existing.postedBy && String(existing.postedBy) !== String(req.session.userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: You can only delete listings that you created.'
                });
            }
        }

        await Company.findOneAndDelete({ companyId });

        // Delete from direct MongoDB collections as well
        try {
            const db = mongoose.connection.db;
            await db.collection('companies').deleteOne({ companyId });
            await db.collection('Companies').deleteOne({ companyId });
        } catch (dbErr) {
            console.log('Notice: Direct delete notice:', dbErr.message);
        }

        console.log('🗑️ Company deleted:', companyId);

        res.status(200).json({
            success: true,
            message: 'Company listing deleted successfully!'
        });
    } catch (err) {
        console.error('❌ Error deleting company listing:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to delete company listing',
            error: err.message
        });
    }
};

// @desc    Get companies posted by the logged-in user and all companies for employer management
// @route   GET /api/companies/my-listings
const getMyCompanies = async (req, res) => {
    try {
        const userId = req.session?.userId;
        const allCompanies = await fetchUnifiedCompanies();

        // Filter companies created by the logged-in user
        const myCompanies = (allCompanies || []).filter(c => {
            if (!userId) return false;
            return c.postedBy && String(c.postedBy) === String(userId);
        });

        // Employers NEVER see other companies
        const role = req.session?.role;
        const returnedCompanies = role === 'employer' ? myCompanies : (allCompanies || []);

        res.status(200).json({
            success: true,
            companies: returnedCompanies,
            myCompanies: myCompanies || [],
            totalCount: returnedCompanies.length,
            myCount: (myCompanies || []).length
        });
    } catch (err) {
        console.error('❌ Error fetching company listings:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch company listings',
            error: err.message
        });
    }
};

module.exports = {
    getCompanies,
    searchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    getMyCompanies,
    getDatabaseDiagnostics
};


