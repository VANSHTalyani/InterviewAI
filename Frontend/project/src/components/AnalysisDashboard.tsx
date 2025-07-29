import React from 'react';
import { motion } from 'framer-motion';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card } from './ui/Card';
import { ProgressBar } from './ui/ProgressBar';
import { AnalysisResult } from '../types';

interface AnalysisDashboardProps {
  analysis: AnalysisResult;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ analysis }) => {
  const skillData = [
    { name: 'Body Language', value: analysis.bodyLanguage.score, color: '#8B5CF6' },
    { name: 'Speech Quality', value: analysis.speech.score, color: '#3B82F6' },
    { name: 'Content Quality', value: analysis.content.score, color: '#10B981' },
  ];

  const bodyLanguageData = [
    { name: 'Eye Contact', value: analysis.bodyLanguage.eyeContact },
    { name: 'Posture', value: analysis.bodyLanguage.posture },
    { name: 'Gestures', value: analysis.bodyLanguage.gestures },
    { name: 'Expressions', value: analysis.bodyLanguage.facialExpressions },
  ];

  const speechData = [
    { name: 'Clarity', value: analysis.speech.clarity },
    { name: 'Pace', value: analysis.speech.pace },
    { name: 'Volume', value: analysis.speech.volume },
    { name: 'Tonal Variety', value: analysis.speech.tonalVariety },
  ];

  const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'];

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="p-6">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
            className="w-32 h-32 mx-auto mb-4 relative"
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="70%"
                outerRadius="100%"
                data={[{ value: analysis.overallScore }]}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  dataKey="value"
                  cornerRadius={10}
                  fill="url(#colorGradient)"
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {analysis.overallScore}
              </span>
            </div>
          </motion.div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Overall Score
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {analysis.overallScore >= 80 ? 'Excellent' : analysis.overallScore >= 60 ? 'Good' : 'Needs Improvement'}
          </p>
        </div>
      </Card>

      {/* Skill Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {skillData.map((skill, index) => (
          <motion.div
            key={skill.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {skill.name}
                </h4>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {skill.value}
                </span>
              </div>
              <ProgressBar
                value={skill.value}
                color={skill.value >= 80 ? 'success' : skill.value >= 60 ? 'warning' : 'error'}
              />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Body Language Details */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Body Language Analysis
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bodyLanguageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Speech Quality Details */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Speech Quality Analysis
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={speechData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {speechData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recommendations
        </h3>
        <div className="space-y-3">
          {analysis.recommendations && analysis.recommendations.length > 0 ? (
            analysis.recommendations.map((recommendation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-gray-700 dark:text-gray-300">{recommendation}</p>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center py-4 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg"
            >
              <p className="font-medium">⚠️ No recommendations available</p>
              <p className="text-sm mt-1">Gemini API did not provide analysis recommendations</p>
            </motion.div>
          )}
        </div>
      </Card>
    </div>
  );
};