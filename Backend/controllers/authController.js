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

// @desc    User login
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
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

module.exports = {
  signup,
  login,
  logout,
  checkStatus,
  getUserDetails
};
