export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  joinedAt: Date;
  tier: 'free' | 'pro' | 'enterprise';
}

export interface InterviewSession {
  id: string;
  title: string;
  duration: number;
  uploadedAt: Date;
  createdAt?: Date;
  type?: 'technical' | 'behavioral';
  status: 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  analysis?: AnalysisResult;
  metrics?: {
    overallScore: number;
    bodyLanguageScore: number;
    speechScore: number;
    clarityScore: number;
    fillerWordCount: number;
    improvementAreas: number;
    strengths: number;
  };
  trend?: 'improving' | 'declining' | 'stable';
}

export interface AnalysisResult {
  overallScore: number;
  bodyLanguage: {
    score: number;
    insights: string[];
    eyeContact: number;
    posture: number;
    gestures: number;
    facialExpressions: number;
  };
  speech: {
    score: number;
    clarity: number;
    pace: number;
    volume: number;
    fillerWords: FillerWord[];
    tonalVariety: number;
  };
  content: {
    score: number;
    structure: number;
    relevance: number;
    completeness: number;
  };
  timeline: TimelineEvent[];
  recommendations: string[];
}

export interface FillerWord {
  word: string;
  timestamp: number;
  confidence: number;
}

export interface TimelineEvent {
  timestamp: number;
  type: 'filler' | 'pause' | 'highlight' | 'concern';
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ProgressMetrics {
  totalSessions: number;
  averageScore: number;
  improvementRate: number;
  streakDays: number;
  consistency?: number;
  bestScore?: number;
  worstScore?: number;
  skillProgress: {
    bodyLanguage: number;
    speech: number;
    content: number;
    confidence?: number;
  };
  scoreDistribution?: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
  monthlyProgress?: Array<{
    month: string;
    interviews: number;
    averageScore: number;
  }>;
}

// Analytics Types
export interface ProgressAnalytics {
  totalInterviews: number;
  timeframe: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  progressMetrics: ProgressMetrics;
  skillProgression: Array<{
    sessionNumber: number;
    date: Date;
    overallScore: number;
    bodyLanguage: number;
    speech: number;
    content: number;
    confidence: number;
    fillerWords: number;
  }>;
  improvementInsights: Array<{
    type: 'positive' | 'warning' | 'info';
    title: string;
    message: string;
    trend: 'improving' | 'declining' | 'stable' | 'variable';
    metric?: string;
    improvement?: number;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt: Date;
    category: string;
  }>;
  personalizedRecommendations: Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actionPlan: string[];
    expectedOutcome: string;
    timeframe: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
  lastUpdated: Date;
}

export interface BenchmarkData {
  userMetrics: {
    overallScore: number;
    bodyLanguageScore: number;
    speechScore: number;
    confidenceScore: number;
    fillerWordCount: number;
    clarityScore: number;
  };
  industryBenchmarks: {
    overallScore: number;
    bodyLanguageScore: number;
    speechScore: number;
    confidenceScore: number;
    fillerWordCount: number;
    clarityScore: number;
    description: string;
  };
  percentileRankings: {
    overallScore: number;
    bodyLanguageScore: number;
    speechScore: number;
    confidenceScore: number;
    description: string;
  };
  benchmarkInsights: Array<{
    metric: string;
    userScore: number;
    benchmarkScore: number;
    difference: number;
    percentageDiff: number;
    status: 'above' | 'below';
    significance: 'high' | 'medium' | 'low';
  }>;
}
// Backend Analysis Types
export interface BackendAnalysisResult {
  success: boolean;
  filename: string;
  user_id: string;
  analysis_timestamp: string;
  transcription: {
    service: string;
    text: string;
    confidence: number;
    duration: number;
    word_count: number;
    segments_count: number;
    metadata: any;
  };
  ai_analysis: {
    overall_assessment: {
      overall_score: number;
      confidence_score: number;
      clarity_score: number;
    };
    filler_words: {
      total_count: number;
      severity: string;
      words: Array<{
        word: string;
        count: number;
        timestamps?: number[];
      }>;
    };
    communication_strengths: string[];
    areas_for_improvement: string[];
    recommendations: string[];
    interview_readiness: {
      level: string;
      score: number;
    };
  };
  detailed_filler_analysis?: {
    total_count: number;
    by_type: Record<string, {
      count: number;
      positions: Array<{
        char_position: number;
        word_position: number;
        timestamp: number;
      }>;
    }>;
    frequency_per_100_words: number;
    frequency_per_minute: number;
    severity: string;
    detailed_occurrences: Array<{
      word: string;
      timestamp: number;
      confidence: number;
    }>;
  };
  quick_insights: {
    overall_score: number;
    confidence_level: number;
    clarity_score: number;
    filler_word_count: number;
    speaking_rate: number;
    readiness_level: string;
  };
  recommendations: {
    top_3_strengths: string[];
    top_3_improvements: string[];
    immediate_actions: string[];
  };
  video_metadata: {
    duration: number;
    format: string;
    size: number;
    resolution?: string;
  };
  report_info?: {
    report_id: string;
    pdf_path?: string;
    json_path?: string;
  };
  display_summary?: {
    title: string;
    completion_status: string;
    description: string;
    overall_grade: string;
    key_metrics: {
      speaking_confidence: string;
      speech_clarity: string;
      filler_usage: string;
      readiness: string;
    };
  };
}

export interface UploadResponse {
  message: string;
  filename: string;
  file_size: number;
  status: string;
  upload_time: string;
}

export interface ProcessingStatus {
  filename: string;
  audio_extracted: boolean;
  frames_extracted: boolean;
  frame_count: number;
  processing_complete: boolean;
  audio_path?: string;
  frames_path?: string;
}

export interface QuickAnalysisResult {
  success: boolean;
  filename: string;
  quick_results: {
    transcription_service: string;
    word_count: number;
    duration: number;
    speaking_rate_wpm: number;
    confidence_score: number;
    filler_word_count: number;
    filler_severity: string;
  };
  text_preview: string;
}

export interface ServicesStatus {
  timestamp: string;
  services: {
    deepgram: {
      available: boolean;
      configured: boolean;
    };
    gemini: {
      available: boolean;
      configured: boolean;
    };
    openai: {
      available: boolean;
      configured: boolean;
    };
    assemblyai: {
      available: boolean;
      configured: boolean;
    };
    google_speech: {
      available: boolean;
      configured: boolean;
    };
  };
  primary_transcription_service: string;
  analysis_service: string;
  overall_status: string;
}
