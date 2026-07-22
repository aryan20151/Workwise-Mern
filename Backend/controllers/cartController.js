const Application = require('../models/Application');
const Company = require('../models/Company');
const Requisition = require('../models/Requisition');
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

// @desc    Add an application or saved item to the user's cart / wishlist
// @route   POST /api/cart
const addToCart = async (req, res) => {
    try {
        let { companyId, companyName, name, email, resumePath } = req.body;
        console.log("Adding to cart/saved items:", { companyId, companyName, name, email });

        const userId = await resolveUserId(req, email);

        if (!userId) {
            console.log('User not authenticated for cart addition');
            return res.status(401).json({ 
                success: false, 
                error: "User not authenticated. Please log in first." 
            });
        }

        // Auto-populate name & email from User account if omitted in body
        if (!name || !email) {
            const userObj = await User.findById(userId);
            if (userObj) {
                name = name || userObj.username || userObj.name || 'Candidate';
                email = email || userObj.email || 'candidate@example.com';
            }
        }

        const finalResumePath = resumePath || 'quick_apply_profile_resume.pdf';

        // Validate required fields
        if (!companyId || !companyName) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: companyId, companyName"
            });
        }

        name = name || 'Candidate';
        email = email || 'candidate@example.com';

        // Check if item is already saved/added in cart for this user
        const existingApp = await Application.findOne({ companyId, userId });
        if (existingApp) {
            return res.status(200).json({
                success: true,
                message: "Item already saved in your list",
                application: existingApp
            });
        }

        // Create and save application / saved item
        const application = new Application({
            companyId,
            companyName,
            name,
            email,
            resumePath: finalResumePath,
            userId: userId
        });

        await application.save();
        console.log("Application/Saved item saved successfully:", application._id);

        res.status(201).json({ 
            success: true, 
            message: "Item saved to list",
            application: application
        });
    } catch (err) {
        console.error("Error adding to cart:", err);
        res.status(500).json({ 
            success: false, 
            error: "Failed to save item" 
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

// @desc    Get candidate applications strictly for employer review / kanban board
// @route   GET /api/applications/employer
const getEmployerApplications = async (req, res) => {
    try {
        const userId = req.session?.userId;
        const role = req.session?.role;

        let query = {};

        if (role === 'employer' && userId) {
            // Find companies and requisitions created by this employer
            const myCompanies = await Company.find({
                $or: [{ postedBy: userId }, { postedBy: String(userId) }]
            });
            const myRequisitions = await Requisition.find({
                $or: [{ postedBy: userId }, { postedBy: String(userId) }]
            });

            const companyIds = [
                ...myCompanies.map(c => c.companyId),
                ...myRequisitions.map(r => r.requisitionId),
                ...myRequisitions.map(r => r.companyId)
            ].filter(Boolean);

            const companyNames = [
                ...myCompanies.map(c => c.name),
                ...myRequisitions.map(r => r.companyName)
            ].filter(Boolean);

            const nameRegexes = companyNames.map(name => new RegExp(`^${name.trim()}$`, 'i'));

            query = {
                $or: [
                    { companyId: { $in: companyIds } },
                    { companyName: { $in: nameRegexes } }
                ]
            };
        }

        const applications = await Application.find(query).sort({ createdAt: -1 });
        console.log(`📋 Fetched ${applications.length} applications for role: ${role}`);
        res.status(200).json({
            success: true,
            applications
        });
    } catch (err) {
        console.error('❌ Error fetching employer applications:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch candidate applications',
            error: err.message
        });
    }
};

// @desc    Update candidate application status (for Drag & Drop Kanban board)
// @route   PATCH /api/applications/:id/status
const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = ['pending', 'submitted', 'accepted', 'rejected'];

        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`
            });
        }

        // Ownership enforcement for employers
        if (req.session?.role === 'employer' && req.session?.userId) {
            const userId = req.session.userId;
            const existingApp = await Application.findById(id);
            if (!existingApp) {
                return res.status(404).json({
                    success: false,
                    message: 'Application record not found'
                });
            }

            const myCompanies = await Company.find({
                $or: [{ postedBy: userId }, { postedBy: String(userId) }]
            });
            const myRequisitions = await Requisition.find({
                $or: [{ postedBy: userId }, { postedBy: String(userId) }]
            });

            const companyIds = [
                ...myCompanies.map(c => c.companyId),
                ...myRequisitions.map(r => r.requisitionId),
                ...myRequisitions.map(r => r.companyId)
            ].filter(Boolean);

            const companyNames = [
                ...myCompanies.map(c => c.name?.toLowerCase()),
                ...myRequisitions.map(r => r.companyName?.toLowerCase())
            ].filter(Boolean);

            const isMatched = companyIds.includes(existingApp.companyId) ||
                companyNames.includes(existingApp.companyName?.toLowerCase());

            if (!isMatched) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: You can only update application statuses for your own job postings.'
                });
            }
        }

        const application = await Application.findByIdAndUpdate(
            id,
            { $set: { status } },
            { new: true }
        );

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application record not found'
            });
        }

        console.log(`✅ Application status updated: ${application.name} -> ${status}`);

        res.status(200).json({
            success: true,
            message: `Application status updated to ${status}!`,
            application
        });
    } catch (err) {
        console.error('❌ Error updating application status:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to update application status',
            error: err.message
        });
    }
};

module.exports = {
    getCart,
    addToCart,
    removeFromCart,
    clearCart,
    applyRedirect,
    getApplyData,
    getSessionDebug,
    getEmployerApplications,
    updateApplicationStatus
};

