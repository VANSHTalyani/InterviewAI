const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getInterviewHistory,
  getInterviewDetails,
  getProgressAnalytics,
  getSkillProgress,
  getProgressBenchmarks
} = require('../controllers/analytics');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// History routes
router.get('/history', getInterviewHistory);
router.get('/history/:id', getInterviewDetails);

// Progress routes
router.get('/progress', getProgressAnalytics);
router.get('/progress/skills', getSkillProgress);
router.get('/progress/benchmarks', getProgressBenchmarks);

module.exports = router;