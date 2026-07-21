const mongoose = require('mongoose');
const Company = require('../models/Company');

// @desc    Get all companies directly from MongoDB
// @route   GET /api/companies
const getCompanies = async (req, res) => {
    console.log('📊 Fetching ALL companies from MongoDB Atlas...');
    try {
        // Set cache control headers to prevent caching
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // Direct query from MongoDB collection with fallbacks for collection name case sensitivity
        const db = mongoose.connection.db;
        let companies = await db.collection('companies').find({}).toArray();
        if (!companies || companies.length === 0) {
            companies = await db.collection('Companies').find({}).toArray();
        }
        if (!companies || companies.length === 0) {
            companies = await Company.find({});
        }

        console.log(`✅ Successfully fetched ${companies.length} companies from MongoDB Atlas`);
        
        // Return ALL companies
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

module.exports = {
    getCompanies,
    searchCompanies,
    getDatabaseDiagnostics
};
