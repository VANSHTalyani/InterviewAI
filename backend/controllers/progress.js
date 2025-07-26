const Interview = require('../models/Interview');

// @desc    Get user progress analytics
// @route   GET /api/interviews/progress
// @access  Private
exports.getProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all completed interviews for the user
    const interviews = await Interview.find({ 
      user: userId, 
      status: 'completed',
      'analysis.overallScore': { $exists: true }
    }).sort({ createdAt: 1 });

    if (interviews.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalSessions: 0,
          averageScore: 0,
          improvementRate: 0,
          streakDays: 0,
          skillProgress: {
            bodyLanguage: 0,
            speech: 0,
            content: 0,
          },
          progressOverTime: [],
          weeklyData: [],
          insights: []
        }
      });
    }

    // Calculate overall metrics
    const totalSessions = interviews.length;
    const overallScores = interviews.map(i => i.analysis.overallScore || 0);
    const averageScore = Math.round(overallScores.reduce((a, b) => a + b, 0) / totalSessions);

    // Calculate improvement rate (last 3 vs first 3 sessions)
    let improvementRate = 0;
    if (totalSessions >= 6) {
      const firstThree = overallScores.slice(0, 3);
      const lastThree = overallScores.slice(-3);
      const firstAvg = firstThree.reduce((a, b) => a + b, 0) / 3;
      const lastAvg = lastThree.reduce((a, b) => a + b, 0) / 3;
      improvementRate = Math.round(((lastAvg - firstAvg) / firstAvg) * 100);
    }

    // Calculate current skill progress (average of last 5 sessions or all if less than 5)
    const recentSessions = interviews.slice(-5);
    const bodyLanguageScores = [];
    const speechScores = [];
    const contentScores = [];

    recentSessions.forEach(interview => {
      if (interview.analysis.clarity && interview.analysis.clarity.score) {
        bodyLanguageScores.push(interview.analysis.clarity.score * 10); // Convert to percentage
      }
      if (interview.analysis.tonality) {
            const toneScore =
              Object.values(interview.analysis.tonality).reduce((a, b) => a + b, 0) /
              Object.keys(interview.analysis.tonality).length * 100;
        speechScores.push(toneScore);
      }
      contentScores.push(interview.analysis.overallScore);
    });

    const skillProgress = {
      bodyLanguage: bodyLanguageScores.length ? Math.round(bodyLanguageScores.reduce((a, b) => a + b, 0) / bodyLanguageScores.length) : 0,
      speech: speechScores.length ? Math.round(speechScores.reduce((a, b) => a + b, 0) / speechScores.length) : 0,
      content: contentScores.length ? Math.round(contentScores.reduce((a, b) => a + b, 0) / contentScores.length) : 0
    };

    // Progress over time data
    const progressOverTime = interviews.map((interview, index) => {
      const bodyScore = interview.analysis.clarity?.score ? interview.analysis.clarity.score * 10 : skillProgress.bodyLanguage;
            const speechScore = interview.analysis.tonality
              ?
                (Object.values(interview.analysis.tonality).reduce((a, b) => a + b, 0) /
                  Object.keys(interview.analysis.tonality).length) *
                100
              : skillProgress.speech;
      
      return {
        session: index + 1,
        score: interview.analysis.overallScore,
        bodyLanguage: Math.round(bodyScore),
        speech: Math.round(speechScore),
        content: interview.analysis.overallScore,
        date: interview.createdAt
      };
    });

    // Weekly data aggregation
    const weeklyData = aggregateWeeklyData(interviews);

    // Calculate streak days (simplified - consecutive days with sessions)
    const streakDays = calculateStreakDays(interviews);

    // Generate insights
    const insights = generateInsights(interviews, improvementRate, skillProgress);

    res.status(200).json({
      success: true,
      data: {
        totalSessions,
        averageScore,
        improvementRate,
        streakDays,
        skillProgress,
        progressOverTime,
        weeklyData,
        insights
      }
    });

  } catch (err) {
    console.error(err.message);
    next(err);
  }
};

// @desc    Save interview analysis results
// @route   POST /api/interviews/save-analysis
// @access  Private
exports.saveAnalysisResults = async (req, res, next) => {
  try {
    const { interviewId, analysisData } = req.body;

    if (!interviewId || !analysisData) {
      return res.status(400).json({
        success: false,
        message: 'Interview ID and analysis data are required'
      });
    }

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Make sure user owns the interview
    if (interview.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this interview'
      });
    }

    // Convert frontend analysis format to backend format
    const backendAnalysis = {
      overallScore: analysisData.overallScore,
      clarity: {
        score: analysisData.speech?.clarity ? analysisData.speech.clarity / 10 : 7.5,
        feedback: 'Analysis completed successfully'
      },
      tonality: {
        confident: 0.7,
        professional: 0.8,
        clear: 0.75
      },
      bodyLanguage: analysisData.bodyLanguage?.insights?.map((insight, index) => ({
        timestamp: index * 30,
        observation: insight,
        suggestion: 'Continue maintaining good body language'
      })) || [],
      strengths: analysisData.recommendations?.slice(0, 3) || ['Good communication', 'Clear speech', 'Professional demeanor'],
      improvements: analysisData.recommendations?.slice(3) || ['Practice more complex scenarios'],
      summary: `Interview analysis completed with overall score of ${analysisData.overallScore}%`
    };

    // Update interview with analysis results
    const updatedInterview = await Interview.findByIdAndUpdate(
      interviewId,
      {
        analysis: backendAnalysis,
        status: 'completed'
      },
      { new: true, runValidators: false }
    );

    res.status(200).json({
      success: true,
      message: 'Analysis results saved successfully',
      data: updatedInterview
    });

  } catch (err) {
    console.error(err.message);
    next(err);
  }
};

// Helper function to aggregate weekly data
function aggregateWeeklyData(interviews) {
  const weeklyMap = new Map();
  
  interviews.forEach(interview => {
    const date = new Date(interview.createdAt);
    const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, {
        week: `Week ${weeklyMap.size + 1}`,
        sessions: 0,
        totalScore: 0,
        avgScore: 0
      });
    }
    
    const weekData = weeklyMap.get(weekKey);
    weekData.sessions++;
    weekData.totalScore += interview.analysis.overallScore || 0;
    weekData.avgScore = Math.round(weekData.totalScore / weekData.sessions);
  });
  
  return Array.from(weeklyMap.values()).slice(-4); // Last 4 weeks
}

// Helper function to calculate streak days
function calculateStreakDays(interviews) {
  if (interviews.length === 0) return 0;
  
  const today = new Date();
  const dates = interviews.map(i => new Date(i.createdAt));
  const uniqueDates = [...new Set(dates.map(d => d.toDateString()))]
    .map(dateStr => new Date(dateStr))
    .sort((a, b) => b.getTime() - a.getTime());
  
  let streak = 0;
  let currentDate = new Date(today.toDateString());
  
  for (const date of uniqueDates) {
    const diffDays = Math.floor((currentDate - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === streak) {
      streak++;
      currentDate = new Date(date);
    } else if (diffDays > streak + 1) {
      break;
    }
  }
  
  return streak;
}

// Helper function to generate insights
function generateInsights(interviews, improvementRate, skillProgress) {
  const insights = [];
  
  if (interviews.length < 2) {
    insights.push({
      type: 'info',
      title: 'Getting Started',
      message: 'Complete more sessions to see detailed progress insights'
    });
    return insights;
  }
  
  // Improvement insights
  if (improvementRate > 10) {
    insights.push({
      type: 'success',
      title: 'Strong Progress',
      message: `Your overall scores have improved by ${improvementRate}% over recent sessions`
    });
  } else if (improvementRate < -5) {
    insights.push({
      type: 'warning',
      title: 'Focus Needed',
      message: 'Your recent scores show some decline. Consider reviewing feedback from previous sessions'
    });
  }
  
  // Skill-specific insights
  const skillScores = Object.entries(skillProgress);
  const lowestSkill = skillScores.reduce((min, skill) => skill[1] < min[1] ? skill : min);
  const highestSkill = skillScores.reduce((max, skill) => skill[1] > max[1] ? skill : max);
  
  if (lowestSkill[1] < 70) {
    insights.push({
      type: 'warning',
      title: 'Focus Area',
      message: `Consider working on ${lowestSkill[0]} skills for better overall performance`
    });
  }
  
  if (highestSkill[1] > 85) {
    insights.push({
      type: 'success',
      title: 'Strength Area',
      message: `Your ${highestSkill[0]} skills are performing excellently`
    });
  }
  
  // Goal setting
  const avgScore = interviews.reduce((sum, i) => sum + (i.analysis.overallScore || 0), 0) / interviews.length;
  if (avgScore < 85) {
    insights.push({
      type: 'info',
      title: 'Next Goal',
      message: 'Aim for consistent 85+ scores to reach the advanced level'
    });
  }
  
  return insights;
}
