import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  ChartBarIcon,
  ClockIcon,
  CogIcon,
  UserIcon,
  VideoCameraIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import { useStore } from '../store/useStore';

const Navigation: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useStore();

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Analyze', href: '/analyze', icon: VideoCameraIcon },
    { name: 'History', href: '/history', icon: ClockIcon },
    { name: 'Progress', href: '/progress', icon: ChartBarIcon },
    { name: 'Settings', href: '/settings', icon: CogIcon },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 w-64 min-h-screen p-4">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center mb-8">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
            <VideoCameraIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="ml-3 text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            InterviewAI
          </h1>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 space-y-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link key={item.name} to={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* User Profile */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-10 h-10 rounded-full"
            />
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.tier} Plan
              </p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;