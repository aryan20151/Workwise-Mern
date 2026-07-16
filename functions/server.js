const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const session = require('express-session');
const serverless = require('serverless-http');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log("MongoDB Atlas connected successfully");
})
.catch(err => {
    console.error("MongoDB Atlas connection error:", err);
});

const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
    secret: 'workwise-secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    name: 'workwise.sid'
}));

// For serverless functions, we can't write to the filesystem
// Instead, we'll use memory storage for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Note: In a production environment, you would want to use a service like
// AWS S3, Cloudinary, or similar to store uploaded files

// Import models
const User = require('../Backend/models/User');
const Company = require('../Backend/models/Company');
const Application = require('../Backend/models/Application');

// Page Routes
app.get('/', (req, res) => {
    // Check if user is authenticated
    if (req.session && req.session.userId) {
        // User is authenticated, render homepage
        res.render('homepage');
    } else {
        // User is not authenticated, redirect to login
        res.redirect('/login');
    }
});

app.get('/homepage', (req, res) => {
    // Check if user is authenticated
    if (req.session && req.session.userId) {
        res.render('homepage');
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/signup', (req, res) => {
    res.render('signup');   
});

// Copy all your routes from index.js here
// ...

// Serve static files
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.use('/data', express.static(path.join(__dirname, '../data')));
app.use(express.static(path.join(__dirname, '../public')));

// Handle 404 - Keep this as the last route
app.use((req, res) => {
    res.status(404).render('404', { message: 'Page not found' });
});

// Export the serverless handler
module.exports.handler = serverless(app);
