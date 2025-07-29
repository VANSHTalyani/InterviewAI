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
        """Initialize Gemini client with Pro model"""
        try:
            if GEMINI_AVAILABLE and settings.GEMINI_API_KEY:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                
                # Try to use Gemini 2.5 Pro first (Pro subscription), fallback to Flash
                try:
                    self.model = genai.GenerativeModel('gemini-2.5-pro')
                    # Test the Pro model
                    test_response = self.model.generate_content("Test")
                    self.model_name = 'gemini-2.5-pro'
                    logger.info("Gemini 2.5 Pro client initialized successfully (Pro subscription active)")
                except Exception as pro_error:
                    logger.warning(f"Gemini 2.5 Pro not available ({pro_error}), falling back to Flash")
                    self.model = genai.GenerativeModel('gemini-1.5-flash')
                    self.model_name = 'gemini-1.5-flash'
                    logger.info("Gemini 1.5 Flash client initialized (fallback)")
            else:
                logger.warning("Gemini API key not found or library not available")
                self.model_name = None
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
            self.model_name = None
    
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
        sentences = text.count('.') + text.count('!') + text.count('?') if text else 0
        avg_sentence_length = word_count / max(1, sentences)
        
        prompt = f"""
You are an expert speech and communication analyst. Analyze ONLY the exact text provided below. DO NOT make assumptions or add information not present in the transcript.

**STRICT ANALYSIS RULES:**
1. Count filler words by searching the EXACT text provided - if "um", "uh", "like", etc. are not in the text, report count as 0
2. Base all analysis ONLY on what is actually written in the transcript
3. DO NOT generate typical patterns or expected results
4. If something is not present in the text, report it as absent (count = 0)
5. Be factually accurate based solely on the provided transcript

TRANSCRIPT TO ANALYZE (EXACT TEXT):
"{text}"

CONTEXT:
- Duration: {duration} seconds
- Word count: {word_count}
- Sentence count: {sentences}
- Average sentence length: {avg_sentence_length:.1f} words
- Analysis type: Text-only analysis (no audio/video data)

CRITICAL: Analyze ONLY this exact transcript. Count filler words by searching the text above. If words like 'um', 'uh', 'like' are not present in the transcript, report count as 0. Do not assume typical speech patterns.

{{
    "overall_assessment": {{
        "confidence_score": <0-100 with 0.1 precision>,
        "clarity_score": <0-100 with 0.1 precision>,
        "professionalism_score": <0-100 with 0.1 precision>,
        "engagement_score": <0-100 with 0.1 precision>,
        "authenticity_score": <0-100 with 0.1 precision>,
        "persuasiveness_score": <0-100 with 0.1 precision>,
        "overall_score": <weighted average with 0.1 precision>
    }},
    "speech_quality": {{
        "pace": "very_slow/slow/moderate/fast/very_fast",
        "pace_score": <0-100>,
        "articulation": "poor/below_average/average/good/excellent",
        "articulation_score": <0-100>,
        "fluency": "poor/below_average/average/good/excellent",
        "fluency_score": <0-100>,
        "coherence": "poor/below_average/average/good/excellent",
        "coherence_score": <0-100>,
        "vocal_variety": "monotone/limited/moderate/good/excellent",
        "vocal_variety_score": <0-100>
    }},
    "filler_words": {{
        "total_count": <exact number>,
        "frequency_per_minute": <precise calculation>,
        "frequency_per_100_words": <precise percentage>,
        "common_fillers": [
            {{"word": "um", "count": <number>, "impact": "low/medium/high"}},
            {{"word": "uh", "count": <number>, "impact": "low/medium/high"}},
            {{"word": "like", "count": <number>, "impact": "low/medium/high"}},
            {{"word": "you know", "count": <number>, "impact": "low/medium/high"}},
            {{"word": "so", "count": <number>, "impact": "low/medium/high"}},
            {{"word": "actually", "count": <number>, "impact": "low/medium/high"}}
        ],
        "severity": "very_low/low/medium/high/very_high",
        "impact_on_professionalism": <0-100>,
        "most_problematic_filler": "specific filler word"
    }},
    "content_analysis": {{
        "structure": "poor/below_average/average/good/excellent",
        "structure_score": <0-100>,
        "relevance": "poor/below_average/average/good/excellent",
        "relevance_score": <0-100>,
        "depth": "very_shallow/shallow/moderate/deep/very_deep",
        "depth_score": <0-100>,
        "examples_used": <exact number>,
        "technical_terms": <exact number>,
        "storytelling_quality": <0-100>,
        "logical_flow": <0-100>,
        "completeness": <0-100>
    }},
    "language_analysis": {{
        "vocabulary_sophistication": <0-100>,
        "grammar_accuracy": <0-100>,
        "sentence_variety": <0-100>,
        "professional_terminology": <0-100>,
        "repetitive_phrases": <number>,
        "complex_sentences_ratio": <percentage>
    }},
    "communication_strengths": [
        "Specific strength 1 with detailed explanation",
        "Specific strength 2 with detailed explanation",
        "Specific strength 3 with detailed explanation"
    ],
    "areas_for_improvement": [
        "Specific area 1 with detailed explanation and impact",
        "Specific area 2 with detailed explanation and impact",
        "Specific area 3 with detailed explanation and impact"
    ],
    "recommendations": [
        "Immediate Action: Specific 1-week actionable step with measurable outcome",
        "Short-term Goal: 2-4 week improvement strategy with practice methods",
        "Long-term Development: 1-3 month skill-building plan with resources",
        "Interview-Specific Tip: Tactical advice for next interview",
        "Communication Enhancement: Specific technique to improve delivery"
    ],
    "practice_exercises": [
        "Daily 5-minute exercise to address main weakness",
        "Weekly mock interview focus area",
        "Specific phrases to practice and incorporate"
    ],
    "interview_preparation_tips": [
        "Question types to prepare for based on communication style",
        "Specific stories/examples to develop",
        "Body language adjustments for next interview"
    ],
    "confidence_indicators": {{
        "positive_language_percentage": <precise percentage>,
        "decisive_statements": <exact count>,
        "hedge_words": <exact count>,
        "uncertainty_phrases": <exact count>,
        "self_deprecating_comments": <exact count>,
        "power_words_used": <exact count>,
        "confidence_trend": "declining/stable/improving"
    }},
    "emotional_intelligence": {{
        "self_awareness_score": <0-100>,
        "empathy_indicators": <0-100>,
        "emotional_regulation": <0-100>,
        "social_skills_demonstration": <0-100>
    }},
    "interview_readiness": {{
        "score": <0-100 with 0.1 precision>,
        "level": "novice/beginner/intermediate/advanced/expert",
        "key_gaps": ["specific gap 1", "specific gap 2", "specific gap 3"],
        "ready_for_interview_level": "entry/mid/senior/executive",
        "estimated_preparation_time": "X weeks/months"
    }},
    "behavioral_indicators": {{
        "leadership_language": <0-100>,
        "problem_solving_approach": <0-100>,
        "collaboration_mentions": <exact count>,
        "achievement_orientation": <0-100>,
        "adaptability_indicators": <0-100>
    }},
    "speaking_patterns": {{
        "average_words_per_sentence": <precise number>,
        "longest_sentence_words": <exact count>,
        "shortest_sentence_words": <exact count>,
        "question_usage": <exact count>,
        "transition_quality": <0-100>,
        "pause_usage": "poor/average/good/excellent"
    }},
    "detailed_feedback": "Comprehensive 200+ word analysis explaining the assessment in detail, providing specific examples from the transcript, and offering actionable improvement strategies with expected outcomes and timelines.",
    "industry_specific_notes": "Feedback tailored to the specific industry or role type mentioned in the content, if applicable.",
    "comparison_to_benchmarks": "How this performance compares to typical interview standards for similar roles."
}}

IMPORTANT ANALYSIS REQUIREMENTS:
1. Count filler words PRECISELY by examining the exact transcript
2. Analyze speech confidence through specific language patterns
3. Evaluate clarity based on sentence structure and vocabulary
4. Assess professionalism through appropriate terminology and tone
5. Rate content structure and organization systematically
6. Provide interview readiness assessment with specific benchmarks
7. Give ACTIONABLE recommendations with clear implementation steps
8. Be specific about timing and frequency of issues
9. Identify patterns and trends in communication style
10. Consider industry standards and expectations

Provide precise, evidence-based analysis with specific examples from the transcript.
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
                    'model': getattr(self, 'model_name', 'unknown'),
                    'original_text_length': len(original_text),
                    'analysis_timestamp': context.get('timestamp') if context else None,
                    'processing_successful': True
                }
                
                # Validate and ensure all required fields exist
                analysis = self._validate_analysis_structure(analysis, original_text)
                
                # Cross-validate against actual text to prevent hallucination
                analysis = await self._cross_validate_against_text(analysis, original_text, context)
                
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
    
    async def _cross_validate_against_text(self, analysis: Dict[str, Any], original_text: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Cross-validate Gemini analysis against actual text to prevent hallucination"""
        try:
            # Get actual filler word count from our precise method
            duration = context.get('duration', 0) if context else 0
            actual_filler_analysis = await self.analyze_filler_words(original_text, duration)
            actual_count = actual_filler_analysis['total_count']
            
            # Check if Gemini reported filler words when there are none
            if 'filler_words' in analysis:
                gemini_count = analysis['filler_words'].get('total_count', 0)
                
                # If Gemini reported filler words but our analysis finds none (or vice versa)
                if abs(gemini_count - actual_count) > 2:  # Allow small discrepancy
                    logger.warning(f"Gemini hallucination detected: reported {gemini_count} fillers, actual count is {actual_count}")
                    
                    # Override with actual counts
                    analysis['filler_words']['total_count'] = actual_count
                    analysis['filler_words']['frequency_per_100_words'] = actual_filler_analysis['frequency_per_100_words']
                    analysis['filler_words']['severity'] = actual_filler_analysis['severity']
                    
                    # Update common_fillers with actual data
                    common_fillers = []
                    for filler_type, data in actual_filler_analysis['by_type'].items():
                        common_fillers.append({
                            'word': filler_type,
                            'count': data['count'],
                            'impact': 'medium' if data['count'] > 3 else 'low'
                        })
                    analysis['filler_words']['common_fillers'] = common_fillers
                    
                    # Add hallucination warning to metadata
                    if 'metadata' not in analysis:
                        analysis['metadata'] = {}
                    analysis['metadata']['hallucination_detected'] = True
                    analysis['metadata']['corrected_filler_count'] = True
                    
                    logger.info(f"Corrected filler word analysis: {gemini_count} -> {actual_count}")
            
            # Validate confidence indicators against actual text analysis
            if 'confidence_indicators' in analysis:
                actual_confidence = await self.analyze_speech_confidence(original_text)
                
                # Check for major discrepancies in confidence analysis
                gemini_confident = analysis['confidence_indicators'].get('decisive_statements', 0)
                actual_confident = actual_confidence.get('confident_phrases', 0)
                
                if abs(gemini_confident - actual_confident) > 3:
                    logger.warning(f"Confidence analysis discrepancy: Gemini {gemini_confident}, actual {actual_confident}")
                    
                    # Use actual confidence data
                    analysis['confidence_indicators']['decisive_statements'] = actual_confident
                    analysis['confidence_indicators']['hedge_words'] = actual_confidence['hedge_words']
                    analysis['confidence_indicators']['uncertainty_phrases'] = actual_confidence['uncertain_phrases']
                    
                    if 'metadata' not in analysis:
                        analysis['metadata'] = {}
                    analysis['metadata']['confidence_corrected'] = True
            
            return analysis
            
        except Exception as e:
            logger.error(f"Cross-validation failed: {e}")
            return analysis
    
    def _count_basic_fillers(self, text: str) -> int:
        """Count basic filler words in text"""
        fillers = ['um', 'uh', 'like', 'you know', 'so', 'well', 'actually', 'basically']
        text_lower = text.lower()
        count = 0
        for filler in fillers:
            count += text_lower.count(filler)
        return count
    
    async def analyze_filler_words(self, text: str, duration: float = None) -> Dict[str, Any]:
        """
        Detailed filler word analysis
        
        Args:
            text: Text to analyze for filler words
            duration: Duration of the speech in seconds (optional)
            
        Returns:
            Detailed filler word analysis with timestamps
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
            words = text.split()
            word_count = len(words)
            
            filler_analysis = {
                'total_count': 0,
                'by_type': {},
                'positions': [],
                'frequency_per_100_words': 0,
                'frequency_per_minute': 0,
                'severity': 'low',
                'detailed_occurrences': []  # For frontend visualization
            }
            
            all_fillers = []
            
            for filler, pattern in filler_patterns.items():
                matches = list(re.finditer(pattern, text_lower))
                count = len(matches)
                
                if count > 0:
                    positions = []
                    for match in matches:
                        # Calculate approximate timestamp based on word position
                        char_position = match.start()
                        text_before = text[:char_position]
                        words_before = len(text_before.split())
                        
                        # Estimate timestamp (distribute evenly across duration)
                        if duration and duration > 0:
                            estimated_timestamp = (words_before / word_count) * duration
                        else:
                            estimated_timestamp = words_before * 0.5  # Assume 0.5 seconds per word
                        
                        positions.append({
                            'char_position': char_position,
                            'word_position': words_before,
                            'timestamp': round(estimated_timestamp, 2)
                        })
                        
                        # Add to detailed occurrences for frontend
                        all_fillers.append({
                            'word': filler,
                            'timestamp': round(estimated_timestamp, 2),
                            'confidence': 0.9  # High confidence for exact text matches
                        })
                    
                    filler_analysis['by_type'][filler] = {
                        'count': count,
                        'positions': positions
                    }
                    filler_analysis['total_count'] += count
            
            # Sort fillers by timestamp
            filler_analysis['detailed_occurrences'] = sorted(all_fillers, key=lambda x: x['timestamp'])
            
            # Calculate frequency
            if word_count > 0:
                filler_analysis['frequency_per_100_words'] = round(
                    (filler_analysis['total_count'] / word_count) * 100, 2
                )
            
            if duration and duration > 0:
                filler_analysis['frequency_per_minute'] = round(
                    (filler_analysis['total_count'] / (duration / 60)), 2
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
                'frequency_per_minute': 0,
                'severity': 'low',
                'detailed_occurrences': [],
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
        """Generate basic analysis using actual text analysis when Gemini is not available"""
        
        logger.warning("Gemini API not available, generating basic analysis from text")
        
        # Basic analysis from actual text
        word_count = len(text.split()) if text else 0
        filler_analysis = await self.analyze_filler_words(text, context.get('duration', 0) if context else 0)
        confidence_analysis = await self.analyze_speech_confidence(text)
        
        # Generate basic recommendations based on actual analysis
        recommendations = []
        if filler_analysis.get('total_count', 0) > 3:
            recommendations.append("Practice reducing filler words by pausing for 2-3 seconds before responding to questions")
        if confidence_analysis.get('confidence_score', 50) < 70:
            recommendations.append("Work on using more confident language and decisive statements in your responses")
        if word_count < 50:
            recommendations.append("Provide more detailed responses with specific examples to demonstrate your experience")
        if confidence_analysis.get('hedge_words', 0) > 2:
            recommendations.append("Replace hedge words with more assertive language to sound more confident")
        
        # Add default recommendations if none were generated
        if not recommendations:
            recommendations = [
                "Continue practicing interview responses to maintain your current strong performance",
                "Consider recording yourself to identify any subtle areas for improvement",
                "Practice the STAR method for behavioral questions to structure your responses"
            ]
        
        return {
            "overall_assessment": {
                "confidence_score": confidence_analysis.get('confidence_score', 75),
                "clarity_score": max(50, 100 - (filler_analysis.get('total_count', 0) * 5)),
                "professionalism_score": max(60, 90 - (confidence_analysis.get('hedge_words', 0) * 5)),
                "overall_score": round((confidence_analysis.get('confidence_score', 75) + max(50, 100 - (filler_analysis.get('total_count', 0) * 5)) + max(60, 90 - (confidence_analysis.get('hedge_words', 0) * 5))) / 3)
            },
            "speech_quality": {
                "pace": "moderate",
                "articulation": "good" if filler_analysis.get('total_count', 0) < 5 else "average",
                "fluency": "good" if filler_analysis.get('total_count', 0) < 3 else "average",
                "coherence": "good"
            },
            "filler_words": filler_analysis,
            "content_analysis": {
                "structure": "good" if word_count > 100 else "average",
                "relevance": "good",
                "depth": "moderate" if word_count > 50 else "shallow",
                "examples_used": max(1, word_count // 50),
                "technical_terms": 0
            },
            "communication_strengths": [
                "Demonstrates ability to communicate ideas clearly" if filler_analysis.get('total_count', 0) < 3 else "Shows engagement in the conversation",
                "Uses appropriate professional language" if confidence_analysis.get('confidence_score', 50) > 60 else "Maintains respectful communication tone",
                "Provides thoughtful responses" if word_count > 75 else "Shows willingness to participate"
            ],
            "areas_for_improvement": [
                f"Reduce filler word usage (currently {filler_analysis.get('total_count', 0)} instances)" if filler_analysis.get('total_count', 0) > 2 else "Maintain current speech clarity",
                f"Increase confidence in language (current score: {confidence_analysis.get('confidence_score', 50)})" if confidence_analysis.get('confidence_score', 50) < 70 else "Continue building on strong communication foundation",
                "Provide more detailed responses with specific examples" if word_count < 100 else "Maintain good response length"
            ],
            "recommendations": recommendations,
            "confidence_indicators": {
                "positive_language": confidence_analysis.get('confidence_score', 50),
                "decisive_statements": confidence_analysis.get('confident_phrases', 0),
                "hedge_words": confidence_analysis.get('hedge_words', 0),
                "uncertainty_phrases": confidence_analysis.get('uncertain_phrases', 0)
            },
            "interview_readiness": {
                "score": round((confidence_analysis.get('confidence_score', 75) + max(50, 100 - (filler_analysis.get('total_count', 0) * 5))) / 2),
                "level": "advanced" if filler_analysis.get('total_count', 0) < 2 and confidence_analysis.get('confidence_score', 50) > 80 else "intermediate" if filler_analysis.get('total_count', 0) < 5 and confidence_analysis.get('confidence_score', 50) > 60 else "beginner",
                "key_gaps": [gap for gap in ["filler word usage" if filler_analysis.get('total_count', 0) > 3 else None, "confidence in delivery" if confidence_analysis.get('confidence_score', 50) < 70 else None] if gap is not None]
            },
            "detailed_feedback": f"Your communication analysis shows {confidence_analysis.get('confident_phrases', 0)} confident statements and {filler_analysis.get('total_count', 0)} filler words in {word_count} words. {'Focus on reducing filler words and increasing confidence.' if filler_analysis.get('total_count', 0) > 3 or confidence_analysis.get('confidence_score', 50) < 70 else 'Your communication skills show strong fundamentals.'}",
            "metadata": {
                "service": "basic_analysis",
                "model": "text_analysis_fallback",
                "original_text_length": len(text),
                "analysis_timestamp": context.get('timestamp') if context else None,
                "processing_successful": True,
                "note": "Generated from text analysis due to Gemini API unavailability"
            }
        }


# Global Gemini service instance
gemini_service = GeminiAnalysisService()
