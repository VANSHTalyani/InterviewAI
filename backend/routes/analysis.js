const express = require('express');
const { check } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  saveAnalysis,
  getAnalysisHistory,
  getAnalysisById,
  updateAnalysisDecision,
  deleteAnalysis,
  getAnalysisStats
} = require('../controllers/analysis');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Analysis routes
router.post(
  '/save',
  [
    check('filename', 'Filename is required').not().isEmpty(),
    check('duration', 'Duration is required').isNumeric(),
    check('analysisResults', 'Analysis results are required').not().isEmpty()
  ],
  saveAnalysis
);

router.get('/history', getAnalysisHistory);
router.get('/stats', getAnalysisStats);
router.get('/:id', getAnalysisById);

router.put(
  '/:id/decision',
  [
    check('decision', 'Decision must be save or discard').isIn(['save', 'discard'])
  ],
  updateAnalysisDecision
);

router.delete('/:id', deleteAnalysis);

module.exports = router;