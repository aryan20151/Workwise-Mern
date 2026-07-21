const User = require('../models/User');

// @desc    User registration
// @route   POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email or username already exists' 
      });
    }
    
    // Create new user
    const user = new User({
      username,
      email,
      password
    });
    
    await user.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'User created successfully' 
    });
  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, username, emailOrUsername, password } = req.body;
    
    const loginIdentifier = emailOrUsername || email || username;
    
    if (!loginIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'Username or email is required'
      });
    }
    
    // Find user by email or username (case-insensitive)
    const escapedIdentifier = loginIdentifier.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const user = await User.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${escapedIdentifier}$`, 'i') } },
        { username: { $regex: new RegExp(`^${escapedIdentifier}$`, 'i') } }
      ]
    });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username/email or password' 
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username/email or password' 
      });
    }
    
    // Set session
    req.session.userId = user._id;
    req.session.username = user.username;
    
    res.status(200).json({ 
      success: true, 
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// @desc    User logout
// @route   POST /api/auth/logout
const logout = (req, res) => {
  try {
    // Clear session
    req.session.destroy();
    
    res.status(200).json({ 
      success: true, 
      message: 'Logout successful' 
    });
  } catch (err) {
    console.error('Error during logout:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// @desc    Get session authentication status
// @route   GET /api/auth/status
const checkStatus = (req, res) => {
  try {
    if (req.session && req.session.userId) {
      res.status(200).json({ 
        authenticated: true,
        user: {
          id: req.session.userId,
          username: req.session.username
        }
      });
    } else {
      res.status(200).json({ 
        authenticated: false 
      });
    }
  } catch (err) {
    console.error('Error checking auth status:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// @desc    Get profile details of the logged in user
// @route   POST /api/auth/user-details
const getUserDetails = async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.session || !req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Find user by ID
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Return user details
        res.status(200).json({
            success: true,
            user: {
                username: user.username,
                email: user.email,
                profile: user.profile
            }
        });
    } catch (err) {
        console.error('Error fetching user details:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// @desc    Sync or create Google user in MongoDB Atlas
const googleSync = async (req, res) => {
  try {
    const { email, username, clerkId } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    // Check if user already exists in MongoDB Atlas by email
    let user = await User.findOne({ email: { $regex: new RegExp(`^${email.trim()}$`, 'i') } });
    
    if (!user) {
      // Generate unique base username if needed
      let baseUsername = (username || email.split('@')[0]).replace(/[^a-zA-Z0-9_]/g, '');
      let uniqueUsername = baseUsername;
      let counter = 1;
      while (await User.findOne({ username: uniqueUsername })) {
        uniqueUsername = `${baseUsername}${counter++}`;
      }
      
      user = new User({
        username: uniqueUsername,
        email: email,
        password: clerkId || `clerk_google_${Date.now()}`
      });
      
      await user.save();
      console.log('✅ New Google user saved to MongoDB Atlas:', user.email);
    }
    
    // Save session in Express
    req.session.userId = user._id;
    req.session.username = user.username;
    
    res.status(200).json({
      success: true,
      message: 'User synced with MongoDB Atlas',
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Error syncing Google user to MongoDB:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  signup,
  login,
  logout,
  checkStatus,
  getUserDetails,
  googleSync
};
