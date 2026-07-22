const express = require('express');
const router = express.Router();
const {
  getSavedRequisitions,
  saveRequisition,
  removeSavedRequisition
} = require('../controllers/savedRequisitionController');

router.get('/api/saved-requisitions', getSavedRequisitions);
router.post('/api/saved-requisitions', saveRequisition);
router.delete('/api/saved-requisitions/:requisitionId', removeSavedRequisition);

module.exports = router;
