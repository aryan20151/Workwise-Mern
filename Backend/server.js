const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const session = require('express-session');
const cors = require("cors");
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log("MongoDB Atlas connected successfully to database:", mongoose.connection.name);
})
.catch(err => {
    console.error("MongoDB Atlas connection error:", err);
});

const app = express();
const port = process.env.PORT || 5002;

// Enable trust proxy for platforms like Render behind reverse proxies
app.set('trust proxy', 1);

// Enable CORS for local development and deployed frontend origins
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || (origin && origin.endsWith('.vercel.app'))) {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    credentials: true
}));

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'workwise-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    name: 'workwise.sid'
}));

// Ensure uploads folder exists in root level
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Import Routers
const authRouter = require('./routes/authRoutes');
const companyRouter = require('./routes/companyRoutes');
const cartRouter = require('./routes/cartRoutes');
const contactRouter = require('./routes/contactRoutes');

// Mount Routers
app.use('/api/auth', authRouter);
app.use('/api', companyRouter);
app.use('/', cartRouter);
app.use('/', contactRouter);

// Direct page route handler (serves React built files relative to root level)
const serveReactSPA = (req, res) => {
    const indexPath = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(503).send(`
            <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h2>Frontend Not Compiled</h2>
                <p>Please build the React application by running <code>npm run build</code> in the frontend directory, then refresh this page.</p>
            </div>
        `);
    }
};

// Page Routes (redirects browser page hits to the React SPA index file)
app.get(['/', '/homepage', '/login', '/signup', '/contact', '/companies', '/cart', '/apply'], serveReactSPA);

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use('/uploads', express.static(uploadsDir));

// Handle 404 - Keep this as the last route
app.use((req, res) => {
    const indexPath = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
    if (!req.path.startsWith('/api') && fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).json({ success: false, error: "Route not found" });
    }
});

// Update the server startup code at the end of the file
const startServer = async () => {
  try {
    await new Promise((resolve, reject) => {
      const server = app.listen(port, () => {
        const url = `http://localhost:${port}`;
        console.log(`\n✅ Server is running at: ${url}`);
        resolve();
      });

      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`\n❌ Port ${port} is already in use. Please:\n1. Close any other running servers\n2. Try a different port\n3. Wait a few seconds and try again`);
        } else {
          console.error('\n❌ Server error:', error);
        }
        reject(error);
      });
    });
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      // Try to find an available port
      const newPort = port + 1;
      console.log(`\n🔄 Attempting to use port ${newPort} instead...`);
      port = newPort;
      await startServer(); // Recursively try the next port
    } else {
      console.error('\n❌ Failed to start server:', error);
      process.exit(1);
    }
  }
};

startServer();
