const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Load .env relative to this file
        require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
        
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("MongoDB connected successfully");
    } catch (err) {
        console.error("MongoDB connection error in connectDB helper:", err);
        process.exit(1);
    }
};

module.exports = { connectDB };
