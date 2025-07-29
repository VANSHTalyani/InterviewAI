const Analysis = require('../models/Analysis');
const Interview = require('../models/Interview');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Save analysis results to database
// @route   POST /api/analysis/save
// @access  Private
exports.saveAnalysis = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      filename,
      originalFilename,
      fileSize,
      duration,
      analysisResults,
      rawAnalysisData,
      transcription,
      processingTime
    } = req.body;

    // Create interview record first
    const interview = await Interview.create({
      user: req.user.id,
      title: originalFilename || 'Interview Analysis',
      type: 'behavioral', // Default type
      status: 'completed',
      duration: duration,
      analysis: {
        overallScore: analysisResults.overallScore,
        fillerWords: {
          count: analysisResults.speech?.fillerWords?.length || 0,
          words: analysisResults.speech?.fillerWords?.map(fw => ({
            word: fw.word,
            count: 1,
            timestamps: [fw.timestamp]
          })) || []
        },
        tonality: {
          confident: (analysisResults.overallScore || 0) / 100
        },
        clarity: {
          score: (analysisResults.speech?.clarity || 0) / 10,
          feedback: 'Analysis completed successfully'
        },
        bodyLanguage: analysisResults.bodyLanguage?.insights?.map((insight, index) => ({
          timestamp: index * 30, // Distribute insights across timeline
          observation: insight,
          suggestion: 'Continue practicing this aspect',
          eventType: 'highlight',
          severity: 'low'
        })) || [],
        strengths: analysisResults.recommendations?.filter((_, index) => index % 2 === 0) || [],
        improvements: analysisResults.recommendations?.filter((_, index) => index % 2 === 1) || [],
        summary: `Analysis completed with overall score of ${analysisResults.overallScore || 0}`
      },
      transcript: transcription?.text || ''
    });

    // Create analysis record
    const analysis = await Analysis.create({
      user: req.user.id,
      interview: interview._id,
      filename,
      originalFilename: originalFilename || filename,
      fileSize: fileSize || 0,
      duration: duration || 0,
      analysisResults,
      rawAnalysisData,
      transcription,
      processingTime: processingTime || 0,
      status: 'completed',
      savedByUser: true,
      userDecisionAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Analysis saved successfully',
      data: {
        analysisId: analysis._id,
        interviewId: interview._id,
        analysis: analysis
      }
    });
  } catch (err) {
    console.error('Save analysis error:', err.message);
    next(err);
  }
};

// @desc    Get user's saved analyses
// @route   GET /api/analysis/history
// @access  Private
exports.getAnalysisHistory = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { 
      user: req.user.id,
      savedByUser: true
    };
    
    if (status) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get analyses with pagination
    const analyses = await Analysis.find(query)
      .populate('interview', 'title type status')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-rawAnalysisData') // Exclude large raw data
      .lean();

    // Get total count for pagination
    const total = await Analysis.countDocuments(query);

    // Transform data for frontend compatibility
    const transformedAnalyses = analyses.map(analysis => ({
      id: analysis._id,
      title: analysis.originalFilename,
      duration: analysis.duration,
      uploadedAt: analysis.createdAt,
      createdAt: analysis.createdAt,
      status: 'completed',
      analysis: analysis.analysisResults,
      metrics: {
        overallScore: analysis.analysisResults?.overallScore || 0,
        bodyLanguageScore: analysis.analysisResults?.bodyLanguage?.score || 0,
        speechScore: analysis.analysisResults?.speech?.score || 0,
        clarityScore: analysis.analysisResults?.speech?.clarity || 0,
        fillerWordCount: analysis.analysisResults?.speech?.fillerWords?.length || 0,
        improvementAreas: analysis.analysisResults?.recommendations?.length || 0,
        strengths: analysis.analysisResults?.bodyLanguage?.insights?.length || 0
      },
      trend: 'stable' // Will be calculated based on historical data
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.status(200).json({
      success: true,
      data: {
        interviews: transformedAnalyses,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage,
          hasPrevPage
        }
      }
    });
  } catch (err) {
    console.error('Get analysis history error:', err.message);
    next(err);
  }
};

// @desc    Get single analysis by ID
// @route   GET /api/analysis/:id
// @access  Private
exports.getAnalysisById = async (req, res, next) => {
  try {
    const analysis = await Analysis.findById(req.params.id)
      .populate('interview')
      .populate('user', 'name email');

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    // Make sure user owns the analysis
    if (analysis.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this analysis'
      });
    }

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (err) {
    console.error('Get analysis by ID error:', err.message);
    next(err);
  }
};

// @desc    Update analysis (save/discard decision)
// @route   PUT /api/analysis/:id/decision
// @access  Private
exports.updateAnalysisDecision = async (req, res, next) => {
  try {
    const { decision } = req.body; // 'save' or 'discard'
    
    if (!['save', 'discard'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Decision must be either "save" or "discard"'
      });
    }

    const analysis = await Analysis.findById(req.params.id);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    // Make sure user owns the analysis
    if (analysis.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this analysis'
      });
    }

    // Update analysis based on decision
    analysis.savedByUser = decision === 'save';
    analysis.userDecisionAt = new Date();
    await analysis.save();

    // If discarded, also update the interview status
    if (decision === 'discard') {
      await Interview.findByIdAndUpdate(analysis.interview, {
        status: 'discarded'
      });
    }

    res.status(200).json({
      success: true,
      message: `Analysis ${decision}d successfully`,
      data: analysis
    });
  } catch (err) {
    console.error('Update analysis decision error:', err.message);
    next(err);
  }
};

// @desc    Delete analysis
// @route   DELETE /api/analysis/:id
// @access  Private
exports.deleteAnalysis = async (req, res, next) => {
  try {
    const analysis = await Analysis.findById(req.params.id);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    // Make sure user owns the analysis
    if (analysis.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this analysis'
      });
    }

    // Delete associated interview if it exists
    if (analysis.interview) {
      await Interview.findByIdAndDelete(analysis.interview);
    }

    await analysis.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Analysis deleted successfully'
    });
  } catch (err) {
    console.error('Delete analysis error:', err.message);
    next(err);
  }
};

// @desc    Get user analysis statistics
// @route   GET /api/analysis/stats
// @access  Private
exports.getAnalysisStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get comprehensive stats
    const stats = await Analysis.aggregate([
      { 
        $match: { 
          user: mongoose.Types.ObjectId(userId),
          savedByUser: true,
          status: 'completed'
        } 
      },
      {
        $group: {
          _id: null,
          totalAnalyses: { $sum: 1 },
          averageScore: { $avg: '$analysisResults.overallScore' },
          totalDuration: { $sum: '$duration' },
          averageFillerWords: { 
            $avg: { $size: { $ifNull: ['$analysisResults.speech.fillerWords', []] } }
          },
          bestScore: { $max: '$analysisResults.overallScore' },
          worstScore: { $min: '$analysisResults.overallScore' }
        }
      }
    ]);

    // Get recent analyses for trend calculation
    const recentAnalyses = await Analysis.find({
      user: userId,
      savedByUser: true,
      status: 'completed'
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('analysisResults.overallScore createdAt');

    // Calculate improvement trend
    let improvementRate = 0;
    if (recentAnalyses.length >= 2) {
      const firstHalf = recentAnalyses.slice(Math.floor(recentAnalyses.length / 2));
      const secondHalf = recentAnalyses.slice(0, Math.floor(recentAnalyses.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, a) => sum + (a.analysisResults?.overallScore || 0), 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, a) => sum + (a.analysisResults?.overallScore || 0), 0) / secondHalf.length;
      
      improvementRate = ((secondAvg - firstAvg) / firstAvg) * 100;
    }

    // Calculate streak days
    const today = new Date();
    let streakDays = 0;
    const sortedAnalyses = recentAnalyses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    for (let i = 0; i < sortedAnalyses.length; i++) {
      const analysisDate = new Date(sortedAnalyses[i].createdAt);
      const daysDiff = Math.floor((today - analysisDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= i + 1) {
        streakDays++;
      } else {
        break;
      }
    }

    const result = stats[0] || {
      totalAnalyses: 0,
      averageScore: 0,
      totalDuration: 0,
      averageFillerWords: 0,
      bestScore: 0,
      worstScore: 0
    };

    res.status(200).json({
      success: true,
      data: {
        totalSessions: result.totalAnalyses,
        averageScore: Math.round(result.averageScore || 0),
        improvementRate: Math.round(improvementRate),
        streakDays: streakDays,
        totalDuration: result.totalDuration,
        averageFillerWords: Math.round(result.averageFillerWords || 0),
        bestScore: result.bestScore || 0,
        worstScore: result.worstScore || 0,
        skillProgress: {
          bodyLanguage: Math.round(result.averageScore * 0.9 || 75),
          speech: Math.round(result.averageScore * 0.8 || 70),
          content: Math.round(result.averageScore * 1.1 || 80)
        }
      }
    });
  } catch (err) {
    console.error('Get analysis stats error:', err.message);
    next(err);
  }
};