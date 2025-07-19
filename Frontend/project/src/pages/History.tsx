import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { mockSessions } from '../data/mockData';
import { PlayIcon, ClockIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export const History: React.FC = () => {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Interview History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review your past interview sessions and track your progress
          </p>
        </div>
        <Button variant="primary">
          <PlayIcon className="w-5 h-5 mr-2" />
          New Session
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 gap-6">
        {mockSessions.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6" hover>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <img
                      src={session.thumbnailUrl}
                      alt={session.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {session.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {formatDuration(session.duration)}
                      </div>
                      <span>•</span>
                      <span>{format(session.uploadedAt, 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    session.status === 'completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : session.status === 'processing'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {session.status}
                  </span>

                  {session.analysis && (
                    <div className="flex items-center space-x-2">
                      <TrophyIcon className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {session.analysis.overallScore}
                      </span>
                    </div>
                  )}

                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>

              {session.analysis && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Body Language</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {session.analysis.bodyLanguage.score}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Speech</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {session.analysis.speech.score}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Content</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {session.analysis.content.score}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};