const Interview = require('../models/Interview');
const Question = require('../models/Question');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

// @desc    Get all interviews for a user
// @route   GET /api/interviews
// @access  Private
exports.getInterviews = async (req, res, next) => {
  try {
    const interviews = await Interview.find({ user: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: interviews.length,
      data: interviews
    });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
};

// @desc    Get single interview
// @route   GET /api/interviews/:id
// @access  Private
exports.getInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: `No interview found with id ${req.params.id}`
      });
    }

    // Make sure user owns the interview
    if (interview.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this interview'
      });
    }

    res.status(200).json({
      success: true,
      data: interview
    });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
};

// @desc    Create new interview
// @route   POST /api/interviews
// @access  Private
exports.createInterview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Add user to request body
    req.body.user = req.user.id;

    const interview = await Interview.create(req.body);

    res.status(201).json({
      success: true,
      data: interview
    });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
};

// @desc    Update interview
// @route   PUT /api/interviews/:id
// @access  Private
exports.updateInterview = async (req, res, next) => {
  try {
    let interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: `No interview found with id ${req.params.id}`
      });
    }

    // Make sure user owns the interview
    if (interview.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this interview'
      });
    }

    interview = await Interview.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: interview
    });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
};

// @desc    Delete interview
// @route   DELETE /api/interviews/:id
// @access  Private
exports.deleteInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: `No interview found with id ${req.params.id}`
      });
    }

    // Make sure user owns the interview
    if (interview.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this interview'
      });
    }

    // Delete associated files if they exist
    if (interview.recordingPath) {
      const filePath = path.join(__dirname, '..', interview.recordingPath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await interview.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
};

// @desc    Upload interview recording
// @route   POST /api/interviews/:id/upload
// @access  Private
exports.uploadRecording = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: `No interview found with id ${req.params.id}`
      });
    }

    // Make sure user owns the interview
    if (interview.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to upload to this interview'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    // Update interview with recording path
    interview.recordingPath = `uploads/${req.file.filename}`;
    interview.status = 'processing';
    await interview.save();

    // Here you would typically trigger the AI analysis process
    // This would be an async process that updates the interview when complete

    res.status(200).json({
      success: true,
      data: interview
    });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
};

// @desc    Get random questions for interview
// @route   GET /api/interviews/questions
// @access  Private
exports.getRandomQuestions = async (req, res, next) => {
  try {
    const { type, count = 5, difficulty, category } = req.query;

    const query = {};
    if (type) query.type = type;
    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;

    // Get random questions
    const questions = await Question.aggregate([
      { $match: query },
      { $sample: { size: parseInt(count) } }
    ]);

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
};

// @desc    Submit interview for AI analysis
// @route   POST /api/interviews/:id/analyze
// @access  Private
exports.analyzeInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: `No interview found with id ${req.params.id}`
      });
    }

    // Make sure user owns the interview
    if (interview.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to analyze this interview'
      });
    }

    // Check if interview has a recording
    if (!interview.recordingPath && !interview.videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Interview has no recording to analyze'
      });
    }

    // Update status to processing
    interview.status = 'processing';
    await interview.save();

    // Here you would trigger the AI analysis process
    // This is a placeholder for the actual implementation
    // In a real implementation, this would be an async process

    // Mock analysis result for demonstration
    setTimeout(async () => {
      try {
        // Update interview with mock analysis
        const mockAnalysis = {
          fillerWords: {
            count: 15,
            words: [
              { word: 'um', count: 8, timestamps: [10, 25, 40, 55, 70, 85, 100, 115] },
              { word: 'like', count: 7, timestamps: [15, 30, 45, 60, 75, 90, 105] }
            ]
          },
          tonality: {
            confident: 0.7,
            nervous: 0.2,
            enthusiastic: 0.6,
            monotone: 0.3
          },
          clarity: {
            score: 7.5,
            feedback: 'Good clarity overall, but could improve structure in responses.'
          },
          bodyLanguage: [
            {
              timestamp: 30,
              observation: 'Limited eye contact',
              suggestion: 'Try to maintain more consistent eye contact with the interviewer.'
            },
            {
              timestamp: 60,
              observation: 'Fidgeting with hands',
              suggestion: 'Be mindful of hand movements and try to appear more composed.'
            }
          ],
          overallScore: 78,
          strengths: [
            'Clear articulation of technical concepts',
            'Good examples to support answers',
            'Positive attitude throughout'
          ],
          improvements: [
            'Reduce filler words',
            'Improve body language',
            'Structure answers more concisely'
          ],
          summary: 'Overall good performance with clear communication. Areas for improvement include reducing filler words and improving body language.'
        };

        // Update the interview with analysis results
        await Interview.findByIdAndUpdate(interview._id, {
          analysis: mockAnalysis,
          status: 'completed',
          transcript: 'This is a mock transcript of the interview...' // In a real implementation, this would be the actual transcript
        });

        console.log(`Analysis completed for interview ${interview._id}`);
      } catch (err) {
        console.error(`Error in analysis process: ${err.message}`);
        await Interview.findByIdAndUpdate(interview._id, { status: 'failed' });
      }
    }, 5000); // Simulate a 5-second processing time

    res.status(200).json({
      success: true,
      message: 'Interview submitted for analysis',
      data: { status: 'processing' }
    });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
};