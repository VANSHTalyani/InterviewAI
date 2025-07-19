import React from 'react';
import { motion } from 'framer-motion';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import { Card } from './ui/Card';
import { TimelineEvent } from '../types';

interface FeedbackTimelineProps {
  events: TimelineEvent[];
  duration: number;
}

export const FeedbackTimeline: React.FC<FeedbackTimelineProps> = ({ events, duration }) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'highlight':
        return CheckCircleIcon;
      case 'concern':
        return ExclamationTriangleIcon;
      case 'filler':
        return ChatBubbleLeftIcon;
      case 'pause':
        return ClockIcon;
      default:
        return CheckCircleIcon;
    }
  };

  const getEventColor = (type: string, severity: string) => {
    if (type === 'highlight') return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    if (severity === 'high') return 'text-red-600 bg-red-100 dark:bg-red-900/20';
    if (severity === 'medium') return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Timeline Analysis
      </h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
        
        <div className="space-y-6">
          {events.map((event, index) => {
            const Icon = getEventIcon(event.type);
            const colorClass = getEventColor(event.type, event.severity);
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex items-start"
              >
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${colorClass} relative z-10`}>
                  <Icon className="w-6 h-6" />
                </div>
                
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {event.description}
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      event.type === 'highlight' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                      event.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                      event.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                    }`}>
                      {event.type}
                    </span>
                    
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      event.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                      event.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    }`}>
                      {event.severity}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};