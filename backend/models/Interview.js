const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  type: {
    type: String,
    enum: ['technical', 'behavioral'],
    required: [true, 'Please specify interview type']
  },
  videoUrl: {
    type: String
  },
  recordingPath: {
    type: String
  },
  transcript: {
    type: String
  },
  questions: [{
    question: {
      type: String,
      required: true
    },
    answer: {
      type: String
    },
    feedback: {
      type: String
    },
    startTime: {
      type: Number
    },
    endTime: {
      type: Number
    }
  }],
  analysis: {
    fillerWords: {
      count: {
        type: Number,
        default: 0
      },
      words: [{
        word: String,
        count: Number,
        timestamps: [Number]
      }]
    },
    tonality: {
      type: Map,
      of: Number,
      default: {}
    },
    clarity: {
      score: {
        type: Number,
        min: 0,
        max: 10
      },
      feedback: String
    },
    bodyLanguage: [{
      timestamp: Number,
      observation: String,
      suggestion: String
    }],
    overallScore: {
      type: Number,
      min: 0,
      max: 100
    },
    strengths: [String],
    improvements: [String],
    summary: String
  },
  duration: {
    type: Number
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Interview', InterviewSchema);