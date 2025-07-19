import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
  showValue?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className,
  color = 'primary',
  showValue = false,
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colors = {
    primary: 'bg-gradient-to-r from-purple-600 to-blue-600',
    success: 'bg-gradient-to-r from-green-500 to-emerald-500',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    error: 'bg-gradient-to-r from-red-500 to-pink-500',
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <motion.div
          className={cn('h-2 rounded-full', colors[color])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      {showValue && (
        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};