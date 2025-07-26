import { create } from 'zustand';
import { User, InterviewSession, AnalysisResult, ProgressMetrics } from '../types';

interface AppState {
  user: User | null;
  sessions: InterviewSession[];
  currentSession: InterviewSession | null;
  isAnalyzing: boolean;
  progress: ProgressMetrics;
  setUser: (user: User | null) => void;
  setSessions: (sessions: InterviewSession[]) => void;
  addSession: (session: InterviewSession) => void;
  updateSession: (id: string, updates: Partial<InterviewSession>) => void;
  setCurrentSession: (session: InterviewSession | null) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  user: {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400',
    joinedAt: new Date('2024-01-15'),
    tier: 'pro',
  },
  sessions: [],
  currentSession: null,
  isAnalyzing: false,
  progress: {
    totalSessions: 12,
    averageScore: 78,
    improvementRate: 15,
    streakDays: 7,
    skillProgress: {
      bodyLanguage: 82,
      speech: 75,
      content: 80,
    },
  },
  setUser: (user) => set({ user }),
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) => set((state) => ({ sessions: [...state.sessions, session] })),
  updateSession: (id, updates) => set((state) => ({
    sessions: state.sessions.map(s => s.id === id ? { ...s, ...updates } : s),
  })),
  setCurrentSession: (session) => set({ currentSession: session }),
  setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
}));