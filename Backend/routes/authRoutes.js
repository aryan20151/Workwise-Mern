const express = require('express');
const router = express.Router();
const { 
  signup, 
  login, 
  logout, 
  checkStatus, 
  getUserDetails, 
  googleSync, 
  createEmployerCompany,
  getAdminEmployers,
  updateAdminEmployer,
  deleteAdminEmployer,
  updateUserProfile
} = require('../controllers/authController');
const { requireAuth, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/status', checkStatus);
router.post('/user-details', getUserDetails);
router.post('/google-sync', googleSync);
router.put('/profile', requireAuth, updateUserProfile);

// Admin Master Setup & Employer Management Routes
router.post('/admin/create-employer-company', requireAuth, authorizeRoles('admin'), createEmployerCompany);
router.get('/admin/employers', requireAuth, authorizeRoles('admin'), getAdminEmployers);
router.put('/admin/employers/:userId', requireAuth, authorizeRoles('admin'), updateAdminEmployer);
router.delete('/admin/employers/:userId', requireAuth, authorizeRoles('admin'), deleteAdminEmployer);

module.exports = router;
