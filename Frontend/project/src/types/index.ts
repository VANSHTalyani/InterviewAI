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
  status: 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  analysis?: AnalysisResult;
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
  skillProgress: {
    bodyLanguage: number;
    speech: number;
    content: number;
  };
}