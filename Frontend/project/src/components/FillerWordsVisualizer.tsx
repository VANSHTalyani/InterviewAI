import React from 'react';
import { motion } from 'framer-motion';
import { Card } from './ui/Card';
import { FillerWord } from '../types';

interface FillerWordsVisualizerProps {
  fillerWords: FillerWord[];
  duration: number;
}

export const FillerWordsVisualizer: React.FC<FillerWordsVisualizerProps> = ({
  fillerWords,
  duration,
}) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 100);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  const getWordColor = (word: string) => {
    const colors: { [key: string]: string } = {
      'um': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'uh': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'like': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'so': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'you know': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    };
    return colors[word] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  const wordCounts = fillerWords.reduce((acc, word) => {
    acc[word.word] = (acc[word.word] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const totalFillers = fillerWords.length;
  const fillersPerMinute = (totalFillers / (duration / 60)).toFixed(1);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Filler Words Analysis
        </h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalFillers}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {fillersPerMinute}/min
          </div>
        </div>
      </div>

      {/* Word Frequency */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Most Common Words
        </h4>
        <div className="space-y-2">
          {Object.entries(wordCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([word, count]) => (
              <div key={word} className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getWordColor(word)}`}>
                  "{word}"
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${(count / totalFillers) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                    {count}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Timeline Visualization */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Timeline Distribution (Precise Timestamps)
        </h4>
        <div className="relative h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          {fillerWords.map((word, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="absolute top-2 bottom-2 w-1 bg-red-400 rounded-full cursor-pointer hover:bg-red-500 hover:w-2 transition-all"
              style={{ left: `${(word.timestamp / duration) * 100}%` }}
              title={`${word.word} at ${formatTime(word.timestamp)}`}
            >
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
                "{word.word}" at {formatTime(word.timestamp)}
              </div>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>0:00</span>
          <span>{formatTime(duration)}</span>
        </div>
        
        {/* Detailed filler word list */}
        <div className="mt-4 max-h-32 overflow-y-auto">
          <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Detailed Occurrences:
          </h5>
          <div className="space-y-1">
            {fillerWords.map((word, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <span className="text-gray-700 dark:text-gray-300">
                  "{word.word}"
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {formatTime(word.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
          Recommendations
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          {fillersPerMinute > '3' && (
            <li>• Practice speaking more slowly to reduce filler word usage</li>
          )}
          {wordCounts['um'] > 2 && (
            <li>• Replace "um" with brief pauses for more confident speech</li>
          )}
          {wordCounts['like'] > 2 && (
            <li>• Use specific adjectives instead of "like" for clearer communication</li>
          )}
          <li>• Practice your responses to reduce reliance on filler words</li>
        </ul>
      </div>
    </Card>
  );
};