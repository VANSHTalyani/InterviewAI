"""
Transcription service for audio-to-text conversion
"""
import os
import asyncio
from typing import Dict, Any, Optional, List
import aiofiles

from app.core.config import settings
from app.core.logging import logger

# Optional imports for transcription services
try:
    import assemblyai as aai
    ASSEMBLYAI_AVAILABLE = True
except ImportError:
    ASSEMBLYAI_AVAILABLE = False

try:
    from google.cloud import speech
    GOOGLE_SPEECH_AVAILABLE = True
except ImportError:
    GOOGLE_SPEECH_AVAILABLE = False

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


class TranscriptionService:
    """
    Service for transcribing audio to text using various AI services
    """
    
    def __init__(self):
        self.assemblyai_client = None
        self.google_client = None
        self.openai_client = None
        self.initialize_clients()
    
    def initialize_clients(self):
        """Initialize transcription service clients"""
        try:
            # AssemblyAI client
            if ASSEMBLYAI_AVAILABLE and settings.ASSEMBLYAI_API_KEY:
                aai.settings.api_key = settings.ASSEMBLYAI_API_KEY
                self.assemblyai_client = aai
                logger.info("AssemblyAI client initialized")
            
            # Google Speech client
            if GOOGLE_SPEECH_AVAILABLE and settings.GOOGLE_APPLICATION_CREDENTIALS:
                self.google_client = speech.SpeechClient()
                logger.info("Google Speech client initialized")
            
            # OpenAI client
            if OPENAI_AVAILABLE and settings.OPENAI_API_KEY:
                self.openai_client = openai
                self.openai_client.api_key = settings.OPENAI_API_KEY
                logger.info("OpenAI client initialized")
                
        except Exception as e:
            logger.error(f"Failed to initialize transcription clients: {e}")
    
    async def transcribe_audio(self, audio_path: str) -> Dict[str, Any]:
        """
        Transcribe audio file to text
        
        Args:
            audio_path: Path to the audio file
            
        Returns:
            Dictionary containing transcription results
        """
        try:
            # Try AssemblyAI first
            if self.assemblyai_client and settings.ENABLE_TRANSCRIPTION:
                return await self._transcribe_with_assemblyai(audio_path)
            
            # Try Google Speech
            elif self.google_client and settings.ENABLE_TRANSCRIPTION:
                return await self._transcribe_with_google(audio_path)
            
            # Try OpenAI Whisper
            elif self.openai_client and settings.ENABLE_TRANSCRIPTION:
                return await self._transcribe_with_openai(audio_path)
            
            else:
                # Fallback to mock transcription
                return await self._mock_transcription(audio_path)
                
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            raise
    
    async def _transcribe_with_assemblyai(self, audio_path: str) -> Dict[str, Any]:
        """
        Transcribe audio using AssemblyAI
        
        Args:
            audio_path: Path to the audio file
            
        Returns:
            Transcription results
        """
        try:
            logger.info(f"Starting AssemblyAI transcription for {audio_path}")
            
            # Configure transcription settings
            config = aai.TranscriptionConfig(
                speaker_labels=True,
                auto_punctuation=True,
                format_text=True,
                word_boost=["presentation", "analysis", "feedback"],
                filter_profanity=True
            )
            
            # Upload and transcribe
            transcriber = aai.Transcriber(config=config)
            transcript = transcriber.transcribe(audio_path)
            
            # Wait for completion
            if transcript.status == aai.TranscriptStatus.error:
                raise Exception(f"AssemblyAI transcription failed: {transcript.error}")
            
            # Extract segments with timestamps
            segments = []
            if transcript.utterances:
                for utterance in transcript.utterances:
                    segments.append({
                        'start_time': utterance.start / 1000.0,  # Convert to seconds
                        'end_time': utterance.end / 1000.0,
                        'text': utterance.text,
                        'confidence': utterance.confidence,
                        'speaker': getattr(utterance, 'speaker', 'Speaker A')
                    })
            
            return {
                'text': transcript.text,
                'segments': segments,
                'confidence': transcript.confidence,
                'language': 'en',
                'service': 'assemblyai',
                'word_count': len(transcript.text.split()) if transcript.text else 0,
                'duration': max([s['end_time'] for s in segments]) if segments else 0
            }
            
        except Exception as e:
            logger.error(f"AssemblyAI transcription failed: {e}")
            raise
    
    async def _transcribe_with_google(self, audio_path: str) -> Dict[str, Any]:
        """
        Transcribe audio using Google Speech-to-Text
        
        Args:
            audio_path: Path to the audio file
            
        Returns:
            Transcription results
        """
        try:
            logger.info(f"Starting Google Speech transcription for {audio_path}")
            
            # Read audio file
            async with aiofiles.open(audio_path, 'rb') as audio_file:
                audio_content = await audio_file.read()
            
            # Configure recognition
            audio = speech.RecognitionAudio(content=audio_content)
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=settings.AUDIO_SAMPLE_RATE,
                language_code='en-US',
                enable_automatic_punctuation=True,
                enable_word_time_offsets=True,
                enable_speaker_diarization=True,
                diarization_speaker_count=2,
                model='video'
            )
            
            # Perform transcription
            response = self.google_client.recognize(config=config, audio=audio)
            
            # Process results
            full_text = ""
            segments = []
            
            for result in response.results:
                alternative = result.alternatives[0]
                full_text += alternative.transcript + " "
                
                # Extract word-level timestamps
                words = []
                for word in alternative.words:
                    words.append({
                        'word': word.word,
                        'start_time': word.start_time.total_seconds(),
                        'end_time': word.end_time.total_seconds(),
                        'confidence': word.confidence
                    })
                
                if words:
                    segments.append({
                        'start_time': words[0]['start_time'],
                        'end_time': words[-1]['end_time'],
                        'text': alternative.transcript,
                        'confidence': alternative.confidence,
                        'words': words
                    })
            
            return {
                'text': full_text.strip(),
                'segments': segments,
                'confidence': sum([s['confidence'] for s in segments]) / len(segments) if segments else 0,
                'language': 'en',
                'service': 'google',
                'word_count': len(full_text.split()) if full_text else 0,
                'duration': max([s['end_time'] for s in segments]) if segments else 0
            }
            
        except Exception as e:
            logger.error(f"Google Speech transcription failed: {e}")
            raise
    
    async def _transcribe_with_openai(self, audio_path: str) -> Dict[str, Any]:
        """
        Transcribe audio using OpenAI Whisper
        
        Args:
            audio_path: Path to the audio file
            
        Returns:
            Transcription results
        """
        try:
            logger.info(f"Starting OpenAI Whisper transcription for {audio_path}")
            
            # Open audio file
            with open(audio_path, 'rb') as audio_file:
                # Use Whisper API
                response = self.openai_client.Audio.transcribe(
                    model="whisper-1",
                    file=audio_file,
                    response_format="verbose_json",
                    timestamp_granularities=["segment"]
                )
            
            # Process segments
            segments = []
            if hasattr(response, 'segments') and response.segments:
                for segment in response.segments:
                    segments.append({
                        'start_time': segment.get('start', 0),
                        'end_time': segment.get('end', 0),
                        'text': segment.get('text', ''),
                        'confidence': segment.get('avg_logprob', 0.0),
                        'words': segment.get('words', [])
                    })
            
            return {
                'text': response.text,
                'segments': segments,
                'confidence': 0.9,  # Whisper doesn't provide confidence, use default
                'language': response.language if hasattr(response, 'language') else 'en',
                'service': 'openai',
                'word_count': len(response.text.split()) if response.text else 0,
                'duration': max([s['end_time'] for s in segments]) if segments else 0
            }
            
        except Exception as e:
            logger.error(f"OpenAI Whisper transcription failed: {e}")
            raise
    
    async def _mock_transcription(self, audio_path: str) -> Dict[str, Any]:
        """
        Mock transcription for testing/fallback
        
        Args:
            audio_path: Path to the audio file
            
        Returns:
            Mock transcription results
        """
        logger.info(f"Using mock transcription for {audio_path}")
        
        # Simulate processing time
        await asyncio.sleep(2)
        
        mock_text = """
        Hello, this is a sample transcription for testing purposes. 
        This represents what would be the actual transcribed content from the audio file. 
        The system is designed to handle various types of speech analysis including 
        tone detection, emotion recognition, and clarity assessment.
        """
        
        # Create mock segments
        segments = [
            {
                'start_time': 0.0,
                'end_time': 3.5,
                'text': 'Hello, this is a sample transcription for testing purposes.',
                'confidence': 0.95,
                'speaker': 'Speaker A'
            },
            {
                'start_time': 3.5,
                'end_time': 8.2,
                'text': 'This represents what would be the actual transcribed content from the audio file.',
                'confidence': 0.92,
                'speaker': 'Speaker A'
            },
            {
                'start_time': 8.2,
                'end_time': 15.0,
                'text': 'The system is designed to handle various types of speech analysis including tone detection, emotion recognition, and clarity assessment.',
                'confidence': 0.89,
                'speaker': 'Speaker A'
            }
        ]
        
        return {
            'text': mock_text.strip(),
            'segments': segments,
            'confidence': 0.92,
            'language': 'en',
            'service': 'mock',
            'word_count': len(mock_text.split()),
            'duration': 15.0
        }
    
    async def get_transcription_summary(self, transcription_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a summary of transcription results
        
        Args:
            transcription_data: Transcription results
            
        Returns:
            Summary statistics
        """
        try:
            text = transcription_data.get('text', '')
            segments = transcription_data.get('segments', [])
            
            # Calculate statistics
            word_count = len(text.split()) if text else 0
            sentence_count = len([s for s in text.split('.') if s.strip()]) if text else 0
            avg_confidence = transcription_data.get('confidence', 0.0)
            duration = transcription_data.get('duration', 0.0)
            speaking_rate = word_count / (duration / 60) if duration > 0 else 0  # words per minute
            
            # Analyze segments
            segment_count = len(segments)
            avg_segment_length = sum([s['end_time'] - s['start_time'] for s in segments]) / segment_count if segment_count > 0 else 0
            
            return {
                'word_count': word_count,
                'sentence_count': sentence_count,
                'segment_count': segment_count,
                'duration_seconds': duration,
                'speaking_rate_wpm': round(speaking_rate, 1),
                'average_confidence': round(avg_confidence, 3),
                'average_segment_length': round(avg_segment_length, 2),
                'service_used': transcription_data.get('service', 'unknown'),
                'language': transcription_data.get('language', 'unknown')
            }
            
        except Exception as e:
            logger.error(f"Failed to generate transcription summary: {e}")
            return {}


# Global transcription service instance
transcription_service = TranscriptionService()
