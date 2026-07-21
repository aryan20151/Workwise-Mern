const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { 
    getCart, 
    addToCart, 
    removeFromCart, 
    clearCart, 
    applyRedirect, 
    getApplyData, 
    getSessionDebug 
} = require('../controllers/cartController');

// Configure upload directory (points to root uploads folder, stepping up twice from Backend/routes/)
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const cleanName = (file.originalname || 'resume.pdf').replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, Date.now() + "-" + cleanName);
    }
});
const upload = multer({ storage });

// Cart routes
router.get('/api/cart', getCart);
router.post('/api/cart', addToCart);
router.delete('/api/cart/:companyId', removeFromCart);
router.delete('/api/cart', clearCart);

// Resume upload handler
const handleResumeUpload = (req, res) => {
  console.log("Resume upload request received:", req.file?.originalname);
  try {
    if (!req.file) {
      console.error("No file uploaded in request");
      return res.status(400).json({ 
        success: false, 
        error: "No file uploaded" 
      });
    }
    
    console.log("File uploaded successfully:", req.file.filename);
    res.status(200).json({ 
      success: true, 
      filename: req.file.filename 
    });
  } catch (err) {
    console.error("Error uploading resume:", err);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error: " + err.message 
    });
  }
};

// Resume upload routes (supports both /upload-resume and /api/upload-resume)
router.post('/upload-resume', upload.single('resume'), handleResumeUpload);
router.post('/api/upload-resume', upload.single('resume'), handleResumeUpload);

// Apply redirect routes (legacy)
router.post('/apply', applyRedirect);
router.get('/api/apply/data', getApplyData);

// Debug route
router.get('/api/debug/session', getSessionDebug);

module.exports = router;
