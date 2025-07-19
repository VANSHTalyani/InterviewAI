#!/usr/bin/env python3
"""
Test script for Deepgram transcription functionality
"""

import asyncio
import os
import sys
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent
sys.path.append(str(project_root))

from app.services.transcription_service import transcription_service
from app.core.logging import logger

async def test_deepgram_initialization():
    """Test if Deepgram client is properly initialized"""
    logger.info("Testing Deepgram initialization...")
    
    if transcription_service.deepgram_client:
        logger.info("✅ Deepgram client successfully initialized")
        return True
    else:
        logger.error("❌ Deepgram client failed to initialize")
        return False

async def test_deepgram_with_sample_audio():
    """Test Deepgram transcription with a sample audio file (if available)"""
    logger.info("Testing Deepgram transcription...")
    
    # Look for sample audio files in common locations
    sample_paths = [
        "./uploads/sample.wav",
        "./uploads/sample.mp3",
        "./test_audio.wav",
        "./test_audio.mp3"
    ]
    
    sample_audio = None
    for path in sample_paths:
        if os.path.exists(path):
            sample_audio = path
            break
    
    if not sample_audio:
        logger.warning("No sample audio file found. Skipping transcription test.")
        logger.info("To test transcription, place an audio file at: ./uploads/sample.wav")
        return None
    
    try:
        logger.info(f"Transcribing sample audio: {sample_audio}")
        result = await transcription_service._transcribe_with_deepgram(sample_audio)
        
        logger.info("✅ Deepgram transcription successful!")
        logger.info(f"Transcribed text: {result['text'][:100]}...")
        logger.info(f"Service: {result['service']}")
        logger.info(f"Confidence: {result['confidence']}")
        logger.info(f"Duration: {result['duration']} seconds")
        
        return True
    except Exception as e:
        logger.error(f"❌ Deepgram transcription failed: {e}")
        return False

async def main():
    """Main test function"""
    logger.info("=== Deepgram Transcription Test ===")
    
    # Test initialization
    init_success = await test_deepgram_initialization()
    
    if init_success:
        # Test transcription if client is initialized
        await test_deepgram_with_sample_audio()
    
    logger.info("=== Test Complete ===")

if __name__ == "__main__":
    asyncio.run(main())
