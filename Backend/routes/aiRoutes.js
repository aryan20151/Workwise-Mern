const express = require('express');
const router = express.Router();
const { analyzeAtsMatch, generateCoverLetter, parseCvSkills } = require('../controllers/aiController');

router.post('/match-score', analyzeAtsMatch);
router.post('/generate-cover-letter', generateCoverLetter);
router.post('/parse-cv', parseCvSkills);

module.exports = router;
