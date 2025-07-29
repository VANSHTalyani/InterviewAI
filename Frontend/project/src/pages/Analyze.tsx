import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { VideoUploader } from '../components/VideoUploader';
import { AnalysisDashboard } from '../components/AnalysisDashboard';
import { FeedbackTimeline } from '../components/FeedbackTimeline';
import { FillerWordsVisualizer } from '../components/FillerWordsVisualizer';
import { useStore } from '../store/useStore';
import { analysisAPI, analyticsAPI } from '../services/api';
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
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveDecision, setSaveDecision] = useState<'save' | 'discard' | null>(null);

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
      setShowSaveDialog(true);
      
    } catch (error) {
      console.error('Analysis failed:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const handleSaveDecision = async (decision: 'save' | 'discard') => {
    if (!currentAnalysis || !uploadedFilename) return;
    
    setIsSaving(true);
    setSaveDecision(decision);
    
    try {
      if (decision === 'save') {
        // Save analysis to database
        await analyticsAPI.saveAnalysis({
          filename: uploadedFilename,
          originalFilename: currentAnalysis.title,
          fileSize: 0, // Would be actual file size
          duration: currentAnalysis.duration,
          analysisResults: currentAnalysis.analysis!,
          rawAnalysisData: rawBackendData,
          transcription: {
            text: rawBackendData?.transcription?.text || '',
            confidence: rawBackendData?.transcription?.confidence || 0,
            service: rawBackendData?.transcription?.service || 'unknown',
            wordCount: rawBackendData?.transcription?.word_count || 0
          },
          processingTime: 30 // Estimated processing time
        });
        
        logger.info('Analysis saved successfully');
      }
      
      setShowSaveDialog(false);
    } catch (error) {
      console.error('Failed to save analysis:', error);
      setError('Failed to save analysis. Please try again.');
    } finally {
      setIsSaving(false);
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

  // Validate that we have proper Gemini analysis data
  if (!ai_analysis || !ai_analysis.overall_assessment) {
    console.error('❌ Gemini Analysis Failed: No overall_assessment found in response');
    console.error('Response structure:', JSON.stringify(response, null, 2));
    throw new Error('Analysis failed: Gemini API did not provide proper analysis data');
  }

  if (!ai_analysis.recommendations || ai_analysis.recommendations.length === 0) {
    console.error('❌ Gemini Analysis Failed: No recommendations provided');
    console.error('AI Analysis structure:', JSON.stringify(ai_analysis, null, 2));
    throw new Error('Analysis failed: Gemini API did not provide recommendations');
  }

  const overallAssessment = ai_analysis.overall_assessment;
  const fillerWords = ai_analysis.filler_words;
  const detailedFillers = detailed_filler_analysis;
  const communicationStrengths = ai_analysis.communication_strengths;
  const recommendations = ai_analysis.recommendations;
  const interviewReadiness = ai_analysis.interview_readiness;

  console.log('Backend Analysis Data:', {
    overallAssessment,
    fillerWords,
    communicationStrengths,
    recommendations,
    interviewReadiness,
    detailedFillers
  });

  // Validate required fields exist
  if (!overallAssessment.overall_score && overallAssessment.overall_score !== 0) {
    console.error('❌ Missing overall_score in Gemini response');
    throw new Error('Analysis failed: Missing overall score from Gemini API');
  }

  if (!fillerWords || typeof fillerWords.total_count !== 'number') {
    console.error('❌ Missing or invalid filler_words data in Gemini response');
    throw new Error('Analysis failed: Invalid filler words data from Gemini API');
  }

  // Use enhanced analysis format from Gemini
  const speechQuality = ai_analysis.speech_quality || {};
  const contentAnalysis = ai_analysis.content_analysis || {};

  return {
    overallScore: Math.round(overallAssessment.overall_score),
    bodyLanguage: {
      score: Math.round(overallAssessment.confidence_score || overallAssessment.overall_score),
      insights: communicationStrengths,
      eyeContact: Math.round(overallAssessment.confidence_score || overallAssessment.overall_score),
      posture: Math.round(overallAssessment.professionalism_score || overallAssessment.overall_score),
      gestures: Math.round(overallAssessment.engagement_score || overallAssessment.overall_score),
      facialExpressions: Math.round(overallAssessment.authenticity_score || overallAssessment.overall_score),
    },
    speech: {
      score: Math.round(overallAssessment.clarity_score),
      clarity: Math.round(speechQuality.articulation_score || overallAssessment.clarity_score),
      pace: Math.round(speechQuality.pace_score || overallAssessment.overall_score),
      volume: Math.round(speechQuality.vocal_variety_score || overallAssessment.overall_score),
      fillerWords: detailedFillers?.detailed_occurrences || (fillerWords.common_fillers || []).map((filler: any, index: number) => ({
        word: filler.word || '',
        timestamp: index * ((transcription?.duration || 60) / (fillerWords.common_fillers?.length || 1)),
        confidence: Math.max(50, 90 - (filler.count * 5)),
      })),
      tonalVariety: Math.round(speechQuality.vocal_variety_score || overallAssessment.overall_score),
    },
    content: {
      score: Math.round(interviewReadiness?.score || contentAnalysis.structure_score || overallAssessment.overall_score),
      structure: Math.round(contentAnalysis.structure_score || overallAssessment.overall_score),
      relevance: Math.round(contentAnalysis.relevance_score || overallAssessment.overall_score),
      completeness: Math.round(contentAnalysis.completeness || overallAssessment.overall_score),
    },
    timeline: [],
    recommendations: recommendations,
  };
}

const logger = {
  info: (message: string) => console.log(`[INFO] ${message}`),
  error: (message: string, error?: any) => console.error(`[ERROR] ${message}`, error)
};
if (analysisComplete && currentAnalysis?.analysis) {
    return (
      <div className="space-y-6">
        {/* Save/Discard Dialog */}
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Save Analysis Results?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Would you like to save this analysis to your history for future reference?
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => handleSaveDecision('save')}
                  disabled={isSaving}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSaving && saveDecision === 'save' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : null}
                  <span>Save to History</span>
                </button>
                <button
                  onClick={() => handleSaveDecision('discard')}
                  disabled={isSaving}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSaving && saveDecision === 'discard' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : null}
                  <span>Discard</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white"
        >
          <h1 className="text-3xl font-bold mb-2">Analysis Complete!</h1>
          <p className="text-green-100">
            Your interview has been analyzed. Here's your detailed feedback.
          </p>
          {saveDecision === 'save' && (
            <div className="mt-4 bg-green-500/20 rounded-lg p-3">
              <p className="text-green-100">✅ Analysis saved to your history!</p>
            </div>
          )}
          {saveDecision === 'discard' && (
            <div className="mt-4 bg-gray-500/20 rounded-lg p-3">
              <p className="text-gray-100">Analysis discarded. You can start a new analysis anytime.</p>
            </div>
          )}
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
              fillerWords={currentAnalysis.analysis.speech.fillerWords}
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