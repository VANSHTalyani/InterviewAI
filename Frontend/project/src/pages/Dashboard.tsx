import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useStore } from '../store/useStore';
import { analyticsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  PlusIcon,
  PlayIcon,
  ClockIcon,
  ChartBarIcon,
  TrophyIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  // const { user } = useStore();
  const { user } = useAuth();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [improvementRate, setImprovementRate] = useState<number>(0);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await analyticsAPI.getHistory({});
        setHistory(response.data.interviews || []);
      } catch (err) {
        setError('Failed to load sessions');
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();

    // Fetch improvement rate from progress endpoint (like Progress page)
    const fetchProgress = async () => {
      try {
        const progress = await analyticsAPI.getProgress();
        setImprovementRate(progress.data.progressMetrics?.improvementRate || 0);
      } catch (err) {
        console.error('Error fetching progress:', err);
      }
    };
    fetchProgress();
  }, []);

  const totalSessions = history.length;
  const avgScore = totalSessions
    ? Math.round(history.reduce((sum, i) => sum + (i.analysis?.overallScore || 0), 0) / totalSessions)
    : 0;
  const streak = 1; // Hardcoded for now
  const recentSessions = history.slice(0, 3);

  // Calculate improvement percentage
  // let improvementRate = 0; // This line is no longer needed as improvementRate is fetched from backend

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.name || 'Guest'}!
            </h1>
            <p className="text-purple-100">
              Ready to improve your interview skills? Let's analyze your next session.
            </p>
          </div>
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            variant="secondary"
            className="bg-white text-purple-600 hover:bg-gray-100 disabled:opacity-50"
          >
            {isLoggingOut ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
                Logout
              </>
            )}
          </Button>
        </div>
        <div className="mt-6">
          <Link to="/analyze">
            <Button
              variant="secondary"
              className="bg-white text-purple-600 hover:bg-gray-100"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              New Analysis
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalSessions}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-purple-600" />
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {avgScore}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <TrophyIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Improvement</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {improvementRate > 0 ? `+${improvementRate}%` : `${improvementRate}%`}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Streak</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {streak} days
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent Sessions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Sessions
          </h2>
          <Link to="/history">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading sessions...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        ) : recentSessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No sessions yet</p>
            <Link to="/analyze">
              <Button variant="primary" size="sm">
                <PlusIcon className="w-4 h-4 mr-2" />
                Start Your First Analysis
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentSessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
                    {session.thumbnailUrl ? (
                      <img
                        src={session.thumbnailUrl}
                        alt={session.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <PlayIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {session.title || 'Untitled Session'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {session.duration ? `${Math.floor(session.duration / 60)}m ${session.duration % 60}s` : new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    session.status === 'completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : session.status === 'processing'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {session.status}
                  </span>
                  {session.status === 'completed' && (
                    <Link to={`/analysis/${session.id}`}>
                      <Button variant="ghost" size="sm">
                        <PlayIcon className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};