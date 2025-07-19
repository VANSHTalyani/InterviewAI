import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { VideoUploader } from '../components/VideoUploader';
import { AnalysisDashboard } from '../components/AnalysisDashboard';
import { FeedbackTimeline } from '../components/FeedbackTimeline';
import { FillerWordsVisualizer } from '../components/FillerWordsVisualizer';
import { useStore } from '../store/useStore';
import { analysisAPI } from '../services/api';
import { UploadResponse, BackendAnalysisResult, AnalysisResult, InterviewSession } from '../types';
import { mockSessions } from '../data/mockData';

export const Analyze: React.FC = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<InterviewSession | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawBackendData, setRawBackendData] = useState<BackendAnalysisResult | null>(null);

// API Actions
const uploadFileToServer = async (file: File): Promise<UploadResponse> => {
  const response = await analysisAPI.uploadVideo(file);
  return response;
};

const triggerAnalysis = async (filename: string): Promise<BackendAnalysisResult> => {
  const response = await analysisAPI.analyzeSpeech(filename);
  return response;
};

const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    
    try {
      // Step 1: Upload file to server
      setUploadProgress(20);
      const uploadResponse = await uploadFileToServer(file);
      setUploadedFilename(uploadResponse.filename);
      setUploadProgress(40);
      
      // Step 2: Process video (extract audio)
      await analysisAPI.processVideo(uploadResponse.filename);
      setUploadProgress(60);
      
      // Step 3: Start analysis
      setIsAnalyzing(true);
      setUploadProgress(80);
      const analysisResponse = await triggerAnalysis(uploadResponse.filename);
      
      // Step 4: Convert to UI format
      console.log('Analysis Response from Backend:', analysisResponse);
      setRawBackendData(analysisResponse); // Store for debugging
      const convertedAnalysis = await handleAnalysisResponse(analysisResponse);
      console.log('Converted Analysis for Frontend:', convertedAnalysis);
      setUploadProgress(100);
      
      // Create session object
      const session: InterviewSession = {
        id: Date.now().toString(),
        title: file.name,
        duration: analysisResponse.video_metadata.duration || 0,
        uploadedAt: new Date(),
        status: 'completed',
        analysis: convertedAnalysis,
      };
      
      setCurrentAnalysis(session);
      setAnalysisComplete(true);
      
    } catch (error) {
      console.error('Analysis failed:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

async function handleAnalysisResponse(response: BackendAnalysisResult): Promise<AnalysisResult> {
  const { 
    ai_analysis,
    detailed_filler_analysis,
    quick_insights,
    transcription,
    video_metadata,
    display_summary,
  } = response;

  // Add safety checks for nested properties
  const overallAssessment = ai_analysis?.overall_assessment || {};
  const fillerWords = ai_analysis?.filler_words || { words: [], total_count: 0 };
  const detailedFillers = (response as any).detailed_filler_analysis || detailed_filler_analysis || { detailed_occurrences: [], total_count: 0 };
  const communicationStrengths = ai_analysis?.communication_strengths || [];
  const recommendations = ai_analysis?.recommendations || [];
  const interviewReadiness = ai_analysis?.interview_readiness || { score: 0 };
  const quickInsights = quick_insights || {};
  const transcriptionData = transcription || { confidence: 0 };

  console.log('Backend Analysis Data:', {
    overallAssessment,
    fillerWords,
    communicationStrengths,
    recommendations,
    interviewReadiness,
    quickInsights,
    transcriptionData
  });

  // Use either new enhanced analysis format or legacy format
  const analysis = (response as any).analysis || ai_analysis || {};
  const overallAssess = analysis.overall_assessment || overallAssessment;
  const speechQuality = analysis.speech_quality || {};
  const fillerWordsData = analysis.filler_words || fillerWords;
  const contentAnalysis = analysis.content_analysis || {};
  const commStrengths = analysis.communication_strengths || communicationStrengths;
  const recs = analysis.recommendations || recommendations;
  const interviewReady = analysis.interview_readiness || interviewReadiness;

  console.log('Final mapped data:', {
    analysis,
    overallAssess,
    speechQuality,
    fillerWordsData,
    contentAnalysis
  });

  return {
    overallScore: Math.round(overallAssess.overall_score || 0),
    bodyLanguage: {
      score: Math.round(overallAssess.confidence_score || 0),
      insights: commStrengths,
      eyeContact: Math.round(overallAssess.confidence_score || 85),
      posture: Math.round(overallAssess.professionalism_score || 78),
      gestures: Math.round(overallAssess.engagement_score || 82),
      facialExpressions: Math.round(overallAssess.authenticity_score || 79),
    },
    speech: {
      score: Math.round(overallAssess.clarity_score || 0),
      clarity: Math.round(speechQuality.articulation_score || overallAssess.clarity_score || 0),
      pace: Math.round(speechQuality.pace_score || 0),
      volume: Math.round(speechQuality.vocal_variety_score || 75),
      fillerWords: detailedFillers.detailed_occurrences || (fillerWordsData.common_fillers || []).map((filler: any, index: number) => ({
        word: filler.word || '',
        timestamp: index * ((transcriptionData.duration || 60) / (fillerWordsData.common_fillers?.length || 1)), // Better distribution
        confidence: 90 - (filler.count * 5), // Lower confidence for more frequent fillers
      })),
      tonalVariety: Math.round(speechQuality.vocal_variety_score || 68),
    },
    content: {
      score: Math.round(interviewReady.score || contentAnalysis.structure_score || 0),
      structure: Math.round(contentAnalysis.structure_score || 0),
      relevance: Math.round(contentAnalysis.relevance_score || 0),
      completeness: Math.round(contentAnalysis.completeness || 0),
    },
    timeline: [], // No timeline data available
    recommendations: recs || [],
  };
}

if (analysisComplete && currentAnalysis?.analysis) {
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
          {/* Display Quick Summary */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-green-100 text-sm">Overall Score</p>
              <p className="text-2xl font-bold">{currentAnalysis.analysis.overallScore}%</p>
            </div>
            <div className="text-center">
              <p className="text-green-100 text-sm">Speech Clarity</p>
              <p className="text-2xl font-bold">{Math.round(currentAnalysis.analysis.speech.clarity)}%</p>
            </div>
            <div className="text-center">
              <p className="text-green-100 text-sm">Filler Words</p>
              <p className="text-2xl font-bold">{currentAnalysis.analysis.speech.fillerWords.length}</p>
            </div>
            <div className="text-center">
              <p className="text-green-100 text-sm">Recommendations</p>
              <p className="text-2xl font-bold">{currentAnalysis.analysis.recommendations.length}</p>
            </div>
          </div>
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

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6"
        >
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-red-900 dark:text-red-100">
                Analysis Failed
              </h3>
              <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={() => setError(null)}
            className="mt-4 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 px-4 py-2 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      )}

      {isUploading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {uploadProgress < 40 ? 'Uploading video...' : 
             uploadProgress < 60 ? 'Processing video...' :
             uploadProgress < 80 ? 'Extracting audio...' :
             isAnalyzing ? 'Analyzing speech...' : 'Finalizing results...'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {uploadProgress < 40 ? 'Uploading your video to our secure servers' :
             uploadProgress < 60 ? 'Preparing video for analysis' :
             uploadProgress < 80 ? 'Extracting audio for transcription' :
             isAnalyzing ? 'AI is analyzing your speech patterns and content' :
             'Generating your personalized feedback report'}
          </p>
          <div className="mt-4 w-64 mx-auto">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {uploadProgress}% Complete
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};