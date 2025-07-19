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

try:
    from deepgram import DeepgramClient, PrerecordedOptions, FileSource
    DEEPGRAM_AVAILABLE = True
except ImportError:
    DEEPGRAM_AVAILABLE = False


class TranscriptionService:
    """
    Service for transcribing audio to text using various AI services
    """
    
    def __init__(self):
        self.assemblyai_client = None
        self.google_client = None
        self.openai_client = None
        self.deepgram_client = None
        self.initialize_clients()
    
    def initialize_clients(self):
        """Initialize transcription service clients"""
        # AssemblyAI client
        try:
            if ASSEMBLYAI_AVAILABLE and settings.ASSEMBLYAI_API_KEY and settings.ASSEMBLYAI_API_KEY.strip():
                aai.settings.api_key = settings.ASSEMBLYAI_API_KEY
                self.assemblyai_client = aai
                logger.info("AssemblyAI client initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize AssemblyAI client: {e}")
        
        # Google Speech client
        try:
            if (GOOGLE_SPEECH_AVAILABLE and settings.GOOGLE_APPLICATION_CREDENTIALS and 
                os.path.exists(settings.GOOGLE_APPLICATION_CREDENTIALS)):
                self.google_client = speech.SpeechClient()
                logger.info("Google Speech client initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize Google Speech client: {e}")
        
        # OpenAI client
        try:
            if OPENAI_AVAILABLE and settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip():
                self.openai_client = openai
                self.openai_client.api_key = settings.OPENAI_API_KEY
                logger.info("OpenAI client initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize OpenAI client: {e}")
        
        # Deepgram client
        try:
            if DEEPGRAM_AVAILABLE and settings.DEEPGRAM_API_KEY and settings.DEEPGRAM_API_KEY.strip():
                self.deepgram_client = DeepgramClient(settings.DEEPGRAM_API_KEY)
                logger.info("Deepgram client initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize Deepgram client: {e}")
    
    async def transcribe_audio(self, audio_path: str) -> Dict[str, Any]:
        """
        Transcribe audio file to text
        
        Args:
            audio_path: Path to the audio file
            
        Returns:
            Dictionary containing transcription results
        """
        logger.info(f"Starting transcription for: {audio_path}")
        
        # List of transcription services to try in order
        services = []
        
        # Check if API keys are valid (not placeholder values)
        if (self.deepgram_client and settings.ENABLE_TRANSCRIPTION and 
            settings.DEEPGRAM_API_KEY and not settings.DEEPGRAM_API_KEY.startswith('your-') and 
            settings.DEEPGRAM_API_KEY != 'your-deepgram-api-key'):
            services.append((self._transcribe_with_deepgram, 'Deepgram'))
        
        if (self.assemblyai_client and settings.ENABLE_TRANSCRIPTION and 
            settings.ASSEMBLYAI_API_KEY and not settings.ASSEMBLYAI_API_KEY.startswith('your-') and 
            settings.ASSEMBLYAI_API_KEY != 'your-assemblyai-api-key'):
            services.append((self._transcribe_with_assemblyai, 'AssemblyAI'))
        
        if (self.google_client and settings.ENABLE_TRANSCRIPTION and 
            settings.GOOGLE_APPLICATION_CREDENTIALS and not settings.GOOGLE_APPLICATION_CREDENTIALS.startswith('your-')):
            services.append((self._transcribe_with_google, 'Google Speech'))
        
        if (self.openai_client and settings.ENABLE_TRANSCRIPTION and 
            settings.OPENAI_API_KEY and not settings.OPENAI_API_KEY.startswith('your-') and 
            settings.OPENAI_API_KEY != 'your-openai-api-key'):
            services.append((self._transcribe_with_openai, 'OpenAI Whisper'))
        
        # Try each service in order
        for service_func, service_name in services:
            try:
                logger.info(f"Trying transcription with {service_name}")
                result = await service_func(audio_path)
                logger.info(f"Successfully transcribed with {service_name}")
                return result
            except Exception as e:
                logger.warning(f"{service_name} transcription failed: {e}")
                continue
        
        # If all services fail, use mock transcription
        logger.info("All transcription services failed, using mock transcription")
        return await self._mock_transcription(audio_path)
    
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
    
    async def _transcribe_with_deepgram(self, audio_path: str) -> Dict[str, Any]:
        """
        Transcribe audio using Deepgram
        
        Args:
            audio_path: Path to the audio file
            
        Returns:
            Transcription results
        """
        try:
            logger.info(f"Starting Deepgram transcription for {audio_path}")
            
            # Configure transcription options
            options = PrerecordedOptions(
                model="nova-2",
                smart_format=True,
                punctuate=True,
                diarize=True,
                filler_words=True,
                numerals=True,
                profanity_filter=True,
                # Removed "numbers" from redact to preserve dates and numerical information
                redact=["pci"],  # Only redact payment card info, keep dates and numbers
                search=["interview", "presentation", "analysis"],
                summarize="v2",
                topics=True,
                language="en-US",
            )
            
            # Read audio file
            async with aiofiles.open(audio_path, 'rb') as audio_file:
                audio_content = await audio_file.read()
            
            # Create file source
            payload: FileSource = {
                "buffer": audio_content,
            }
            
            # Perform transcription (Deepgram v4 is synchronous)
            import asyncio
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.deepgram_client.listen.rest.v("1").transcribe_file(
                    payload,
                    options
                )
            )
            
            # Extract results - handle different response formats
            if hasattr(response, 'results'):
                results = response.results
            else:
                results = response.get("results", {}) if hasattr(response, 'get') else {}
            
            if hasattr(results, 'channels'):
                channels = results.channels
            else:
                channels = results.get("channels", []) if hasattr(results, 'get') else []
            
            if not channels:
                raise Exception("No transcription channels found")
            
            channel = channels[0]
            
            # Handle both dict and object formats for alternatives
            if hasattr(channel, 'alternatives'):
                alternatives = channel.alternatives
            else:
                alternatives = channel.get("alternatives", []) if hasattr(channel, 'get') else []
            
            if not alternatives:
                raise Exception("No transcription alternatives found")
            
            alternative = alternatives[0]
            
            # Handle both dict and object formats for transcript
            if hasattr(alternative, 'transcript'):
                full_text = alternative.transcript
            else:
                full_text = alternative.get("transcript", "") if hasattr(alternative, 'get') else ""
            
            # Extract segments with timestamps
            segments = []
            if hasattr(alternative, 'words'):
                words = alternative.words
            else:
                words = alternative.get("words", []) if hasattr(alternative, 'get') else []
            
            if words:
                # Helper function to get word attributes
                def get_word_attr(word_obj, attr, default=None):
                    if hasattr(word_obj, attr):
                        return getattr(word_obj, attr)
                    elif hasattr(word_obj, 'get'):
                        return word_obj.get(attr, default)
                    else:
                        return default
                
                current_segment = {
                    'start_time': get_word_attr(words[0], 'start', 0),
                    'end_time': get_word_attr(words[0], 'end', 0),
                    'text': '',
                    'confidence': 0,
                    'speaker': get_word_attr(words[0], 'speaker', 0)
                }
                
                segment_words = []
                for word in words:
                    word_speaker = get_word_attr(word, 'speaker', 0)
                    
                    # If speaker changes, create new segment
                    if word_speaker != current_segment['speaker'] and segment_words:
                        current_segment['text'] = ' '.join([w['word'] for w in segment_words])
                        current_segment['confidence'] = sum([w['confidence'] for w in segment_words]) / len(segment_words)
                        segments.append(current_segment)
                        
                        # Start new segment
                        current_segment = {
                            'start_time': get_word_attr(word, 'start', 0),
                            'end_time': get_word_attr(word, 'end', 0),
                            'text': '',
                            'confidence': 0,
                            'speaker': word_speaker
                        }
                        segment_words = []
                    
                    current_segment['end_time'] = get_word_attr(word, 'end', 0)
                    segment_words.append({
                        'word': get_word_attr(word, 'word', ''),
                        'confidence': get_word_attr(word, 'confidence', 0.0)
                    })
                
                # Add final segment
                if segment_words:
                    current_segment['text'] = ' '.join([w['word'] for w in segment_words])
                    current_segment['confidence'] = sum([w['confidence'] for w in segment_words]) / len(segment_words)
                    segments.append(current_segment)
            
            # Calculate overall confidence
            overall_confidence = sum([s['confidence'] for s in segments]) / len(segments) if segments else 0
            
            # Get summary and topics if available
            if hasattr(results, 'summary'):
                summary = results.summary
            else:
                summary = results.get("summary", {}) if hasattr(results, 'get') else {}
                
            if hasattr(results, 'topics'):
                topics = results.topics
            else:
                topics = results.get("topics", {}) if hasattr(results, 'get') else {}
            
            return {
                'text': full_text,
                'segments': segments,
                'confidence': overall_confidence,
                'language': 'en',
                'service': 'deepgram',
                'word_count': len(full_text.split()) if full_text else 0,
                'duration': max([s['end_time'] for s in segments]) if segments else 0,
                'summary': getattr(summary, 'short', '') if summary else '',
                'topics': getattr(topics, 'segments', []) if topics else [],
                'metadata': {
                    'model': 'nova-2',
                    'processing_time': getattr(getattr(response, 'metadata', None), 'duration', 0) if hasattr(response, 'metadata') else 0,
                    'confidence_threshold': 0.8
                }
            }
            
        except Exception as e:
            logger.error(f"Deepgram transcription failed: {e}")
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
