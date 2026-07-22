const express = require('express');
const router = express.Router();
const { 
  getCompanies, 
  searchCompanies, 
  createCompany, 
  updateCompany, 
  deleteCompany, 
  getMyCompanies, 
  getDatabaseDiagnostics 
} = require('../controllers/companyController');

const {
  getRequisitions,
  getMyRequisitions,
  createRequisition,
  updateRequisition,
  deleteRequisition
} = require('../controllers/requisitionController');

const { requireAuth, authorizeRoles } = require('../middleware/authMiddleware');

// Companies API Routes
router.get('/companies', getCompanies);
router.get('/companies/search', searchCompanies);
router.get('/companies/my-listings', requireAuth, getMyCompanies);
router.post('/companies', requireAuth, authorizeRoles('admin'), createCompany);
router.put('/companies/:companyId', requireAuth, authorizeRoles('admin'), updateCompany);
router.delete('/companies/:companyId', requireAuth, authorizeRoles('admin'), deleteCompany);

// Requisitions / Job Posts API Routes
router.get('/requisitions', getRequisitions);
router.get('/requisitions/my-listings', requireAuth, getMyRequisitions);
router.post('/requisitions', requireAuth, authorizeRoles('employer', 'admin'), createRequisition);
router.put('/requisitions/:requisitionId', requireAuth, authorizeRoles('employer', 'admin'), updateRequisition);
router.delete('/requisitions/:requisitionId', requireAuth, authorizeRoles('employer', 'admin'), deleteRequisition);

// Debug route
router.get('/debug/database', getDatabaseDiagnostics);

module.exports = router;
