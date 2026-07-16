const express = require('express');
const router = express.Router();
const { signup, login, logout, checkStatus, getUserDetails } = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/status', checkStatus);
router.post('/user-details', getUserDetails);

module.exports = router;
