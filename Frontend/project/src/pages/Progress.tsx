import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { useStore } from '../store/useStore';
import { interviewsAPI } from '../services/api';
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
} from 'recharts';

interface ProgressData {
  totalSessions: number;
  averageScore: number;
  improvementRate: number;
  streakDays: number;
  skillProgress: {
    bodyLanguage: number;
    speech: number;
    content: number;
  };
  progressOverTime: any[];
  weeklyData: any[];
  insights: any[];
}

export const Progress: React.FC = () => {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await interviewsAPI.getProgress();
        setProgressData(response.data);
      } catch (err) {
        console.error('Error fetching progress data:', err);
        setError('Failed to load progress data');
        // Fallback to static data
        setProgressData({
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
          insights: [{
            type: 'info',
            title: 'Getting Started',
            message: 'Complete your first interview to see progress insights'
          }]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Your Progress
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Loading your progress data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Your Progress
          </h1>
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!progressData) {
    return null;
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
          Track your improvement over time and identify areas for growth
        </p>
      </motion.div>

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
                {progressData.skillProgress.bodyLanguage}%
              </span>
            </div>
            <ProgressBar
              value={progressData.skillProgress.bodyLanguage}
              color="success"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Speech Quality
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {progressData.skillProgress.speech}%
              </span>
            </div>
            <ProgressBar
              value={progressData.skillProgress.speech}
              color="warning"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Content Quality
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {progressData.skillProgress.content}%
              </span>
            </div>
            <ProgressBar
              value={progressData.skillProgress.content}
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
            <LineChart data={progressData.progressOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="session" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="score"
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
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Summary */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Weekly Summary
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressData.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Improvement Insights */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Improvement Insights
          </h2>
          <div className="space-y-4">
            {progressData.insights.length > 0 ? (
              progressData.insights.map((insight, index) => {
                const colorClass = insight.type === 'success' ? 'green' : 
                                 insight.type === 'warning' ? 'yellow' : 'blue';
                return (
                  <div key={index} className={`p-4 bg-${colorClass}-50 dark:bg-${colorClass}-900/20 rounded-lg`}>
                    <h3 className={`font-medium text-${colorClass}-900 dark:text-${colorClass}-300 mb-2`}>
                      {insight.title}
                    </h3>
                    <p className={`text-sm text-${colorClass}-700 dark:text-${colorClass}-400`}>
                      {insight.message}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                  Getting Started
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Complete more interviews to see personalized insights and recommendations.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};