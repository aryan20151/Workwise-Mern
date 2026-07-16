const express = require('express');
const router = express.Router();
const { getCompanies, searchCompanies, getDatabaseDiagnostics } = require('../controllers/companyController');

router.get('/companies', getCompanies);
router.get('/companies/search', searchCompanies);
router.get('/debug/database', getDatabaseDiagnostics);

module.exports = router;
