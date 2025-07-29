import { InterviewSession, AnalysisResult } from '../types';

export const mockSessions: InterviewSession[] = [
  {
    id: '1',
    title: 'Senior Software Engineer - Tech Corp',
    duration: 1847,
    uploadedAt: new Date('2024-01-20'),
    status: 'completed',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    thumbnailUrl: 'https://images.pexels.com/photos/5940721/pexels-photo-5940721.jpeg?auto=compress&cs=tinysrgb&w=400',
    analysis: {
      overallScore: 82,
      bodyLanguage: {
        score: 85,
        insights: [
          'Excellent eye contact throughout the interview',
          'Confident posture and gestures',
          'Natural facial expressions conveying engagement'
        ],
        eyeContact: 88,
        posture: 85,
        gestures: 82,
        facialExpressions: 85,
      },
      speech: {
        score: 78,
        clarity: 85,
        pace: 75,
        volume: 82,
        fillerWords: [
          { word: 'um', timestamp: 145, confidence: 0.9 },
          { word: 'uh', timestamp: 340, confidence: 0.8 },
          { word: 'like', timestamp: 678, confidence: 0.7 },
          { word: 'um', timestamp: 892, confidence: 0.9 },
        ],
        tonalVariety: 72,
      },
      content: {
        score: 84,
        structure: 88,
        relevance: 82,
        completeness: 82,
      },
      timeline: [
        {
          timestamp: 45,
          type: 'highlight',
          description: 'Strong opening statement',
          severity: 'low',
        },
        {
          timestamp: 145,
          type: 'filler',
          description: 'Filler word detected',
          severity: 'low',
        },
        {
          timestamp: 340,
          type: 'pause',
          description: 'Long pause while thinking',
          severity: 'medium',
        },
        {
          timestamp: 678,
          type: 'highlight',
          description: 'Excellent technical explanation',
          severity: 'low',
        },
        {
          timestamp: 892,
          type: 'filler',
          description: 'Multiple filler words',
          severity: 'medium',
        },
        {
          timestamp: 1240,
          type: 'highlight',
          description: 'Great question handling',
          severity: 'low',
        },
      ],
      recommendations: [
        'Practice reducing filler words during explanations',
        'Work on maintaining consistent speaking pace',
        'Consider adding more concrete examples to your responses',
        'Excellent job on maintaining eye contact and engagement',
      ],
    },
  },
  {
    id: '2',
    title: 'Product Manager - StartupCo',
    duration: 2156,
    uploadedAt: new Date('2024-01-18'),
    status: 'completed',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    thumbnailUrl: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=400',
    analysis: {
      overallScore: 76,
      bodyLanguage: {
        score: 72,
        insights: [
          'Good overall presence, but could improve posture',
          'Gestures are natural but could be more purposeful',
          'Eye contact could be more consistent'
        ],
        eyeContact: 70,
        posture: 68,
        gestures: 78,
        facialExpressions: 72,
      },
      speech: {
        score: 80,
        clarity: 85,
        pace: 82,
        volume: 78,
        fillerWords: [
          { word: 'so', timestamp: 234, confidence: 0.8 },
          { word: 'um', timestamp: 567, confidence: 0.9 },
          { word: 'like', timestamp: 890, confidence: 0.7 },
          { word: 'you know', timestamp: 1234, confidence: 0.8 },
        ],
        tonalVariety: 75,
      },
      content: {
        score: 76,
        structure: 78,
        relevance: 80,
        completeness: 70,
      },
      timeline: [
        {
          timestamp: 30,
          type: 'highlight',
          description: 'Confident introduction',
          severity: 'low',
        },
        {
          timestamp: 234,
          type: 'filler',
          description: 'Filler word usage',
          severity: 'low',
        },
        {
          timestamp: 567,
          type: 'concern',
          description: 'Unclear explanation',
          severity: 'medium',
        },
        {
          timestamp: 890,
          type: 'highlight',
          description: 'Good product insight',
          severity: 'low',
        },
      ],
      recommendations: [
        'Work on structuring your responses more clearly',
        'Practice maintaining better posture throughout',
        'Reduce dependency on filler words',
        'Add more specific metrics to your examples',
      ],
    },
  },
  {
    id: '3',
    title: 'Data Scientist - Analytics Pro',
    duration: 1923,
    uploadedAt: new Date('2024-01-15'),
    status: 'processing',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    thumbnailUrl: 'https://images.pexels.com/photos/3184639/pexels-photo-3184639.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];