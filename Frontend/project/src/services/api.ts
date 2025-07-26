import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (userData: {
    name: string;
    email: string;
    password: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.get('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  googleAuth: async (googleData: {
    name: string;
    email: string;
    googleId: string;
    profilePicture?: string;
  }) => {
    const response = await api.post('/auth/google', googleData);
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (profileData: {
    name?: string;
    email?: string;
    profilePicture?: string;
  }) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const response = await api.put('/users/password', passwordData);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/users/stats');
    return response.data;
  },
};

// Interviews API
export const interviewsAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }) => {
    const response = await api.get('/interviews', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/interviews/${id}`);
    return response.data;
  },

  create: async (interviewData: {
    title: string;
    type: 'technical' | 'behavioral';
    questions?: Array<{ question: string }>;
  }) => {
    const response = await api.post('/interviews', interviewData);
    return response.data;
  },

  update: async (id: string, updateData: any) => {
    const response = await api.put(`/interviews/${id}`, updateData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/interviews/${id}`);
    return response.data;
  },

  uploadVideo: async (id: string, videoFile: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('video', videoFile);

    const response = await api.post(`/interviews/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  startAnalysis: async (id: string) => {
    const response = await api.post(`/interviews/${id}/analyze`);
    return response.data;
  },

  getAnalysis: async (id: string) => {
    const response = await api.get(`/interviews/${id}/analysis`);
    return response.data;
  },

  downloadReport: async (id: string, format: 'pdf' | 'json' = 'pdf') => {
    const response = await api.get(`/interviews/${id}/report?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get user progress analytics
  getProgress: async () => {
    const response = await api.get('/interviews/progress');
    return response.data;
  },

  // Save analysis results to database
  saveAnalysisResults: async (interviewId: string, analysisData: any) => {
    const response = await api.post('/interviews/save-analysis', {
      interviewId,
      analysisData
    });
    return response.data;
  },
};

// File upload API
export const uploadAPI = {
  uploadFile: async (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  },
};

// Video Analysis API (Python Backend)
export const analysisAPI = {
  // Upload video file to Python backend
  uploadVideo: async (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

      const response = await fetch('http://localhost:8001/api/v1/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // Don't set Content-Type header, let browser set it with boundary for FormData
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Upload timed out after 2 minutes');
      }
      throw error;
    }
  },

  // Process video (extract audio and frames)
  processVideo: async (filename: string) => {
    const response = await fetch(`http://localhost:8001/api/v1/process/${filename}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Processing failed');
    }

    return response.json();
  },

  // Get processing status
  getProcessingStatus: async (filename: string) => {
    const response = await fetch(`http://localhost:8001/api/v1/process/status/${filename}`);
    
    if (!response.ok) {
      throw new Error('Status check failed');
    }

    return response.json();
  },

  // Perform comprehensive speech analysis
  analyzeSpeech: async (filename: string, userId?: string, generateReport = true) => {
    const params = new URLSearchParams({
      filename,
      user_id: userId || 'default_user',
      generate_report: generateReport.toString(),
    });

    const response = await fetch(`http://localhost:8001/api/v1/comprehensive/analyze-speech?${params}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Analysis failed');
    }

    return response.json();
  },

  // Quick analysis without full report
  quickAnalyze: async (filename: string) => {
    const params = new URLSearchParams({
      filename,
    });

    const response = await fetch(`http://localhost:8001/api/v1/comprehensive/quick-analyze?${params}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Quick analysis failed');
    }

    return response.json();
  },

  // Get analysis status
  getAnalysisStatus: async (filename: string) => {
    const response = await fetch(`http://localhost:8001/api/v1/comprehensive/analysis-status/${filename}`);
    
    if (!response.ok) {
      throw new Error('Status check failed');
    }

    return response.json();
  },

  // Regenerate report
  regenerateReport: async (filename: string, reportType = 'comprehensive', userId = 'default_user') => {
    const response = await fetch('http://localhost:8001/api/v1/comprehensive/regenerate-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        report_type: reportType,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Report regeneration failed');
    }

    return response.json();
  },

  // Get services status
  getServicesStatus: async () => {
    const response = await fetch('http://localhost:8001/api/v1/comprehensive/services-status');
    
    if (!response.ok) {
      throw new Error('Services status check failed');
    }

    return response.json();
  },

  // Test analysis pipeline
  testAnalysis: async () => {
    const response = await fetch('http://localhost:8001/api/v1/comprehensive/test-analysis', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Test analysis failed');
    }

    return response.json();
  },

  // List uploaded files
  listFiles: async () => {
    const response = await fetch('http://localhost:8001/api/v1/files');
    
    if (!response.ok) {
      throw new Error('Failed to list files');
    }

    return response.json();
  },

  // Test server connectivity
  testConnection: async () => {
    const response = await fetch('http://localhost:8001/', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Server not reachable');
    }

    return response.json();
  },
};

export default api;
