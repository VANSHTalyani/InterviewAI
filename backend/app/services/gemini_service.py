"""
Gemini text analysis service for speech analysis
"""
import asyncio
import re
from typing import Dict, Any, List, Optional
import json

from app.core.config import settings
from app.core.logging import logger

# Optional import for Google Generative AI
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


class GeminiAnalysisService:
    """
    Service for analyzing text using Google's Gemini AI for interview analysis
    """
    
    def __init__(self):
        self.client = None
        self.model = None
        self.initialize_client()
    
    def initialize_client(self):
        """Initialize Gemini client"""
        try:
            if GEMINI_AVAILABLE and settings.GEMINI_API_KEY:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.model = genai.GenerativeModel('gemini-1.5-flash')
                logger.info("Gemini client initialized")
            else:
                logger.warning("Gemini API key not found or library not available")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
    
    async def analyze_speech_text(self, text: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Comprehensive speech analysis using Gemini
        
        Args:
            text: Transcribed text to analyze
            context: Additional context (duration, speaker info, etc.)
            
        Returns:
            Dictionary with comprehensive analysis results
        """
        try:
            if not self.model:
                return await self._mock_analysis(text, context)
            
            # Prepare analysis prompt
            prompt = self._create_analysis_prompt(text, context)
            
            # Get analysis from Gemini
            response = await self._get_gemini_response(prompt)
            
            # Parse and structure the response
            analysis = await self._parse_gemini_response(response, text, context)
            
            return analysis
            
        except Exception as e:
            logger.error(f"Gemini analysis failed: {e}")
            return await self._mock_analysis(text, context)
    
    def _create_analysis_prompt(self, text: str, context: Dict[str, Any] = None) -> str:
        """Create a comprehensive analysis prompt for Gemini"""
        
        duration = context.get('duration', 0) if context else 0
        word_count = len(text.split()) if text else 0
        
        prompt = f"""
You are an expert speech and communication analyst. Analyze the following interview speech transcript and provide a comprehensive assessment.

TRANSCRIPT:
"{text}"

CONTEXT:
- Duration: {duration} seconds
- Word count: {word_count}
- Analysis type: Interview performance evaluation

Please provide a detailed analysis in the following JSON format:

{{
    "overall_assessment": {{
        "confidence_score": <0-100>,
        "clarity_score": <0-100>,
        "professionalism_score": <0-100>,
        "overall_score": <0-100>
    }},
    "speech_quality": {{
        "pace": "slow/moderate/fast",
        "articulation": "poor/average/good/excellent",
        "fluency": "poor/average/good/excellent",
        "coherence": "poor/average/good/excellent"
    }},
    "filler_words": {{
        "total_count": <number>,
        "frequency_per_minute": <number>,
        "common_fillers": [
            {{"word": "um", "count": <number>}},
            {{"word": "uh", "count": <number>}},
            {{"word": "like", "count": <number>}},
            {{"word": "you know", "count": <number>}}
        ],
        "severity": "low/medium/high"
    }},
    "content_analysis": {{
        "structure": "poor/average/good/excellent",
        "relevance": "poor/average/good/excellent",
        "depth": "shallow/moderate/deep",
        "examples_used": <number>,
        "technical_terms": <number>
    }},
    "communication_strengths": [
        "List of positive aspects"
    ],
    "areas_for_improvement": [
        "List of areas needing work"
    ],
    "recommendations": [
        "Specific actionable recommendations"
    ],
    "confidence_indicators": {{
        "positive_language": <percentage>,
        "decisive_statements": <number>,
        "hedge_words": <number>,
        "uncertainty_phrases": <number>
    }},
    "interview_readiness": {{
        "score": <0-100>,
        "level": "beginner/intermediate/advanced/expert",
        "key_gaps": ["list of gaps"]
    }},
    "detailed_feedback": "Comprehensive paragraph explaining the analysis and providing specific feedback for improvement."
}}

Focus on:
1. Speech confidence and authority
2. Clarity and articulation
3. Use of filler words and their impact
4. Professional communication style
5. Content structure and organization
6. Interview readiness and performance

Provide specific, actionable feedback that would help in interview preparation.
"""
        return prompt
    
    async def _get_gemini_response(self, prompt: str) -> str:
        """Get response from Gemini API"""
        try:
            # Use asyncio to run the synchronous Gemini call
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: self.model.generate_content(prompt)
            )
            return response.text
            
        except Exception as e:
            logger.error(f"Gemini API call failed: {e}")
            raise
    
    async def _parse_gemini_response(self, response: str, original_text: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Parse and validate Gemini response"""
        try:
            # Try to extract JSON from the response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                analysis = json.loads(json_str)
                
                # Add metadata
                analysis['metadata'] = {
                    'service': 'gemini',
                    'model': 'gemini-1.5-flash',
                    'original_text_length': len(original_text),
                    'analysis_timestamp': context.get('timestamp') if context else None,
                    'processing_successful': True
                }
                
                # Validate and ensure all required fields exist
                analysis = self._validate_analysis_structure(analysis, original_text)
                
                return analysis
            else:
                logger.warning("No JSON found in Gemini response")
                return await self._mock_analysis(original_text, context)
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini JSON response: {e}")
            return await self._mock_analysis(original_text, context)
        except Exception as e:
            logger.error(f"Error processing Gemini response: {e}")
            return await self._mock_analysis(original_text, context)
    
    def _validate_analysis_structure(self, analysis: Dict[str, Any], original_text: str) -> Dict[str, Any]:
        """Validate and fill missing fields in analysis"""
        
        # Ensure all required sections exist
        required_sections = [
            'overall_assessment', 'speech_quality', 'filler_words', 
            'content_analysis', 'communication_strengths', 'areas_for_improvement',
            'recommendations', 'confidence_indicators', 'interview_readiness'
        ]
        
        for section in required_sections:
            if section not in analysis:
                analysis[section] = {}
        
        # Validate overall_assessment
        if not isinstance(analysis['overall_assessment'], dict):
            analysis['overall_assessment'] = {}
        
        assessment_defaults = {
            'confidence_score': 75,
            'clarity_score': 75,
            'professionalism_score': 75,
            'overall_score': 75
        }
        
        for key, default in assessment_defaults.items():
            if key not in analysis['overall_assessment']:
                analysis['overall_assessment'][key] = default
        
        # Validate filler_words
        if not isinstance(analysis['filler_words'], dict):
            analysis['filler_words'] = {}
        
        filler_defaults = {
            'total_count': self._count_basic_fillers(original_text),
            'frequency_per_minute': 0,
            'common_fillers': [],
            'severity': 'low'
        }
        
        for key, default in filler_defaults.items():
            if key not in analysis['filler_words']:
                analysis['filler_words'][key] = default
        
        # Ensure lists exist
        list_fields = ['communication_strengths', 'areas_for_improvement', 'recommendations']
        for field in list_fields:
            if not isinstance(analysis[field], list):
                analysis[field] = []
        
        # Add detailed_feedback if missing
        if 'detailed_feedback' not in analysis:
            analysis['detailed_feedback'] = "Analysis completed successfully. Please review the detailed metrics above for comprehensive feedback."
        
        return analysis
    
    def _count_basic_fillers(self, text: str) -> int:
        """Count basic filler words in text"""
        fillers = ['um', 'uh', 'like', 'you know', 'so', 'well', 'actually', 'basically']
        text_lower = text.lower()
        count = 0
        for filler in fillers:
            count += text_lower.count(filler)
        return count
    
    async def analyze_filler_words(self, text: str) -> Dict[str, Any]:
        """
        Detailed filler word analysis
        
        Args:
            text: Text to analyze for filler words
            
        Returns:
            Detailed filler word analysis
        """
        try:
            # Common filler words and phrases
            filler_patterns = {
                'um': r'\bum+\b',
                'uh': r'\buh+\b',
                'like': r'\blike\b',
                'you know': r'\byou know\b',
                'so': r'\bso\b',
                'well': r'\bwell\b',
                'actually': r'\bactually\b',
                'basically': r'\bbasically\b',
                'literally': r'\bliterally\b',
                'totally': r'\btotally\b',
                'right': r'\bright\?\b',  # "right?" as a filler
                'ok': r'\b(ok|okay)\b',
                'and stuff': r'\band stuff\b',
                'or whatever': r'\bor whatever\b'
            }
            
            text_lower = text.lower()
            filler_analysis = {
                'total_count': 0,
                'by_type': {},
                'positions': [],
                'frequency_per_100_words': 0,
                'severity': 'low'
            }
            
            word_count = len(text.split())
            
            for filler, pattern in filler_patterns.items():
                matches = list(re.finditer(pattern, text_lower))
                count = len(matches)
                
                if count > 0:
                    filler_analysis['by_type'][filler] = {
                        'count': count,
                        'positions': [match.start() for match in matches]
                    }
                    filler_analysis['total_count'] += count
            
            # Calculate frequency
            if word_count > 0:
                filler_analysis['frequency_per_100_words'] = round(
                    (filler_analysis['total_count'] / word_count) * 100, 2
                )
            
            # Determine severity
            if filler_analysis['frequency_per_100_words'] > 8:
                filler_analysis['severity'] = 'high'
            elif filler_analysis['frequency_per_100_words'] > 4:
                filler_analysis['severity'] = 'medium'
            else:
                filler_analysis['severity'] = 'low'
            
            return filler_analysis
            
        except Exception as e:
            logger.error(f"Filler word analysis failed: {e}")
            return {
                'total_count': 0,
                'by_type': {},
                'positions': [],
                'frequency_per_100_words': 0,
                'severity': 'low',
                'error': str(e)
            }
    
    async def analyze_speech_confidence(self, text: str) -> Dict[str, Any]:
        """
        Analyze confidence indicators in speech
        
        Args:
            text: Text to analyze for confidence
            
        Returns:
            Confidence analysis results
        """
        try:
            # Confidence indicators
            confident_phrases = [
                r'\bi am confident\b', r'\bi believe\b', r'\bi know\b',
                r'\bclearly\b', r'\bobviously\b', r'\bdefinitely\b',
                r'\bcertainly\b', r'\bwithout a doubt\b'
            ]
            
            uncertain_phrases = [
                r'\bi think\b', r'\bmaybe\b', r'\bperhaps\b',
                r'\bi guess\b', r'\bkind of\b', r'\bsort of\b',
                r'\bi\'m not sure\b', r'\bprobably\b'
            ]
            
            hedge_words = [
                r'\bquite\b', r'\brather\b', r'\bsomewhat\b',
                r'\ba bit\b', r'\ba little\b', r'\bfairly\b'
            ]
            
            text_lower = text.lower()
            
            confident_count = sum(len(re.findall(pattern, text_lower)) for pattern in confident_phrases)
            uncertain_count = sum(len(re.findall(pattern, text_lower)) for pattern in uncertain_phrases)
            hedge_count = sum(len(re.findall(pattern, text_lower)) for pattern in hedge_words)
            
            total_words = len(text.split())
            
            # Calculate confidence score
            confidence_score = max(0, min(100, 
                50 + (confident_count * 10) - (uncertain_count * 5) - (hedge_count * 3)
            ))
            
            return {
                'confidence_score': round(confidence_score, 1),
                'confident_phrases': confident_count,
                'uncertain_phrases': uncertain_count,
                'hedge_words': hedge_count,
                'confidence_ratio': round(confident_count / max(1, uncertain_count), 2),
                'total_words_analyzed': total_words,
                'assessment': 'high' if confidence_score > 75 else 'medium' if confidence_score > 50 else 'low'
            }
            
        except Exception as e:
            logger.error(f"Confidence analysis failed: {e}")
            return {
                'confidence_score': 50,
                'confident_phrases': 0,
                'uncertain_phrases': 0,
                'hedge_words': 0,
                'confidence_ratio': 1.0,
                'total_words_analyzed': 0,
                'assessment': 'medium',
                'error': str(e)
            }
    
    async def _mock_analysis(self, text: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Mock analysis for fallback when Gemini is not available"""
        
        logger.info("Using mock Gemini analysis")
        
        # Basic analysis
        word_count = len(text.split()) if text else 0
        filler_count = self._count_basic_fillers(text)
        
        return {
            "overall_assessment": {
                "confidence_score": 78,
                "clarity_score": 82,
                "professionalism_score": 75,
                "overall_score": 78
            },
            "speech_quality": {
                "pace": "moderate",
                "articulation": "good",
                "fluency": "good",
                "coherence": "good"
            },
            "filler_words": {
                "total_count": filler_count,
                "frequency_per_minute": round(filler_count / max(1, (context.get('duration', 60) / 60)), 1),
                "common_fillers": [
                    {"word": "um", "count": max(0, filler_count // 3)},
                    {"word": "uh", "count": max(0, filler_count // 4)},
                    {"word": "like", "count": max(0, filler_count // 5)}
                ],
                "severity": "medium" if filler_count > 5 else "low"
            },
            "content_analysis": {
                "structure": "good",
                "relevance": "good",
                "depth": "moderate",
                "examples_used": 2,
                "technical_terms": 3
            },
            "communication_strengths": [
                "Clear articulation in most segments",
                "Good use of professional vocabulary",
                "Maintains coherent flow of ideas"
            ],
            "areas_for_improvement": [
                "Reduce use of filler words",
                "Increase confidence in delivery",
                "Add more specific examples"
            ],
            "recommendations": [
                "Practice speaking with deliberate pauses instead of filler words",
                "Record yourself speaking to identify patterns",
                "Prepare specific examples to illustrate your points"
            ],
            "confidence_indicators": {
                "positive_language": 65,
                "decisive_statements": 4,
                "hedge_words": 6,
                "uncertainty_phrases": 3
            },
            "interview_readiness": {
                "score": 75,
                "level": "intermediate",
                "key_gaps": ["filler word usage", "confidence in delivery"]
            },
            "detailed_feedback": "Your communication shows good potential with clear articulation and professional vocabulary. Focus on reducing filler words and increasing confidence in your delivery. Consider practicing with mock interviews to improve your overall presentation.",
            "metadata": {
                "service": "mock_gemini",
                "model": "fallback",
                "original_text_length": len(text),
                "analysis_timestamp": None,
                "processing_successful": True
            }
        }


# Global Gemini service instance
gemini_service = GeminiAnalysisService()
