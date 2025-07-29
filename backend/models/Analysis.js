const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  interview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalFilename: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  // Comprehensive analysis results
  analysisResults: {
    overallScore: {
      type: Number,
      min: 0,
      max: 100
    },
    bodyLanguage: {
      score: Number,
      insights: [String],
      eyeContact: Number,
      posture: Number,
      gestures: Number,
      facialExpressions: Number
    },
    speech: {
      score: Number,
      clarity: Number,
      pace: Number,
      volume: Number,
      fillerWords: [{
        word: String,
        timestamp: Number,
        confidence: Number
      }],
      tonalVariety: Number
    },
    content: {
      score: Number,
      structure: Number,
      relevance: Number,
      completeness: Number
    },
    timeline: [{
      timestamp: Number,
      eventType: {
        type: String,
        enum: ['filler', 'pause', 'highlight', 'concern']
      },
      description: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high']
      }
    }],
    recommendations: [String]
  },
  // Raw backend analysis data - using Mixed type to avoid conflicts
  rawAnalysisData: mongoose.Schema.Types.Mixed,
  // Transcription data
  transcription: {
    text: String,
    confidence: Number,
    service: String,
    wordCount: Number
  },
  // Processing metadata
  processingTime: {
    type: Number // in seconds
  },
  analysisTimestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  // User decision
  savedByUser: {
    type: Boolean,
    default: false
  },
  userDecisionAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
AnalysisSchema.index({ user: 1, createdAt: -1 });
AnalysisSchema.index({ status: 1 });
AnalysisSchema.index({ savedByUser: 1 });

module.exports = mongoose.model('Analysis', AnalysisSchema);