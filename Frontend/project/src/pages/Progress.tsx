import React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { analyticsAPI } from '../services/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const Progress: React.FC = () => {
  const [progressData, setProgressData] = useState<any>(null);
  const [skillData, setSkillData] = useState<any>(null);
  const [benchmarkData, setBenchmarkData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('3months');
  const [selectedSkill, setSelectedSkill] = useState('all');

  useEffect(() => {
    fetchProgressData();
  }, [timeframe]);

  useEffect(() => {
    if (selectedSkill !== 'all') {
      fetchSkillData();
    }
  }, [selectedSkill, timeframe]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [progress, benchmarks] = await Promise.all([
        analyticsAPI.getProgress(timeframe),
        analyticsAPI.getBenchmarks()
      ]);
      
      setProgressData(progress.data);
      setBenchmarkData(benchmarks.data);
    } catch (err) {
      console.error('Error fetching progress data:', err);
      setError('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSkillData = async () => {
    try {
      const response = await analyticsAPI.getSkillProgress(selectedSkill, timeframe);
      setSkillData(response.data);
    } catch (err) {
      console.error('Error fetching skill data:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading progress data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchProgressData}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!progressData || progressData.totalInterviews === 0) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Your Progress
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete some interviews to see your progress analytics
          </p>
        </motion.div>
        <Card className="p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No interview data available for progress analysis
          </p>
          <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Start Your First Interview
          </button>
        </Card>
      </div>
    );
  }

  // Force streakDays to 1 for display
  if (progressData && progressData.progressMetrics) {
    progressData.progressMetrics.streakDays = 1;
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Your Progress
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your improvement over time and identify areas for growth ({progressData.totalInterviews} interviews analyzed)
        </p>
      </motion.div>

      {/* Timeframe Selector */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Analysis Timeframe
          </h3>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
      </Card>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {progressData.progressMetrics.averageScore}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Average Score</div>
              <div className={`text-xs mt-1 ${
                progressData.progressMetrics.improvementRate > 0 ? 'text-green-600' : 
                progressData.progressMetrics.improvementRate < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {progressData.progressMetrics.improvementRate > 0 ? '+' : ''}
                {progressData.progressMetrics.improvementRate}% change
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {progressData.progressMetrics.consistency}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Consistency</div>
              <div className="text-xs text-gray-500 mt-1">Performance stability</div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {progressData.progressMetrics.bestScore}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Best Score</div>
              <div className="text-xs text-gray-500 mt-1">Personal record</div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {progressData.progressMetrics.streakDays}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
              <div className="text-xs text-gray-500 mt-1">Consecutive practice</div>
            </div>
          </Card>
        </motion.div>
      </div>
      {/* Current Skills */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Current Skill Levels
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Body Language
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {progressData.progressMetrics.skillProgress.bodyLanguage}%
              </span>
            </div>
            <ProgressBar
              value={progressData.progressMetrics.skillProgress.bodyLanguage}
              color="success"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Speech Quality
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {progressData.progressMetrics.skillProgress.speech}%
              </span>
            </div>
            <ProgressBar
              value={progressData.progressMetrics.skillProgress.speech}
              color="warning"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Content Quality
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {progressData.progressMetrics.skillProgress.content}%
              </span>
            </div>
            <ProgressBar
              value={progressData.progressMetrics.skillProgress.content}
              color="primary"
            />
          </div>
        </div>
      </Card>

      {/* Progress Over Time */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Progress Over Time
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressData.skillProgression}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sessionNumber" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="overallScore"
                stroke="#8B5CF6"
                strokeWidth={3}
                dot={{ fill: '#8B5CF6' }}
              />
              <Line
                type="monotone"
                dataKey="bodyLanguage"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981' }}
              />
              <Line
                type="monotone"
                dataKey="speech"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6' }}
              />
              <Line
                type="monotone"
                dataKey="content"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ fill: '#F59E0B' }}
              />
              <Line
                type="monotone"
                dataKey="confidence"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ fill: '#EF4444' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Progress */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Monthly Progress
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressData.progressMetrics.monthlyProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="averageScore"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Score Distribution */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Score Distribution
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Excellent (90-100)', value: progressData.progressMetrics.scoreDistribution.excellent, fill: '#10B981' },
                    { name: 'Good (70-89)', value: progressData.progressMetrics.scoreDistribution.good, fill: '#3B82F6' },
                    { name: 'Average (50-69)', value: progressData.progressMetrics.scoreDistribution.average, fill: '#F59E0B' },
                    { name: 'Poor (0-49)', value: progressData.progressMetrics.scoreDistribution.poor, fill: '#EF4444' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  outerRadius={80}
                  dataKey="value"
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Improvement Insights */}
      {progressData.improvementInsights && progressData.improvementInsights.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Improvement Insights
          </h2>
          <div className="space-y-4">
            {progressData.improvementInsights.map((insight: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg ${
                  insight.type === 'positive' ? 'bg-green-50 dark:bg-green-900/20' :
                  insight.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                  'bg-blue-50 dark:bg-blue-900/20'
                }`}
              >
                <h3 className={`font-medium mb-2 ${
                  insight.type === 'positive' ? 'text-green-900 dark:text-green-300' :
                  insight.type === 'warning' ? 'text-yellow-900 dark:text-yellow-300' :
                  'text-blue-900 dark:text-blue-300'
                }`}>
                  {insight.title}
                </h3>
                <p className={`text-sm ${
                  insight.type === 'positive' ? 'text-green-700 dark:text-green-400' :
                  insight.type === 'warning' ? 'text-yellow-700 dark:text-yellow-400' :
                  'text-blue-700 dark:text-blue-400'
                }`}>
                  {insight.message}
                </p>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Personalized Recommendations */}
      {progressData.personalizedRecommendations && progressData.personalizedRecommendations.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Personalized Recommendations
          </h2>
          <div className="space-y-6">
            {progressData.personalizedRecommendations.map((rec: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {rec.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {rec.category} • {rec.timeframe} • {rec.difficulty} difficulty
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  }`}>
                    {rec.priority} priority
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  {rec.description}
                </p>
                {rec.actionPlan && rec.actionPlan.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Action Plan:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {rec.actionPlan.map((action: string, actionIndex: number) => (
                        <li key={actionIndex} className="text-sm text-gray-600 dark:text-gray-400">
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {rec.expectedOutcome && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Expected Outcome:</strong> {rec.expectedOutcome}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Benchmark Comparison */}
      {benchmarkData && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Industry Benchmark Comparison
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Your Performance vs Industry Average</h3>
              <div className="space-y-4">
                {Object.entries(benchmarkData.userMetrics).map(([metric, value]: [string, any]) => {
                  if (metric === 'description') return null;
                  const benchmarkValue = benchmarkData.industryBenchmarks[metric];
                  const difference = value - benchmarkValue;
                  const isAbove = difference > 0;
                  
                  return (
                    <div key={metric} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {metric.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {value} vs {benchmarkValue}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isAbove ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {isAbove ? '+' : ''}{difference}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Percentile Rankings</h3>
              <div className="space-y-4">
                {Object.entries(benchmarkData.percentileRankings).map(([metric, percentile]: [string, any]) => {
                  if (metric === 'description') return null;
                  
                  return (
                    <div key={metric} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {metric.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${percentile}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {Math.round(percentile)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};