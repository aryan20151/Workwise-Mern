const User = require('../models/User');

// @desc    User registration
// @route   POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { username, email, password, role, companyName } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email or username already exists' 
      });
    }
    
    // Validate role (Admin role cannot be selected via public signup; managed strictly via .env)
    const validRole = ['jobseeker', 'employer'].includes(role) ? role : 'jobseeker';

    if (validRole === 'employer' && (!companyName || !companyName.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Company Name is required for Employer registration'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      role: validRole,
      hasSelectedRole: true
    });
    
    await user.save();

    // If Employer, create or link Company Profile
    if (validRole === 'employer' && companyName) {
      const Company = require('../models/Company');
      const mongoose = require('mongoose');
      const db = mongoose.connection.db;

      const trimmedCompName = companyName.trim();
      let company = await Company.findOne({ 
        name: { $regex: new RegExp(`^${trimmedCompName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
      });

      if (!company) {
        const companyId = `comp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        company = new Company({
          companyId,
          name: trimmedCompName,
          industry: 'Technology',
          headquarters: 'Remote',
          budget: 'Negotiable',
          description: `Official corporate profile for ${trimmedCompName}`,
          postedBy: user._id
        });
        await company.save();

        try {
          const compObj = {
            companyId: company.companyId,
            name: company.name,
            industry: company.industry,
            headquarters: company.headquarters,
            budget: company.budget,
            type: 'Full-Time',
            description: company.description,
            postedBy: user._id
          };
          await db.collection('companies').updateOne({ companyId: company.companyId }, { $set: compObj }, { upsert: true });
          await db.collection('Companies').updateOne({ companyId: company.companyId }, { $set: compObj }, { upsert: true });
        } catch (e) {
          console.log('Notice syncing company native collection:', e.message);
        }
      } else {
        if (!company.postedBy) {
          company.postedBy = user._id;
          await company.save();
        }
      }

      user.companyId = company.companyId;
      user.companyName = company.name;
      await user.save();
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        hasSelectedRole: true,
        companyId: user.companyId || null,
        companyName: user.companyName || null
      }
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
    req.session.role = user.role;
    req.session.hasSelectedRole = true;

    if (!user.hasSelectedRole) {
      user.hasSelectedRole = true;
      await user.save();
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        hasSelectedRole: true,
        companyId: user.companyId || null,
        companyName: user.companyName || null
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
const checkStatus = async (req, res) => {
  try {
    if (req.session && req.session.userId) {
      let role = req.session.role;
      let hasSelectedRole = req.session.hasSelectedRole;
      const user = await User.findById(req.session.userId);
      if (user) {
        role = user.role;
        hasSelectedRole = user.hasSelectedRole;
        req.session.role = user.role;
        req.session.hasSelectedRole = user.hasSelectedRole;
      } else {
        role = 'jobseeker';
      }
      res.status(200).json({ 
        authenticated: true,
        user: {
          id: req.session.userId,
          username: req.session.username,
          email: user ? user.email : null,
          role: role,
          companyId: user ? user.companyId || null : null,
          companyName: user ? user.companyName || null : null,
          hasSelectedRole: user ? Boolean(user.hasSelectedRole) : false
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
                role: user.role,
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
    const { email, username, clerkId, selectedRole } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const validRole = ['jobseeker', 'employer'].includes(selectedRole) ? selectedRole : null;
    
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
        password: clerkId || `clerk_google_${Date.now()}`,
        role: validRole || 'jobseeker',
        hasSelectedRole: Boolean(validRole)
      });
      
      await user.save();
      console.log('✅ New Google user saved to MongoDB Atlas:', user.email);
    } else if (validRole && !user.hasSelectedRole) {
      user.role = validRole;
      user.hasSelectedRole = true;
      await user.save();
    }
    
    // Save session in Express
    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.role = user.role;
    req.session.hasSelectedRole = user.hasSelectedRole;
    
    res.status(200).json({
      success: true,
      message: 'User synced with MongoDB Atlas',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        hasSelectedRole: Boolean(user.hasSelectedRole)
      }
    });
  } catch (err) {
    console.error('Error syncing Google user to MongoDB:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// @desc    Select user role post-login/signup (e.g. after Google OAuth)
// @route   POST /api/auth/select-role
const selectRole = async (req, res) => {
  try {
    const { role, companyName } = req.body;
    if (!['jobseeker', 'employer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role selected' });
    }

    if (role === 'employer' && (!companyName || !companyName.trim())) {
      return res.status(400).json({ success: false, message: 'Company Name is required for Employer account' });
    }

    if (!req.session || !req.session.userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.role = role;
    user.hasSelectedRole = true;

    if (role === 'employer' && companyName) {
      const Company = require('../models/Company');
      const mongoose = require('mongoose');
      const db = mongoose.connection.db;

      const trimmedCompName = companyName.trim();
      let company = await Company.findOne({ 
        name: { $regex: new RegExp(`^${trimmedCompName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
      });

      if (!company) {
        const companyId = `comp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        company = new Company({
          companyId,
          name: trimmedCompName,
          industry: 'Technology',
          headquarters: 'Remote',
          budget: 'Negotiable',
          description: `Official corporate profile for ${trimmedCompName}`,
          postedBy: user._id
        });
        await company.save();

        try {
          const compObj = {
            companyId: company.companyId,
            name: company.name,
            industry: company.industry,
            headquarters: company.headquarters,
            budget: company.budget,
            type: 'Full-Time',
            description: company.description,
            postedBy: user._id
          };
          await db.collection('companies').updateOne({ companyId: company.companyId }, { $set: compObj }, { upsert: true });
          await db.collection('Companies').updateOne({ companyId: company.companyId }, { $set: compObj }, { upsert: true });
        } catch (e) {}
      } else {
        if (!company.postedBy) {
          company.postedBy = user._id;
          await company.save();
        }
      }

      user.companyId = company.companyId;
      user.companyName = company.name;
    }

    await user.save();

    req.session.role = user.role;
    req.session.hasSelectedRole = true;

    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        companyId: user.companyId || null,
        companyName: user.companyName || null,
        hasSelectedRole: true
      }
    });
  } catch (err) {
    console.error('Error selecting role:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// @desc    Admin Master Setup: Create an Employer account pre-linked with a Company Profile
// @route   POST /api/auth/admin/create-employer-company
const createEmployerCompany = async (req, res) => {
  try {
    const { username, email, password, companyName, industry, headquarters, budget, description } = req.body;

    if (!username || !email || !password || !companyName) {
      return res.status(400).json({
        success: false,
        message: 'Username, Email, Password, and Company Name are required.'
      });
    }

    // Check existing username or email
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { username: username.trim() }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists.'
      });
    }

    // Create Employer User
    const newEmployer = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'employer'
    });

    await newEmployer.save();

    // Link to Existing Company or Create New Company Profile
    const Company = require('../models/Company');
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;

    const trimmedCompName = companyName.trim();
    let existingComp = await Company.findOne({ 
      name: { $regex: new RegExp(`^${trimmedCompName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
    });

    if (!existingComp) {
      // Check native collections
      const native1 = await db.collection('companies').findOne({ name: { $regex: new RegExp(`^${trimmedCompName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
      const native2 = await db.collection('Companies').findOne({ name: { $regex: new RegExp(`^${trimmedCompName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
      if (native1 || native2) {
        existingComp = native1 || native2;
      }
    }

    let targetCompany = null;

    if (existingComp) {
      // Link employer to existing company
      const companyId = existingComp.companyId || `comp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      targetCompany = await Company.findOneAndUpdate(
        { companyId },
        { 
          $set: { 
            postedBy: newEmployer._id,
            name: trimmedCompName,
            ...(industry ? { industry } : {}),
            ...(headquarters ? { headquarters } : {}),
            ...(budget ? { budget } : {}),
            ...(description ? { description } : {})
          } 
        },
        { new: true, upsert: true }
      );
    } else {
      // Create brand new company profile
      const companyId = `comp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      targetCompany = new Company({
        companyId,
        name: trimmedCompName,
        industry: industry || 'Technology',
        headquarters: headquarters || 'Remote',
        budget: budget || 'Negotiable',
        description: description || `Official corporate profile for ${trimmedCompName}`,
        postedBy: newEmployer._id
      });
      await targetCompany.save();
    }

    // Also sync directly to native MongoDB collections 'companies' and 'Companies' for cross-collection consistency
    try {
      const compObj = {
        companyId: targetCompany.companyId,
        name: targetCompany.name,
        industry: targetCompany.industry,
        headquarters: targetCompany.headquarters,
        budget: targetCompany.budget,
        type: targetCompany.type || 'Full-Time',
        description: targetCompany.description,
        postedBy: newEmployer._id
      };
      await db.collection('companies').updateOne({ companyId: targetCompany.companyId }, { $set: compObj }, { upsert: true });
      await db.collection('Companies').updateOne({ companyId: targetCompany.companyId }, { $set: compObj }, { upsert: true });
    } catch (dbErr) {
      console.log('Notice: Syncing to native collections:', dbErr.message);
    }

    res.status(201).json({
      success: true,
      message: `Employer "${newEmployer.username}" and Company Profile "${newCompany.name}" provisioned successfully!`,
      employer: {
        id: newEmployer._id,
        username: newEmployer.username,
        email: newEmployer.email,
        role: newEmployer.role
      },
      company: newCompany
    });
  } catch (err) {
    console.error('Error in Admin Master Provisioning:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to provision employer and company profile',
      error: err.message
    });
  }
};

// @desc    Get all Employers with their linked company profiles for Admin Manipulation
// @route   GET /api/auth/admin/employers
const getAdminEmployers = async (req, res) => {
  try {
    const employers = await User.find({ role: 'employer' }).select('-password').sort({ createdAt: -1 });
    const Company = require('../models/Company');
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;

    const native1 = await db.collection('companies').find({}).toArray().catch(() => []);
    const native2 = await db.collection('Companies').find({}).toArray().catch(() => []);
    const mongooseComps = await Company.find({}).lean().catch(() => []);

    const allCompanies = [...native1, ...native2, ...mongooseComps];

    const result = employers.map((emp) => {
      const company = allCompanies.find(
        (c) => c.postedBy && String(c.postedBy) === String(emp._id)
      );
      return {
        _id: emp._id,
        username: emp.username,
        email: emp.email,
        role: emp.role,
        createdAt: emp.createdAt,
        company: company ? { companyId: company.companyId, name: company.name, industry: company.industry } : null
      };
    });

    res.status(200).json({
      success: true,
      employers: result
    });
  } catch (err) {
    console.error('Error fetching admin employers:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch employers', error: err.message });
  }
};

// @desc    Update Employer Details (Username, Email, Password) by Admin
// @route   PUT /api/auth/admin/employers/:userId
const updateAdminEmployer = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, password } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }

    if (username) user.username = username.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (password && password.trim()) {
      user.password = password; // Pre-save hook hashes password
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `Employer "${user.username}" updated successfully!`,
      user: { _id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Error updating employer:', err);
    res.status(500).json({ success: false, message: 'Failed to update employer', error: err.message });
  }
};

// @desc    Delete Employer & Associated Company Profile by Admin
// @route   DELETE /api/auth/admin/employers/:userId
const deleteAdminEmployer = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }

    const Company = require('../models/Company');
    await Company.deleteMany({ postedBy: userId });

    res.status(200).json({
      success: true,
      message: `Employer "${user.username}" and associated company profile deleted.`
    });
  } catch (err) {
    console.error('Error deleting employer:', err);
    res.status(500).json({ success: false, message: 'Failed to delete employer', error: err.message });
  }
};

// @desc    Update Logged-in User Profile (Username, Email, Password, & Company Details if Employer)
// @route   PUT /api/auth/profile
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { username, email, password, role, companyName, industry, headquarters, budget, description } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    // Update User Fields
    if (username && username.trim()) user.username = username.trim();
    if (email && email.trim()) user.email = email.toLowerCase().trim();
    if (password && password.trim()) user.password = password;

    if (role && ['jobseeker', 'employer'].includes(role) && user.role !== 'admin') {
      user.role = role;
      user.hasSelectedRole = true;
      req.session.role = role;
      req.session.hasSelectedRole = true;
    }

    await user.save();

    // If Employer, update linked Company Profile if provided
    let company = null;
    if (user.role === 'employer' && companyName) {
      const Company = require('../models/Company');
      company = await Company.findOne({
        $or: [{ postedBy: user._id }, { postedBy: String(user._id) }]
      });

      if (company) {
        if (companyName) company.name = companyName.trim();
        if (industry) company.industry = industry;
        if (headquarters) company.headquarters = headquarters;
        if (budget) company.budget = budget;
        if (description) company.description = description;
        await company.save();

        try {
          const db = mongoose.connection.db;
          const compObj = {
            name: company.name,
            industry: company.industry,
            headquarters: company.headquarters,
            budget: company.budget,
            description: company.description
          };
          await db.collection('companies').updateOne({ companyId: company.companyId }, { $set: compObj });
          await db.collection('Companies').updateOne({ companyId: company.companyId }, { $set: compObj });
        } catch (e) {
          console.log('Notice syncing updated company to native collections:', e.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: user._id,
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      company
    });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile', error: err.message });
  }
};

module.exports = {
  signup,
  login,
  logout,
  checkStatus,
  getUserDetails,
  googleSync,
  selectRole,
  createEmployerCompany,
  getAdminEmployers,
  updateAdminEmployer,
  deleteAdminEmployer,
  updateUserProfile
};
