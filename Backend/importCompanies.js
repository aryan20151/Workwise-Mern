const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { connectDB } = require('./config/database');
const Company = require('./models/Company');

console.log('📊 Starting import of companies to MongoDB Atlas...');

// Connect to MongoDB Atlas
connectDB()
  .then(() => importCompanies())
  .catch(err => {
    console.error("❌ MongoDB Atlas connection error:", err);
    process.exit(1);
  });

async function importCompanies() {
    try {
        // Check if data directory exists
        const dataDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log("📁 Created data directory");
        }

        // Check if JSON file exists
        const jsonPath = path.join(dataDir, 'companies.json');
        if (!fs.existsSync(jsonPath)) {
            console.error("❌ companies.json file not found in data directory");
            console.log("⚠️ Please create a companies.json file in the data directory");
            await mongoose.connection.close();
            process.exit(1);
        }

        // Read the JSON file
        const companiesData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        console.log(`📚 Found ${companiesData.length} companies in JSON file`);

        // Confirm before continuing
        console.log("⚠️ WARNING: This will replace ALL existing companies in the database.");
        console.log("⚠️ Current companies in database will be PERMANENTLY DELETED.");
        console.log("✅ Proceeding with import...");

        // Clear existing companies
        const deletedCount = await Company.deleteMany({});
        console.log(`🗑️ Cleared ${deletedCount.deletedCount} existing companies from database`);

        // Transform data to match our schema
        const companies = companiesData.map(company => ({
            companyId: company.id || `COMP${Math.floor(Math.random() * 100000)}`,
            name: company.name,
            industry: company.industry || 'Unknown',
            headquarters: company.headquarters || 'Unknown',
            description: company.description || `${company.name} is a company in the ${company.industry || 'business'} sector.`
        }));

        // Insert companies
        const result = await Company.insertMany(companies);
        console.log(`✅ Successfully imported ${result.length} companies to MongoDB Atlas`);

        // Verify the import
        const count = await Company.countDocuments();
        console.log(`📊 Total companies in database: ${count}`);

        // Close the connection
        await mongoose.connection.close();
        console.log("👋 MongoDB Atlas connection closed");
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Error importing companies:", error);
        
        try {
            await mongoose.connection.close();
        } catch (err) {
            console.error("❌ Error closing database connection:", err);
        }
        
        process.exit(1);
    }
} 