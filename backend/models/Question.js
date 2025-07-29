const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Please add question text'],
    trim: true
  },
  type: {
    type: String,
    enum: ['technical', 'behavioral'],
    required: [true, 'Please specify question type']
  },
  category: {
    type: String,
    required: [true, 'Please specify question category']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true
  }],
  sampleAnswer: {
    type: String
  },
  hints: [{
    type: String
  }],
  // For technical questions
  codeSnippet: {
    type: String
  },
  // For technical questions with coding challenges
  testCases: [{
    input: String,
    expectedOutput: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for text search
QuestionSchema.index({ text: 'text', category: 'text', tags: 'text' });

module.exports = mongoose.model('Question', QuestionSchema);