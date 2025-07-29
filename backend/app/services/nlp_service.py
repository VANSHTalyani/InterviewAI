"""
NLP service for analyzing text-related aspects like tone and clarity
"""
from typing import Dict, Any

from app.core.logging import logger

# Optional imports for NLP services
try:
    from transformers import pipeline
    from transformers import AutoModelForSequenceClassification, AutoTokenizer
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False

try:
    import spacy
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False


class NLPService:
    """
    Service for performing NLP tasks like tone analysis and clarity analysis
    """
    
    def __init__(self):
        self.sentiment_pipeline = None
        self.clarity_model = None
        self.clarity_tokenizer = None
        self.nlp = None
        self.initialize_models()
    
    def initialize_models(self):
        """Initialize NLP models"""
        try:
            # Transformers sentiment pipeline
            if TRANSFORMERS_AVAILABLE:
                self.sentiment_pipeline = pipeline(
                    "sentiment-analysis",
                    model=AutoModelForSequenceClassification.from_pretrained("nlptown/bert-base-multilingual-uncased-sentiment"),
                    tokenizer=AutoTokenizer.from_pretrained("nlptown/bert-base-multilingual-uncased-sentiment")
                )
                logger.info("Sentiment analysis pipeline initialized")
            
            # Spacy NLP model (for other NLP tasks)
            if SPACY_AVAILABLE:
                self.nlp = spacy.load("en_core_web_sm")
                logger.info("SpaCy NLP model loaded")
                
        except Exception as e:
            logger.error(f"Failed to initialize NLP models: {e}")
    
    async def analyze_tone(self, text: str) -> Dict[str, Any]:
        """
        Analyze text tone
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary with tone analysis results
        """
        try:
            if self.sentiment_pipeline:
                # Get sentiment analysis
                sentiment_result = self.sentiment_pipeline(text)[0]
                return {
                    'label': sentiment_result['label'],
                    'score': sentiment_result['score']
                }
            else:
                # Simple mock analysis
                return {
                    'label': 'neutral',
                    'score': 0.5
                }
        except Exception as e:
            logger.error(f"Tone analysis failed: {e}")
            return {}
    
    async def analyze_clarity(self, text: str) -> Dict[str, Any]:
        """
        Analyze text clarity
        
        Args:
            text: Text to analyze
        
        Returns:
            Dictionary with clarity analysis results
        """
        try:
            if not text:
                return {
                    'score': 0.0,
                    'details': "Text is empty."
                }
            
            doc = self.nlp(text) if self.nlp else None
            sentences = list(doc.sents) if doc else text.split('.')
            avg_sentence_length = sum(len(sent.text.split()) for sent in sentences) / len(sentences) if sentences else 0
            
            return {
                'score': 1.0 if avg_sentence_length < 20 else 0.5,
                'details': "Short and concise" if avg_sentence_length < 20 else "Long and complex"
            }
        except Exception as e:
            logger.error(f"Clarity analysis failed: {e}")
            return {}


# Global NLP service instance
nlp_service = NLPService()
