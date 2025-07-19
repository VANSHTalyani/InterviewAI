import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { useStore } from '../store/useStore';
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

export const Progress: React.FC = () => {
  const { progress } = useStore();

  const progressData = [
    { session: 1, score: 65, bodyLanguage: 60, speech: 68, content: 67 },
    { session: 2, score: 70, bodyLanguage: 68, speech: 72, content: 70 },
    { session: 3, score: 72, bodyLanguage: 70, speech: 74, content: 72 },
    { session: 4, score: 75, bodyLanguage: 73, speech: 76, content: 76 },
    { session: 5, score: 78, bodyLanguage: 75, speech: 78, content: 81 },
    { session: 6, score: 80, bodyLanguage: 78, speech: 80, content: 83 },
    { session: 7, score: 82, bodyLanguage: 80, speech: 82, content: 85 },
  ];

  const weeklyData = [
    { week: 'Week 1', sessions: 2, avgScore: 67 },
    { week: 'Week 2', sessions: 3, avgScore: 73 },
    { week: 'Week 3', sessions: 4, avgScore: 78 },
    { week: 'Week 4', sessions: 3, avgScore: 82 },
  ];

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
                {progress.skillProgress.bodyLanguage}%
              </span>
            </div>
            <ProgressBar
              value={progress.skillProgress.bodyLanguage}
              color="success"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Speech Quality
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {progress.skillProgress.speech}%
              </span>
            </div>
            <ProgressBar
              value={progress.skillProgress.speech}
              color="warning"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Content Quality
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {progress.skillProgress.content}%
              </span>
            </div>
            <ProgressBar
              value={progress.skillProgress.content}
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
            <LineChart data={progressData}>
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
              <AreaChart data={weeklyData}>
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
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="font-medium text-green-900 dark:text-green-300 mb-2">
                Strong Progress
              </h3>
              <p className="text-sm text-green-700 dark:text-green-400">
                Your body language scores have improved by 18% over the last month
              </p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h3 className="font-medium text-yellow-900 dark:text-yellow-300 mb-2">
                Focus Area
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Consider working on speech clarity and pace for better overall scores
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                Next Goal
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Aim for consistent 85+ scores to reach the advanced level
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};