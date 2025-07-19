import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { VideoUploader } from '../components/VideoUploader';
import { AnalysisDashboard } from '../components/AnalysisDashboard';
import { FeedbackTimeline } from '../components/FeedbackTimeline';
import { FillerWordsVisualizer } from '../components/FillerWordsVisualizer';
import { useStore } from '../store/useStore';
import { mockSessions } from '../data/mockData';

export const Analyze: React.FC = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(mockSessions[0]);

  const handleFileUpload = (file: File) => {
    setIsUploading(true);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          // Simulate analysis completion
          setTimeout(() => {
            setAnalysisComplete(true);
          }, 2000);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  if (analysisComplete && currentAnalysis.analysis) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white"
        >
          <h1 className="text-3xl font-bold mb-2">Analysis Complete!</h1>
          <p className="text-green-100">
            Your interview has been analyzed. Here's your detailed feedback.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <AnalysisDashboard analysis={currentAnalysis.analysis} />
          </div>
          <div className="space-y-6">
            <FeedbackTimeline
              events={currentAnalysis.analysis.timeline}
              duration={currentAnalysis.duration}
            />
            <FillerWordsVisualizer
              fillerWords={currentAnalysis.analysis.speech.fillerWords}
              duration={currentAnalysis.duration}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          AI Interview Analysis
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload your interview recording to get personalized feedback and insights
        </p>
      </motion.div>

      <VideoUploader
        onUpload={handleFileUpload}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />

      {isUploading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Analyzing your interview...
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Our AI is processing your video to provide detailed feedback
          </p>
        </motion.div>
      )}
    </div>
  );
};