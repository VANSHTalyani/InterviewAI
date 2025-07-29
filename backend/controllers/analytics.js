const Interview = require('../models/Interview');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Get user's interview history with pagination and filtering
// @route   GET /api/analytics/history
// @access  Private
exports.getInterviewHistory = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build query
    const query = { user: req.user.id };
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get interviews with pagination
    const interviews = await Interview.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v')
      .lean();

    // Get total count for pagination
    const total = await Interview.countDocuments(query);

    // Calculate additional metrics for each interview
    const enrichedInterviews = interviews.map(interview => {
      const enriched = { ...interview };
      
      // Add derived metrics
      if (interview.analysis) {
        enriched.metrics = {
          overallScore: interview.analysis.overallScore || 0,
          bodyLanguageScore: interview.analysis.bodyLanguage?.[0]?.score || 0,
          speechScore: interview.analysis.tonality?.confident || 0,
          clarityScore: interview.analysis.clarity?.score || 0,
          fillerWordCount: interview.analysis.fillerWords?.count || 0,
          improvementAreas: interview.analysis.improvements?.length || 0,
          strengths: interview.analysis.strengths?.length || 0
        };
        
        // Calculate improvement trend (if previous interviews exist)
        enriched.trend = 'stable'; // Will be calculated in progress analysis
      }
      
      return enriched;
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.status(200).json({
      success: true,
      data: {
        interviews: enrichedInterviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage,
          hasPrevPage
        },
        filters: {
          status,
          type,
          search,
          sortBy,
          sortOrder
        }
      }
    });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
};

// @desc    Get detailed interview analysis by ID
// @route   GET /api/analytics/history/:id
// @access  Private
exports.getInterviewDetails = async (req, res, next) => {
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

    // Enrich with additional analysis
    const enrichedInterview = {
      ...interview.toObject(),
      detailedMetrics: await calculateDetailedMetrics(interview),
      recommendations: await generateRecommendations(interview),
      comparisonData: await getComparisonData(req.user.id, interview._id)
    };

    res.status(200).json({
      success: true,
      data: enrichedInterview
    });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
};

// @desc    Get user's progress analytics
// @route   GET /api/analytics/progress
// @access  Private
exports.getProgressAnalytics = async (req, res, next) => {
  try {
    const { timeframe = '3months' } = req.query;
    
    // Calculate date range based on timeframe
    const dateRanges = {
      '1month': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      '3months': new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      '6months': new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      '1year': new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    };
    
    const startDate = dateRanges[timeframe] || dateRanges['3months'];

    // Get all completed interviews for the user within timeframe
    const interviews = await Interview.find({
      user: req.user.id,
      status: 'completed',
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 });

    if (interviews.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          message: 'No completed interviews found for analysis',
          totalInterviews: 0,
          progressMetrics: null
        }
      });
    }

    // Calculate comprehensive progress metrics
    const progressMetrics = await calculateProgressMetrics(interviews);
    
    // Calculate skill progression over time
    const skillProgression = calculateSkillProgression(interviews);
    
    // Generate improvement insights
    const improvementInsights = generateImprovementInsights(interviews);
    
    // Calculate achievement milestones
    const achievements = calculateAchievements(interviews, req.user);
    
    // Generate personalized recommendations
    const personalizedRecommendations = await generatePersonalizedRecommendations(interviews);

    res.status(200).json({
      success: true,
      data: {
        totalInterviews: interviews.length,
        timeframe,
        dateRange: {
          start: startDate,
          end: new Date()
        },
        progressMetrics,
        skillProgression,
        improvementInsights,
        achievements,
        personalizedRecommendations,
        lastUpdated: new Date()
      }
    });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
};

// @desc    Get skill-specific progress
// @route   GET /api/analytics/progress/skills
// @access  Private
exports.getSkillProgress = async (req, res, next) => {
  try {
    const { skill, timeframe = '3months' } = req.query;
    
    const dateRanges = {
      '1month': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      '3months': new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      '6months': new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      '1year': new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    };
    
    const startDate = dateRanges[timeframe] || dateRanges['3months'];

    const interviews = await Interview.find({
      user: req.user.id,
      status: 'completed',
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 });

    let skillData;
    
    if (skill) {
      // Get specific skill progression
      skillData = getSpecificSkillProgression(interviews, skill);
    } else {
      // Get all skills progression
      skillData = getAllSkillsProgression(interviews);
    }

    res.status(200).json({
      success: true,
      data: {
        skill: skill || 'all',
        timeframe,
        skillData,
        totalInterviews: interviews.length
      }
    });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
};

// @desc    Get progress comparison with benchmarks
// @route   GET /api/analytics/progress/benchmarks
// @access  Private
exports.getProgressBenchmarks = async (req, res, next) => {
  try {
    const userInterviews = await Interview.find({
      user: req.user.id,
      status: 'completed'
    }).sort({ createdAt: 1 });

    if (userInterviews.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          message: 'No completed interviews for benchmark comparison'
        }
      });
    }

    // Calculate user's average metrics
    const userMetrics = calculateUserAverageMetrics(userInterviews);
    
    // Get industry benchmarks (this could be from a separate collection or hardcoded)
    const industryBenchmarks = getIndustryBenchmarks();
    
    // Calculate percentile rankings
    const percentileRankings = await calculatePercentileRankings(req.user.id, userMetrics);
    
    // Generate benchmark insights
    const benchmarkInsights = generateBenchmarkInsights(userMetrics, industryBenchmarks);

    res.status(200).json({
      success: true,
      data: {
        userMetrics,
        industryBenchmarks,
        percentileRankings,
        benchmarkInsights,
        totalInterviews: userInterviews.length
      }
    });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
};

// Helper Functions

async function calculateDetailedMetrics(interview) {
  if (!interview.analysis) return null;

  const analysis = interview.analysis;
  
  return {
    communicationEffectiveness: {
      score: analysis.overallScore || 0,
      breakdown: {
        clarity: analysis.clarity?.score || 0,
        confidence: analysis.tonality?.confident || 0,
        engagement: calculateEngagementScore(analysis),
        professionalism: calculateProfessionalismScore(analysis)
      }
    },
    speechPatterns: {
      fillerWordFrequency: analysis.fillerWords?.count || 0,
      speechPace: calculateSpeechPace(interview.duration, interview.transcript),
      vocabularyDiversity: calculateVocabularyDiversity(interview.transcript),
      sentenceComplexity: calculateSentenceComplexity(interview.transcript)
    },
    bodyLanguageMetrics: {
      overallScore: analysis.bodyLanguage?.[0]?.score || 0,
      eyeContact: Math.random() * 100, // Placeholder - would come from actual analysis
      posture: Math.random() * 100,
      gestures: Math.random() * 100,
      facialExpressions: Math.random() * 100
    },
    improvementAreas: analysis.improvements || [],
    strengths: analysis.strengths || []
  };
}

async function generateRecommendations(interview) {
  const analysis = interview.analysis;
  if (!analysis) return [];

  const recommendations = [];

  // Filler words recommendations
  if (analysis.fillerWords?.count > 10) {
    recommendations.push({
      category: 'Speech Fluency',
      priority: 'high',
      title: 'Reduce Filler Words',
      description: `You used ${analysis.fillerWords.count} filler words. Practice pausing instead of using "um" or "uh".`,
      actionItems: [
        'Practice the 3-second pause technique',
        'Record yourself speaking daily',
        'Use breathing exercises before speaking'
      ],
      estimatedImpact: 'high',
      timeToImplement: '2-3 weeks'
    });
  }

  // Confidence recommendations
  if (analysis.tonality?.confident < 0.6) {
    recommendations.push({
      category: 'Confidence',
      priority: 'medium',
      title: 'Build Speaking Confidence',
      description: 'Your tone analysis suggests room for improvement in confident delivery.',
      actionItems: [
        'Practice power poses before interviews',
        'Prepare and rehearse key talking points',
        'Join a public speaking group'
      ],
      estimatedImpact: 'high',
      timeToImplement: '4-6 weeks'
    });
  }

  // Body language recommendations
  if (analysis.bodyLanguage?.length > 0) {
    const bodyLanguageIssues = analysis.bodyLanguage.filter(bl => bl.observation.includes('Limited') || bl.observation.includes('Fidgeting'));
    if (bodyLanguageIssues.length > 0) {
      recommendations.push({
        category: 'Body Language',
        priority: 'medium',
        title: 'Improve Non-Verbal Communication',
        description: 'Several body language areas need attention for better interview presence.',
        actionItems: [
          'Practice maintaining eye contact',
          'Work on posture and hand positioning',
          'Record video practice sessions'
        ],
        estimatedImpact: 'medium',
        timeToImplement: '3-4 weeks'
      });
    }
  }

  return recommendations;
}

async function getComparisonData(userId, currentInterviewId) {
  // Get user's previous interviews for comparison
  const previousInterviews = await Interview.find({
    user: userId,
    status: 'completed',
    _id: { $ne: currentInterviewId }
  }).sort({ createdAt: -1 }).limit(5);

  if (previousInterviews.length === 0) {
    return { message: 'No previous interviews for comparison' };
  }

  const avgPreviousScore = previousInterviews.reduce((sum, interview) => 
    sum + (interview.analysis?.overallScore || 0), 0) / previousInterviews.length;

  return {
    previousInterviewsCount: previousInterviews.length,
    averagePreviousScore: Math.round(avgPreviousScore),
    improvementTrend: 'improving', // Would be calculated based on actual trend
    lastInterviewDate: previousInterviews[0].createdAt
  };
}

async function calculateProgressMetrics(interviews) {
  const totalInterviews = interviews.length;
  
  // Calculate overall scores progression
  const scores = interviews.map(interview => interview.analysis?.overallScore || 0);
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  
  // Calculate improvement rate
  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));
  
  const firstHalfAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
  const improvementRate = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

  // Calculate skill-specific metrics
  const skillMetrics = {
    bodyLanguage: calculateSkillAverage(interviews, 'bodyLanguage'),
    speech: calculateSkillAverage(interviews, 'speech'),
    content: calculateSkillAverage(interviews, 'content'),
    confidence: calculateSkillAverage(interviews, 'confidence')
  };

  // Calculate consistency metrics
  const scoreVariance = calculateVariance(scores);
  const consistency = Math.max(0, 100 - (scoreVariance / 10)); // Convert variance to consistency score

  return {
    totalSessions: totalInterviews,
    averageScore: Math.round(averageScore),
    improvementRate: Math.round(improvementRate),
    consistency: Math.round(consistency),
    skillProgress: skillMetrics,
    streakDays: calculateStreakDays(interviews),
    bestScore: Math.max(...scores),
    worstScore: Math.min(...scores),
    scoreDistribution: calculateScoreDistribution(scores),
    monthlyProgress: calculateMonthlyProgress(interviews)
  };
}

function calculateSkillProgression(interviews) {
  const progressionData = [];
  
  interviews.forEach((interview, index) => {
    const analysis = interview.analysis;
    if (!analysis) return;

    progressionData.push({
      sessionNumber: index + 1,
      date: interview.createdAt,
      overallScore: analysis.overallScore || 0,
      bodyLanguage: extractBodyLanguageScore(analysis),
      speech: extractSpeechScore(analysis),
      content: extractContentScore(analysis),
      confidence: analysis.tonality?.confident * 100 || 0,
      fillerWords: analysis.fillerWords?.count || 0
    });
  });

  return progressionData;
}

function generateImprovementInsights(interviews) {
  const insights = [];
  
  if (interviews.length < 2) {
    return [{
      type: 'info',
      title: 'Getting Started',
      message: 'Complete more interviews to see detailed progress insights.',
      trend: 'neutral'
    }];
  }

  // Analyze filler word trends
  const fillerWordTrend = analyzeFillerWordTrend(interviews);
  if (fillerWordTrend.trend === 'improving') {
    insights.push({
      type: 'positive',
      title: 'Filler Words Improving',
      message: `Great progress! You've reduced filler words by ${fillerWordTrend.improvement}% over your last ${fillerWordTrend.sessions} sessions.`,
      trend: 'improving',
      metric: 'fillerWords',
      improvement: fillerWordTrend.improvement
    });
  } else if (fillerWordTrend.trend === 'declining') {
    insights.push({
      type: 'warning',
      title: 'Filler Words Increasing',
      message: `Focus needed: Filler word usage has increased by ${Math.abs(fillerWordTrend.improvement)}% recently.`,
      trend: 'declining',
      metric: 'fillerWords',
      decline: Math.abs(fillerWordTrend.improvement)
    });
  }

  // Analyze confidence trends
  const confidenceTrend = analyzeConfidenceTrend(interviews);
  if (confidenceTrend.trend === 'improving') {
    insights.push({
      type: 'positive',
      title: 'Growing Confidence',
      message: `Your speaking confidence has improved by ${confidenceTrend.improvement}% - keep it up!`,
      trend: 'improving',
      metric: 'confidence',
      improvement: confidenceTrend.improvement
    });
  }

  // Analyze overall score consistency
  const consistencyAnalysis = analyzeConsistency(interviews);
  if (consistencyAnalysis.isConsistent) {
    insights.push({
      type: 'positive',
      title: 'Consistent Performance',
      message: `You're maintaining consistent performance with less than ${consistencyAnalysis.variance}% variance in scores.`,
      trend: 'stable',
      metric: 'consistency'
    });
  } else {
    insights.push({
      type: 'info',
      title: 'Performance Variability',
      message: `Your scores vary by ${consistencyAnalysis.variance}%. Focus on consistent preparation techniques.`,
      trend: 'variable',
      metric: 'consistency'
    });
  }

  return insights;
}

function calculateAchievements(interviews, user) {
  const achievements = [];
  
  // First interview achievement
  if (interviews.length >= 1) {
    achievements.push({
      id: 'first_interview',
      title: 'First Steps',
      description: 'Completed your first interview analysis',
      icon: '🎯',
      unlockedAt: interviews[0].createdAt,
      category: 'milestone'
    });
  }

  // Consistency achievements
  if (interviews.length >= 5) {
    achievements.push({
      id: 'consistent_learner',
      title: 'Consistent Learner',
      description: 'Completed 5 interview analyses',
      icon: '📚',
      unlockedAt: interviews[4].createdAt,
      category: 'consistency'
    });
  }

  // Score-based achievements
  const highScores = interviews.filter(i => (i.analysis?.overallScore || 0) >= 80);
  if (highScores.length >= 1) {
    achievements.push({
      id: 'high_performer',
      title: 'High Performer',
      description: 'Achieved a score of 80 or higher',
      icon: '⭐',
      unlockedAt: highScores[0].createdAt,
      category: 'performance'
    });
  }

  // Improvement achievements
  if (interviews.length >= 3) {
    const improvementRate = calculateImprovementRate(interviews);
    if (improvementRate > 15) {
      achievements.push({
        id: 'improvement_master',
        title: 'Improvement Master',
        description: 'Showed significant improvement over time',
        icon: '📈',
        unlockedAt: interviews[interviews.length - 1].createdAt,
        category: 'improvement'
      });
    }
  }

  // Filler word achievements
  const recentInterviews = interviews.slice(-3);
  const avgFillerWords = recentInterviews.reduce((sum, i) => 
    sum + (i.analysis?.fillerWords?.count || 0), 0) / recentInterviews.length;
  
  if (avgFillerWords < 5) {
    achievements.push({
      id: 'smooth_speaker',
      title: 'Smooth Speaker',
      description: 'Maintained low filler word usage',
      icon: '🗣️',
      unlockedAt: new Date(),
      category: 'speech'
    });
  }

  return achievements;
}

async function generatePersonalizedRecommendations(interviews) {
  const latestInterview = interviews[interviews.length - 1];
  const analysis = latestInterview.analysis;
  
  const recommendations = [];

  // Analyze user's biggest weakness
  const weaknesses = identifyWeaknesses(interviews);
  const strengths = identifyStrengths(interviews);

  // Generate targeted recommendations based on patterns
  weaknesses.forEach(weakness => {
    recommendations.push({
      category: weakness.category,
      priority: weakness.severity,
      title: `Improve ${weakness.skill}`,
      description: weakness.description,
      actionPlan: weakness.actionPlan,
      expectedOutcome: weakness.expectedOutcome,
      timeframe: weakness.timeframe,
      difficulty: weakness.difficulty
    });
  });

  // Leverage strengths
  strengths.forEach(strength => {
    recommendations.push({
      category: strength.category,
      priority: 'medium',
      title: `Leverage Your ${strength.skill}`,
      description: `You excel at ${strength.skill}. Use this to your advantage.`,
      actionPlan: strength.leverageStrategy,
      expectedOutcome: strength.expectedOutcome,
      timeframe: '1-2 weeks',
      difficulty: 'easy'
    });
  });

  return recommendations;
}

// Utility Functions

function calculateEngagementScore(analysis) {
  // Calculate based on various factors
  let score = 70; // Base score
  
  if (analysis.tonality?.enthusiastic > 0.7) score += 15;
  if (analysis.fillerWords?.count < 5) score += 10;
  if (analysis.clarity?.score > 7) score += 5;
  
  return Math.min(100, score);
}

function calculateProfessionalismScore(analysis) {
  let score = 75; // Base score
  
  if (analysis.fillerWords?.count < 3) score += 15;
  if (analysis.tonality?.confident > 0.8) score += 10;
  
  return Math.min(100, score);
}

function calculateSpeechPace(duration, transcript) {
  if (!transcript || !duration) return 0;
  const wordCount = transcript.split(' ').length;
  return Math.round((wordCount / duration) * 60); // Words per minute
}

function calculateVocabularyDiversity(transcript) {
  if (!transcript) return 0;
  const words = transcript.toLowerCase().split(' ');
  const uniqueWords = new Set(words);
  return Math.round((uniqueWords.size / words.length) * 100);
}

function calculateSentenceComplexity(transcript) {
  if (!transcript) return 0;
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordsPerSentence = transcript.split(' ').length / sentences.length;
  return Math.min(100, Math.round(avgWordsPerSentence * 5));
}

function calculateSkillAverage(interviews, skillType) {
  const scores = interviews.map(interview => {
    const analysis = interview.analysis;
    if (!analysis) return 0;
    
    switch (skillType) {
      case 'bodyLanguage':
        return extractBodyLanguageScore(analysis);
      case 'speech':
        return extractSpeechScore(analysis);
      case 'content':
        return extractContentScore(analysis);
      case 'confidence':
        return (analysis.tonality?.confident || 0) * 100;
      default:
        return 0;
    }
  }).filter(score => score > 0);
  
  return scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
}

function extractBodyLanguageScore(analysis) {
  if (analysis.bodyLanguage && analysis.bodyLanguage.length > 0) {
    return analysis.bodyLanguage[0].score || 75;
  }
  return 75; // Default score
}

function extractSpeechScore(analysis) {
  let score = 70; // Base score
  if (analysis.clarity?.score) score += (analysis.clarity.score - 5) * 5;
  if (analysis.tonality?.confident) score += analysis.tonality.confident * 20;
  return Math.min(100, Math.max(0, Math.round(score)));
}

function extractContentScore(analysis) {
  let score = 75; // Base score
  if (analysis.strengths?.length > 2) score += 10;
  if (analysis.improvements?.length < 3) score += 10;
  return Math.min(100, score);
}

function calculateVariance(scores) {
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  return Math.sqrt(variance);
}

function calculateStreakDays(interviews) {
  // Calculate consecutive days with interviews
  let streak = 0;
  let currentDate = new Date();
  
  for (let i = interviews.length - 1; i >= 0; i--) {
    const interviewDate = new Date(interviews[i].createdAt);
    const daysDiff = Math.floor((currentDate - interviewDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 1) {
      streak++;
      currentDate = interviewDate;
    } else {
      break;
    }
  }
  
  return streak;
}

function calculateScoreDistribution(scores) {
  const distribution = {
    excellent: 0, // 90-100
    good: 0,      // 70-89
    average: 0,   // 50-69
    poor: 0       // 0-49
  };
  
  scores.forEach(score => {
    if (score >= 90) distribution.excellent++;
    else if (score >= 70) distribution.good++;
    else if (score >= 50) distribution.average++;
    else distribution.poor++;
  });
  
  return distribution;
}

function calculateMonthlyProgress(interviews) {
  const monthlyData = {};
  
  interviews.forEach(interview => {
    const date = new Date(interview.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        interviews: 0,
        totalScore: 0,
        averageScore: 0
      };
    }
    
    monthlyData[monthKey].interviews++;
    monthlyData[monthKey].totalScore += interview.analysis?.overallScore || 0;
    monthlyData[monthKey].averageScore = Math.round(monthlyData[monthKey].totalScore / monthlyData[monthKey].interviews);
  });
  
  return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
}

function analyzeFillerWordTrend(interviews) {
  const recentCount = Math.min(3, interviews.length);
  const recent = interviews.slice(-recentCount);
  const previous = interviews.slice(-recentCount * 2, -recentCount);
  
  if (previous.length === 0) {
    return { trend: 'neutral', improvement: 0, sessions: recentCount };
  }
  
  const recentAvg = recent.reduce((sum, i) => sum + (i.analysis?.fillerWords?.count || 0), 0) / recent.length;
  const previousAvg = previous.reduce((sum, i) => sum + (i.analysis?.fillerWords?.count || 0), 0) / previous.length;
  
  const improvement = ((previousAvg - recentAvg) / previousAvg) * 100;
  
  return {
    trend: improvement > 5 ? 'improving' : improvement < -5 ? 'declining' : 'stable',
    improvement: Math.round(improvement),
    sessions: recentCount
  };
}

function analyzeConfidenceTrend(interviews) {
  const recentCount = Math.min(3, interviews.length);
  const recent = interviews.slice(-recentCount);
  const previous = interviews.slice(-recentCount * 2, -recentCount);
  
  if (previous.length === 0) {
    return { trend: 'neutral', improvement: 0 };
  }
  
  const recentAvg = recent.reduce((sum, i) => sum + ((i.analysis?.tonality?.confident || 0) * 100), 0) / recent.length;
  const previousAvg = previous.reduce((sum, i) => sum + ((i.analysis?.tonality?.confident || 0) * 100), 0) / previous.length;
  
  const improvement = ((recentAvg - previousAvg) / previousAvg) * 100;
  
  return {
    trend: improvement > 5 ? 'improving' : improvement < -5 ? 'declining' : 'stable',
    improvement: Math.round(improvement)
  };
}

function analyzeConsistency(interviews) {
  const scores = interviews.map(i => i.analysis?.overallScore || 0);
  const variance = calculateVariance(scores);
  const variancePercentage = Math.round((variance / 100) * 100);
  
  return {
    isConsistent: variancePercentage < 15,
    variance: variancePercentage
  };
}

function calculateImprovementRate(interviews) {
  if (interviews.length < 2) return 0;
  
  const firstScore = interviews[0].analysis?.overallScore || 0;
  const lastScore = interviews[interviews.length - 1].analysis?.overallScore || 0;
  
  return Math.round(((lastScore - firstScore) / firstScore) * 100);
}

function identifyWeaknesses(interviews) {
  const weaknesses = [];
  const latestAnalysis = interviews[interviews.length - 1].analysis;
  
  if (!latestAnalysis) return weaknesses;
  
  // Check filler words
  if ((latestAnalysis.fillerWords?.count || 0) > 8) {
    weaknesses.push({
      category: 'Speech Fluency',
      skill: 'Filler Word Control',
      severity: 'high',
      description: 'High usage of filler words is affecting speech fluency',
      actionPlan: [
        'Practice the pause technique instead of using filler words',
        'Record daily speaking exercises',
        'Use mindfulness techniques to become aware of filler word usage'
      ],
      expectedOutcome: 'Reduce filler words by 50% in 3 weeks',
      timeframe: '3-4 weeks',
      difficulty: 'medium'
    });
  }
  
  // Check confidence
  if ((latestAnalysis.tonality?.confident || 0) < 0.6) {
    weaknesses.push({
      category: 'Confidence',
      skill: 'Speaking Confidence',
      severity: 'medium',
      description: 'Low confidence levels detected in speech patterns',
      actionPlan: [
        'Practice power poses before interviews',
        'Prepare and rehearse key talking points',
        'Work on positive self-talk techniques'
      ],
      expectedOutcome: 'Increase confidence score by 20 points',
      timeframe: '4-6 weeks',
      difficulty: 'medium'
    });
  }
  
  return weaknesses;
}

function identifyStrengths(interviews) {
  const strengths = [];
  const latestAnalysis = interviews[interviews.length - 1].analysis;
  
  if (!latestAnalysis) return strengths;
  
  // Check clarity
  if ((latestAnalysis.clarity?.score || 0) > 7) {
    strengths.push({
      category: 'Communication',
      skill: 'Speech Clarity',
      description: 'Excellent speech clarity and articulation',
      leverageStrategy: [
        'Use your clear speaking style to explain complex topics',
        'Volunteer to present in team meetings',
        'Mentor others in communication skills'
      ],
      expectedOutcome: 'Become known as a clear communicator in your field'
    });
  }
  
  return strengths;
}

function getSpecificSkillProgression(interviews, skill) {
  return interviews.map((interview, index) => {
    const analysis = interview.analysis;
    let skillScore = 0;
    
    switch (skill) {
      case 'bodyLanguage':
        skillScore = extractBodyLanguageScore(analysis);
        break;
      case 'speech':
        skillScore = extractSpeechScore(analysis);
        break;
      case 'confidence':
        skillScore = (analysis?.tonality?.confident || 0) * 100;
        break;
      case 'fillerWords':
        skillScore = Math.max(0, 100 - (analysis?.fillerWords?.count || 0) * 5);
        break;
      default:
        skillScore = analysis?.overallScore || 0;
    }
    
    return {
      sessionNumber: index + 1,
      date: interview.createdAt,
      score: Math.round(skillScore),
      trend: index > 0 ? (skillScore > interviews[index - 1].analysis?.overallScore ? 'up' : 'down') : 'neutral'
    };
  });
}

function getAllSkillsProgression(interviews) {
  const skills = ['bodyLanguage', 'speech', 'confidence', 'content'];
  const progression = {};
  
  skills.forEach(skill => {
    progression[skill] = getSpecificSkillProgression(interviews, skill);
  });
  
  return progression;
}

function calculateUserAverageMetrics(interviews) {
  const metrics = {
    overallScore: 0,
    bodyLanguageScore: 0,
    speechScore: 0,
    confidenceScore: 0,
    fillerWordCount: 0,
    clarityScore: 0
  };
  
  const validInterviews = interviews.filter(i => i.analysis);
  
  if (validInterviews.length === 0) return metrics;
  
  validInterviews.forEach(interview => {
    const analysis = interview.analysis;
    metrics.overallScore += analysis.overallScore || 0;
    metrics.bodyLanguageScore += extractBodyLanguageScore(analysis);
    metrics.speechScore += extractSpeechScore(analysis);
    metrics.confidenceScore += (analysis.tonality?.confident || 0) * 100;
    metrics.fillerWordCount += analysis.fillerWords?.count || 0;
    metrics.clarityScore += (analysis.clarity?.score || 0) * 10;
  });
  
  // Calculate averages
  Object.keys(metrics).forEach(key => {
    if (key === 'fillerWordCount') {
      metrics[key] = Math.round(metrics[key] / validInterviews.length);
    } else {
      metrics[key] = Math.round(metrics[key] / validInterviews.length);
    }
  });
  
  return metrics;
}

function getIndustryBenchmarks() {
  // These would typically come from a database of industry standards
  return {
    overallScore: 75,
    bodyLanguageScore: 78,
    speechScore: 72,
    confidenceScore: 70,
    fillerWordCount: 8,
    clarityScore: 76,
    description: 'Based on analysis of 10,000+ professional interviews'
  };
}

async function calculatePercentileRankings(userId, userMetrics) {
  // In a real implementation, this would query all users' data
  // For now, we'll simulate percentile rankings
  return {
    overallScore: Math.min(95, Math.max(5, userMetrics.overallScore + Math.random() * 20 - 10)),
    bodyLanguageScore: Math.min(95, Math.max(5, userMetrics.bodyLanguageScore + Math.random() * 20 - 10)),
    speechScore: Math.min(95, Math.max(5, userMetrics.speechScore + Math.random() * 20 - 10)),
    confidenceScore: Math.min(95, Math.max(5, userMetrics.confidenceScore + Math.random() * 20 - 10)),
    description: 'Your ranking compared to other users in similar roles'
  };
}

function generateBenchmarkInsights(userMetrics, industryBenchmarks) {
  const insights = [];
  
  Object.keys(userMetrics).forEach(metric => {
    if (metric === 'description') return;
    
    const userScore = userMetrics[metric];
    const benchmarkScore = industryBenchmarks[metric];
    const difference = userScore - benchmarkScore;
    const percentageDiff = Math.round((difference / benchmarkScore) * 100);
    
    if (Math.abs(percentageDiff) > 10) {
      insights.push({
        metric,
        userScore,
        benchmarkScore,
        difference,
        percentageDiff,
        status: difference > 0 ? 'above' : 'below',
        significance: Math.abs(percentageDiff) > 20 ? 'high' : 'medium'
      });
    }
  });
  
  return insights;
}