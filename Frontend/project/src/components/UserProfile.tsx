import React from 'react';
import { motion } from 'framer-motion';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ProgressBar } from './ui/ProgressBar';
import { useStore } from '../store/useStore';
import {
  UserIcon,
  CalendarIcon,
  TrophyIcon,
  FireIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export const UserProfile: React.FC = () => {
  const { user, progress } = useStore();

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">No user data available</p>
      </div>
    );
  }

  const achievements = [
    { name: 'First Interview', description: 'Completed your first analysis', unlocked: true },
    { name: 'Consistent Learner', description: '7-day streak', unlocked: (progress?.streakDays || 0) >= 7 },
    { name: 'Improvement Master', description: '15% improvement rate', unlocked: (progress?.improvementRate || 0) >= 15 },
    { name: 'Skilled Speaker', description: 'Average score above 75', unlocked: (progress?.averageScore || 0) >= 75 },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-20 h-20 rounded-full overflow-hidden border-4 border-purple-600"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </motion.div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            <div className="flex items-center mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                user.tier === 'pro' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                user.tier === 'enterprise' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
              }`}>
                {user.tier} Plan
              </span>
            </div>
          </div>
          <Button variant="outline">
            Edit Profile
          </Button>
        </div>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {progress.totalSessions}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <TrophyIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {progress.averageScore}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <FireIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Streak</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {progress.streakDays}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Improvement</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                +{progress.improvementRate}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Skill Progress */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Skill Progress
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700 dark:text-gray-300">Body Language</span>
              <span className="text-gray-600 dark:text-gray-400">
                {progress.skillProgress.bodyLanguage}%
              </span>
            </div>
            <ProgressBar
              value={progress.skillProgress.bodyLanguage}
              color="success"
            />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700 dark:text-gray-300">Speech Quality</span>
              <span className="text-gray-600 dark:text-gray-400">
                {progress.skillProgress.speech}%
              </span>
            </div>
            <ProgressBar
              value={progress.skillProgress.speech}
              color="warning"
            />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700 dark:text-gray-300">Content Quality</span>
              <span className="text-gray-600 dark:text-gray-400">
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

      {/* Achievements */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Achievements
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border-2 ${
                achievement.unlocked
                  ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700'
                  : 'border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  achievement.unlocked
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-500 dark:bg-gray-700'
                }`}>
                  <TrophyIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className={`font-medium ${
                    achievement.unlocked
                      ? 'text-green-900 dark:text-green-300'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {achievement.name}
                  </h4>
                  <p className={`text-sm ${
                    achievement.unlocked
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-500'
                  }`}>
                    {achievement.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
};