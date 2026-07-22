const User = require('../models/User');

// Helper to attempt session restoration from header if session was lost (e.g., server restart)
const attemptSessionRestore = async (req) => {
  if (req.session && req.session.userId) return true;

  const headerUserId = req.headers['x-user-id'] || (req.body && req.body.userId);
  if (!headerUserId) return false;

  try {
    const user = await User.findById(headerUserId);
    if (user) {
      if (!req.session) req.session = {};
      req.session.userId = user._id;
      req.session.username = user.username;
      req.session.role = user.role;
      return true;
    }
  } catch (err) {
    console.error('Session restoration notice:', err.message);
  }
  return false;
};

// Middleware to check if user is authenticated via session
const requireAuth = async (req, res, next) => {
  await attemptSessionRestore(req);

  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.'
    });
  }
  next();
};

// Middleware to authorize specific user roles
const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    await attemptSessionRestore(req);

    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    let userRole = req.session.role;
    if (!userRole) {
      try {
        const user = await User.findById(req.session.userId);
        if (user) {
          userRole = user.role;
          req.session.role = user.role;
        } else {
          userRole = 'jobseeker';
        }
      } catch (e) {
        userRole = 'jobseeker';
      }
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${userRole}' is not authorized to access this resource.`
      });
    }

    next();
  };
};

module.exports = {
  requireAuth,
  authorizeRoles
};
