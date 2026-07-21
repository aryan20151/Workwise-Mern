const Application = require('../models/Application');
const Company = require('../models/Company');
const User = require('../models/User');

// Helper to resolve user ID from session or email
const resolveUserId = async (req, emailFromReq) => {
  if (req.session && req.session.userId) {
    return req.session.userId;
  }

  const email = emailFromReq || req.query?.email || req.body?.email;
  if (email) {
    let user = await User.findOne({ email: { $regex: new RegExp(`^${email.trim()}$`, 'i') } });
    if (!user) {
      let baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
      user = new User({
        username: baseUsername,
        email: email,
        password: `clerk_user_${Date.now()}`
      });
      await user.save();
    }
    if (req.session) {
      req.session.userId = user._id;
      req.session.username = user.username;
    }
    return user._id;
  }

  return null;
};

// @desc    Get user's applications cart
// @route   GET /api/cart
const getCart = async (req, res) => {
    try {
        const userId = await resolveUserId(req);
        
        if (!userId) {
            console.log('User not authenticated for cart access');
            return res.status(401).json({ 
                success: false, 
                error: "User not authenticated" 
            });
        }

        console.log('Fetching cart for user:', userId);
        const applications = await Application.find({ 
            userId: userId 
        }).sort({ createdAt: -1 });
        
        console.log(`Found ${applications.length} applications in cart`);
        res.status(200).json({ 
            success: true, 
            cart: applications 
        });
    } catch (err) {
        console.error("Error fetching cart:", err);
        res.status(500).json({ 
            success: false, 
            error: "Failed to fetch applications" 
        });
    }
};

// @desc    Add an application to the user's cart
// @route   POST /api/cart
const addToCart = async (req, res) => {
    try {
        const { companyId, companyName, name, email, resumePath } = req.body;
        console.log("Adding to cart:", { companyId, companyName, name, email });

        const userId = await resolveUserId(req, email);

        if (!userId) {
            console.log('User not authenticated for cart addition');
            return res.status(401).json({ 
                success: false, 
                error: "User not authenticated" 
            });
        }

        // Validate required fields
        if (!companyId || !companyName || !name || !email || !resumePath) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields"
            });
        }

        // Verify company exists
        const company = await Company.findOne({ companyId });
        if (!company) {
            return res.status(404).json({
                success: false,
                error: "Company not found"
            });
        }

        // Create and save application
        const application = new Application({
            companyId,
            companyName,
            name,
            email,
            resumePath,
            userId: userId
        });

        await application.save();
        console.log("Application saved successfully:", application._id);

        res.status(201).json({ 
            success: true, 
            message: "Application added to cart",
            application: application
        });
    } catch (err) {
        console.error("Error adding to cart:", err);
        res.status(500).json({ 
            success: false, 
            error: "Failed to add application to cart" 
        });
    }
};

// @desc    Remove an application from the user's cart
// @route   DELETE /api/cart/:companyId
const removeFromCart = async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                error: "User not authenticated" 
            });
        }

        console.log('Deleting application:', req.params.companyId);
        const result = await Application.deleteOne({ 
            companyId: req.params.companyId,
            userId: req.session.userId 
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                error: "Application not found"
            });
        }

        res.status(200).json({ 
            success: true,
            message: "Application removed from cart"
        });
    } catch (err) {
        console.error("Error deleting application:", err);
        res.status(500).json({ 
            success: false, 
            error: "Failed to delete application" 
        });
    }
};

// @desc    Clear all applications from the user's cart
// @route   DELETE /api/cart
const clearCart = async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                error: "User not authenticated" 
            });
        }

        console.log('Clearing cart for user:', req.session.userId);
        const result = await Application.deleteMany({ 
            userId: req.session.userId 
        });

        res.status(200).json({ 
            success: true,
            message: "Cart cleared successfully",
            deletedCount: result.deletedCount
        });
    } catch (err) {
        console.error("Error clearing cart:", err);
        res.status(500).json({ 
            success: false, 
            error: "Failed to clear cart" 
        });
    }
};

// @desc    Apply endpoint for resume uploads (legacy EJS path redirector)
// @route   POST /apply
const applyRedirect = async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.session || !req.session.userId) {
            console.log('User not authenticated, redirecting to login');
            return res.redirect('/login');
        }

        const { companyId, companyName } = req.body;
        console.log('Apply request received:', { companyId, companyName });

        // Verify company exists in database
        const company = await Company.findOne({ companyId });
        if (!company) {
            console.error('Company not found:', companyId);
            return res.status(404).send('<h1>404 Not Found</h1><p>Company not found.</p>');
        }

        // Store company data in session
        req.session.applyData = {
            companyId: company.companyId,
            companyName: company.name
        };

        // Force session save and wait for it to complete
        await new Promise((resolve, reject) => {
            req.session.save(err => {
                if (err) {
                    console.error('Failed to save session:', err);
                    reject(err);
                } else {
                    console.log('Session saved successfully:', req.session);
                    resolve();
                }
            });
        });

        res.redirect('/apply');
    } catch (err) {
        console.error('Error in apply route:', err);
        res.status(500).send('<h1>500 Internal Server Error</h1><p>Failed to process application.</p>');
    }
};

// @desc    Get current session apply company data
// @route   GET /api/apply/data
const getApplyData = (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    console.log('Apply data requested. Session:', {
        userId: req.session?.userId,
        applyData: req.session?.applyData
    });

    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Please log in to continue'
        });
    }

    if (!req.session.applyData) {
        return res.status(404).json({
            success: false,
            message: 'No application data found. Please select a company first.'
        });
    }

    return res.status(200).json({
        success: true,
        data: req.session.applyData
    });
};

// @desc    Get debug session information
// @route   GET /api/debug/session
const getSessionDebug = (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    console.log('Current session:', {
        id: req.session.id,
        userId: req.session.userId,
        applyData: req.session.applyData
    });
    res.json({
        authenticated: !!req.session.userId,
        hasApplyData: !!req.session.applyData,
        sessionId: req.session.id
    });
};

module.exports = {
    getCart,
    addToCart,
    removeFromCart,
    clearCart,
    applyRedirect,
    getApplyData,
    getSessionDebug
};
