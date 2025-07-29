import { create } from 'zustand';
import { User, InterviewSession, AnalysisResult, ProgressMetrics } from '../types';

interface AppState {
  user: User | null;
  sessions: InterviewSession[];
  currentSession: InterviewSession | null;
  isAnalyzing: boolean;
  progress: ProgressMetrics;
  userStats: any;
  setUser: (user: User | null) => void;
  addSession: (session: InterviewSession) => void;
  updateSession: (id: string, updates: Partial<InterviewSession>) => void;
  setCurrentSession: (session: InterviewSession | null) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setSessions: (sessions: InterviewSession[]) => void;
  setUserStats: (stats: any) => void;
  fetchUserStats: () => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  sessions: [],
  currentSession: null,
  isAnalyzing: false,
  progress: {
    totalSessions: 0,
    averageScore: 0,
    improvementRate: 0,
    streakDays: 0,
    skillProgress: {
      bodyLanguage: 0,
      speech: 0,
      content: 0,
    },
  },
  userStats: null,
  setUser: (user) => set({ user }),
  addSession: (session) => set((state) => ({ sessions: [...state.sessions, session] })),
  updateSession: (id, updates) => set((state) => ({
    sessions: state.sessions.map(s => s.id === id ? { ...s, ...updates } : s),
  })),
  setCurrentSession: (session) => set({ currentSession: session }),
  setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  setSessions: (sessions) => set({ sessions }),
  setUserStats: (stats) => set({ userStats: stats }),
  fetchUserStats: async () => {
    try {
      const { analyticsAPI } = await import('../services/api');
      const statsResponse = await analyticsAPI.getAnalysisStats();
      if (statsResponse.success) {
        set({ 
          userStats: statsResponse.data,
          progress: {
            totalSessions: statsResponse.data.totalSessions,
            averageScore: statsResponse.data.averageScore,
            improvementRate: statsResponse.data.improvementRate,
            streakDays: statsResponse.data.streakDays,
            skillProgress: statsResponse.data.skillProgress
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      // Set empty stats instead of hardcoded values
      set({ 
        userStats: {
          totalSessions: 0,
          averageScore: 0,
          improvementRate: 0,
          streakDays: 0,
          skillProgress: {
            bodyLanguage: 0,
            speech: 0,
            content: 0
          }
        },
        progress: {
          totalSessions: 0,
          averageScore: 0,
          improvementRate: 0,
          streakDays: 0,
          skillProgress: {
            bodyLanguage: 0,
            speech: 0,
            content: 0,
          }
        }
      });
    }
  }
}));