"""
Vision service for analyzing video frames for emotions and body language
"""
import os
import cv2
import numpy as np
from typing import Dict, Any, List
from pathlib import Path

from app.core.logging import logger

# Optional imports for vision processing
try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False

try:
    from transformers import pipeline
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False


class VisionService:
    """
    Service for analyzing video frames to detect emotions and body language
    """
    
    def __init__(self):
        self.face_detection = None
        self.pose_detection = None
        self.emotion_classifier = None
        self.initialize_models()
    
    def initialize_models(self):
        """Initialize vision models"""
        try:
            if MEDIAPIPE_AVAILABLE:
                # Initialize MediaPipe
                mp_face_detection = mp.solutions.face_detection
                mp_pose = mp.solutions.pose
                
                self.face_detection = mp_face_detection.FaceDetection(
                    model_selection=0, min_detection_confidence=0.5
                )
                self.pose_detection = mp_pose.Pose(
                    static_image_mode=True,
                    model_complexity=1,
                    enable_segmentation=False,
                    min_detection_confidence=0.5
                )
                
                logger.info("MediaPipe models initialized")
            
            if TRANSFORMERS_AVAILABLE:
                # Initialize emotion classifier
                self.emotion_classifier = pipeline(
                    "image-classification",
                    model="microsoft/resnet-50"
                )
                logger.info("Emotion classification model initialized")
                
        except Exception as e:
            logger.error(f"Failed to initialize vision models: {e}")
    
    async def analyze_emotions(self, frames_path: str) -> Dict[str, Any]:
        """
        Analyze emotions from video frames
        
        Args:
            frames_path: Path to directory containing video frames
            
        Returns:
            Dictionary with emotion analysis results
        """
        try:
            if not os.path.exists(frames_path):
                raise ValueError(f"Frames directory not found: {frames_path}")
            
            # Get all frame files
            frame_files = sorted([f for f in os.listdir(frames_path) if f.endswith(('.jpg', '.jpeg', '.png'))])
            
            if not frame_files:
                raise ValueError("No frame files found")
            
            emotions_detected = []
            face_count = 0
            
            for frame_file in frame_files:
                frame_path = os.path.join(frames_path, frame_file)
                
                try:
                    # Read frame
                    image = cv2.imread(frame_path)
                    if image is None:
                        continue
                    
                    # Convert to RGB for MediaPipe
                    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                    
                    # Detect faces
                    if self.face_detection:
                        results = self.face_detection.process(rgb_image)
                        
                        if results.detections:
                            face_count += len(results.detections)
                            
                            # For each detected face, analyze emotion
                            for detection in results.detections:
                                # Extract face region
                                bbox = detection.location_data.relative_bounding_box
                                h, w, _ = image.shape
                                
                                x = int(bbox.xmin * w)
                                y = int(bbox.ymin * h)
                                width = int(bbox.width * w)
                                height = int(bbox.height * h)
                                
                                # Extract face image
                                face_image = image[y:y+height, x:x+width]
                                
                                # Analyze emotion (simplified - in reality would use emotion detection model)
                                emotion = self._analyze_face_emotion(face_image)
                                emotions_detected.append(emotion)
                    
                except Exception as e:
                    logger.warning(f"Failed to process frame {frame_file}: {e}")
                    continue
            
            # Aggregate emotion results
            if emotions_detected:
                emotion_counts = {}
                for emotion in emotions_detected:
                    emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
                
                # Get dominant emotion
                dominant_emotion = max(emotion_counts, key=emotion_counts.get)
                confidence = emotion_counts[dominant_emotion] / len(emotions_detected)
                
                return {
                    'dominant_emotion': dominant_emotion,
                    'confidence': confidence,
                    'emotion_distribution': emotion_counts,
                    'total_faces_detected': face_count,
                    'frames_analyzed': len(frame_files),
                    'emotions_detected': emotions_detected
                }
            else:
                return {
                    'dominant_emotion': 'neutral',
                    'confidence': 0.0,
                    'emotion_distribution': {},
                    'total_faces_detected': 0,
                    'frames_analyzed': len(frame_files),
                    'emotions_detected': []
                }
                
        except Exception as e:
            logger.error(f"Emotion analysis failed: {e}")
            return {
                'error': str(e),
                'dominant_emotion': 'unknown',
                'confidence': 0.0
            }
    
    async def analyze_body_language(self, frames_path: str) -> Dict[str, Any]:
        """
        Analyze body language from video frames
        
        Args:
            frames_path: Path to directory containing video frames
            
        Returns:
            Dictionary with body language analysis results
        """
        try:
            if not os.path.exists(frames_path):
                raise ValueError(f"Frames directory not found: {frames_path}")
            
            # Get all frame files
            frame_files = sorted([f for f in os.listdir(frames_path) if f.endswith(('.jpg', '.jpeg', '.png'))])
            
            if not frame_files:
                raise ValueError("No frame files found")
            
            poses_detected = []
            gesture_count = 0
            posture_scores = []
            
            for frame_file in frame_files:
                frame_path = os.path.join(frames_path, frame_file)
                
                try:
                    # Read frame
                    image = cv2.imread(frame_path)
                    if image is None:
                        continue
                    
                    # Convert to RGB for MediaPipe
                    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                    
                    # Detect pose
                    if self.pose_detection:
                        results = self.pose_detection.process(rgb_image)
                        
                        if results.pose_landmarks:
                            # Analyze pose
                            pose_analysis = self._analyze_pose(results.pose_landmarks)
                            poses_detected.append(pose_analysis)
                            
                            # Count gestures (simplified)
                            if pose_analysis.get('has_gesture', False):
                                gesture_count += 1
                            
                            # Calculate posture score
                            posture_score = pose_analysis.get('posture_score', 0.5)
                            posture_scores.append(posture_score)
                    
                except Exception as e:
                    logger.warning(f"Failed to process frame {frame_file}: {e}")
                    continue
            
            # Aggregate body language results
            avg_posture_score = sum(posture_scores) / len(posture_scores) if posture_scores else 0.0
            gesture_frequency = gesture_count / len(frame_files) if frame_files else 0.0
            
            # Determine overall body language assessment
            if avg_posture_score > 0.7 and gesture_frequency > 0.3:
                assessment = "confident"
            elif avg_posture_score > 0.5:
                assessment = "neutral"
            else:
                assessment = "reserved"
            
            return {
                'assessment': assessment,
                'confidence': avg_posture_score,
                'posture_score': avg_posture_score,
                'gesture_frequency': gesture_frequency,
                'total_poses_detected': len(poses_detected),
                'frames_analyzed': len(frame_files),
                'details': {
                    'gesture_count': gesture_count,
                    'posture_scores': posture_scores,
                    'poses_detected': poses_detected
                }
            }
            
        except Exception as e:
            logger.error(f"Body language analysis failed: {e}")
            return {
                'error': str(e),
                'assessment': 'unknown',
                'confidence': 0.0
            }
    
    def _analyze_face_emotion(self, face_image: np.ndarray) -> str:
        """
        Analyze emotion from a face image
        
        Args:
            face_image: Face image as numpy array
            
        Returns:
            Detected emotion
        """
        try:
            # This is a simplified emotion detection
            # In reality, you'd use a proper emotion detection model
            
            # For now, return a random emotion based on image characteristics
            if face_image.size == 0:
                return 'neutral'
            
            # Calculate image brightness as a simple heuristic
            brightness = np.mean(face_image)
            
            if brightness > 150:
                return 'happy'
            elif brightness > 100:
                return 'neutral'
            else:
                return 'serious'
                
        except Exception as e:
            logger.error(f"Face emotion analysis failed: {e}")
            return 'neutral'
    
    def _analyze_pose(self, pose_landmarks) -> Dict[str, Any]:
        """
        Analyze pose from MediaPipe landmarks
        
        Args:
            pose_landmarks: MediaPipe pose landmarks
            
        Returns:
            Pose analysis results
        """
        try:
            # Get key landmarks
            landmarks = pose_landmarks.landmark
            
            # Calculate shoulder position (posture indicator)
            left_shoulder = landmarks[mp.solutions.pose.PoseLandmark.LEFT_SHOULDER]
            right_shoulder = landmarks[mp.solutions.pose.PoseLandmark.RIGHT_SHOULDER]
            
            # Calculate shoulder alignment
            shoulder_diff = abs(left_shoulder.y - right_shoulder.y)
            shoulder_alignment = 1.0 - min(shoulder_diff * 10, 1.0)  # Normalize to 0-1
            
            # Check for raised hands (gesture detection)
            left_wrist = landmarks[mp.solutions.pose.PoseLandmark.LEFT_WRIST]
            right_wrist = landmarks[mp.solutions.pose.PoseLandmark.RIGHT_WRIST]
            
            # Check if hands are raised above shoulders
            hands_raised = (left_wrist.y < left_shoulder.y) or (right_wrist.y < right_shoulder.y)
            
            # Calculate overall posture score
            posture_score = shoulder_alignment * 0.7 + (0.3 if hands_raised else 0.0)
            
            return {
                'posture_score': posture_score,
                'shoulder_alignment': shoulder_alignment,
                'has_gesture': hands_raised,
                'left_shoulder_y': left_shoulder.y,
                'right_shoulder_y': right_shoulder.y,
                'left_wrist_y': left_wrist.y,
                'right_wrist_y': right_wrist.y
            }
            
        except Exception as e:
            logger.error(f"Pose analysis failed: {e}")
            return {
                'posture_score': 0.5,
                'shoulder_alignment': 0.5,
                'has_gesture': False
            }
    
    async def get_frame_analysis_summary(self, frames_path: str) -> Dict[str, Any]:
        """
        Get a summary of frame analysis
        
        Args:
            frames_path: Path to frames directory
            
        Returns:
            Summary of frame analysis
        """
        try:
            if not os.path.exists(frames_path):
                return {'error': 'Frames directory not found'}
            
            frame_files = [f for f in os.listdir(frames_path) if f.endswith(('.jpg', '.jpeg', '.png'))]
            
            return {
                'total_frames': len(frame_files),
                'frames_directory': frames_path,
                'frame_format': 'jpg',
                'analysis_ready': len(frame_files) > 0
            }
            
        except Exception as e:
            logger.error(f"Frame analysis summary failed: {e}")
            return {'error': str(e)}


# Global vision service instance
vision_service = VisionService()
