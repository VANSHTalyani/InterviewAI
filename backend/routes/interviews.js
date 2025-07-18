const express = require('express');
const { check } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const {
  getInterviews,
  getInterview,
  createInterview,
  updateInterview,
  deleteInterview,
  uploadRecording,
  getRandomQuestions,
  analyzeInterview
} = require('../controllers/interviews');

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`
    );
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  const filetypes = /mp4|webm|mov|mpeg|mp3|wav/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Error: Videos and audio files only!'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100000000 } // 100MB limit
});

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Get random questions
router.get('/questions', getRandomQuestions);

// Interview routes
router
  .route('/')
  .get(getInterviews)
  .post(
    [
      check('title', 'Title is required').not().isEmpty(),
      check('type', 'Type is required').isIn(['technical', 'behavioral'])
    ],
    createInterview
  );

router
  .route('/:id')
  .get(getInterview)
  .put(updateInterview)
  .delete(deleteInterview);

// Upload recording
router.post('/:id/upload', upload.single('recording'), uploadRecording);

// Analyze interview
router.post('/:id/analyze', analyzeInterview);

module.exports = router;