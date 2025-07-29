"""
Storage service for handling file uploads to different storage backends
"""
import os
import aiofiles
from typing import Optional, Union
from pathlib import Path
import uuid
from datetime import datetime

from app.core.config import settings
from app.core.logging import logger

# Optional imports for cloud storage
try:
    import firebase_admin
    from firebase_admin import storage as firebase_storage
    from firebase_admin import credentials
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    logger.warning("Firebase SDK not available")

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    logger.warning("Supabase client not available")


class StorageService:
    """
    Unified storage service that can work with local, Firebase, or Supabase storage
    """
    
    def __init__(self):
        self.storage_type = settings.STORAGE_TYPE
        self.firebase_app = None
        self.supabase_client = None
        self.initialized = False
    
    async def initialize(self):
        """Initialize the storage service based on configuration"""
        try:
            if self.storage_type == "firebase" and FIREBASE_AVAILABLE:
                await self._initialize_firebase()
            elif self.storage_type == "supabase" and SUPABASE_AVAILABLE:
                await self._initialize_supabase()
            elif self.storage_type == "local":
                await self._initialize_local()
            else:
                logger.warning(f"Storage type {self.storage_type} not available, falling back to local")
                self.storage_type = "local"
                await self._initialize_local()
            
            self.initialized = True
            logger.info(f"Storage service initialized with {self.storage_type} backend")
            
        except Exception as e:
            logger.error(f"Failed to initialize storage service: {e}")
            raise
    
    async def _initialize_firebase(self):
        """Initialize Firebase storage"""
        if not settings.FIREBASE_CREDENTIALS_PATH or not settings.FIREBASE_PROJECT_ID:
            raise ValueError("Firebase credentials not configured")
        
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        self.firebase_app = firebase_admin.initialize_app(cred, {
            'storageBucket': settings.FIREBASE_STORAGE_BUCKET
        })
    
    async def _initialize_supabase(self):
        """Initialize Supabase storage"""
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            raise ValueError("Supabase credentials not configured")
        
        self.supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    
    async def _initialize_local(self):
        """Initialize local storage"""
        Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
        Path(os.path.join(settings.UPLOAD_DIR, "videos")).mkdir(parents=True, exist_ok=True)
        Path(os.path.join(settings.UPLOAD_DIR, "audio")).mkdir(parents=True, exist_ok=True)
        Path(os.path.join(settings.UPLOAD_DIR, "frames")).mkdir(parents=True, exist_ok=True)
        Path("reports").mkdir(parents=True, exist_ok=True)
    
    async def save_file(self, filename: str, content: bytes, folder: str = "videos") -> str:
        """
        Save a file to the configured storage backend
        
        Args:
            filename: Name of the file
            content: File content as bytes
            folder: Folder to save the file in
            
        Returns:
            URL or path to the saved file
        """
        if not self.initialized:
            await self.initialize()
        
        try:
            if self.storage_type == "firebase":
                return await self._save_to_firebase(filename, content, folder)
            elif self.storage_type == "supabase":
                return await self._save_to_supabase(filename, content, folder)
            else:
                return await self._save_to_local(filename, content, folder)
                
        except Exception as e:
            logger.error(f"Failed to save file {filename}: {e}")
            raise
    
    async def _save_to_firebase(self, filename: str, content: bytes, folder: str) -> str:
        """Save file to Firebase Storage"""
        bucket = firebase_storage.bucket(app=self.firebase_app)
        blob_path = f"{folder}/{filename}"
        blob = bucket.blob(blob_path)
        
        blob.upload_from_string(content)
        blob.make_public()
        
        return blob.public_url
    
    async def _save_to_supabase(self, filename: str, content: bytes, folder: str) -> str:
        """Save file to Supabase Storage"""
        bucket_name = settings.SUPABASE_BUCKET
        file_path = f"{folder}/{filename}"
        
        result = self.supabase_client.storage.from_(bucket_name).upload(file_path, content)
        
        if result.get("error"):
            raise Exception(f"Supabase upload failed: {result['error']}")
        
        # Get public URL
        public_url = self.supabase_client.storage.from_(bucket_name).get_public_url(file_path)
        return public_url
    
    async def _save_to_local(self, filename: str, content: bytes, folder: str) -> str:
        """Save file to local storage"""
        file_path = os.path.join(settings.UPLOAD_DIR, folder, filename)
        
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        return file_path
    
    async def delete_file(self, file_path: str) -> bool:
        """
        Delete a file from storage
        
        Args:
            file_path: Path or URL of the file to delete
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if self.storage_type == "firebase":
                return await self._delete_from_firebase(file_path)
            elif self.storage_type == "supabase":
                return await self._delete_from_supabase(file_path)
            else:
                return await self._delete_from_local(file_path)
                
        except Exception as e:
            logger.error(f"Failed to delete file {file_path}: {e}")
            return False
    
    async def _delete_from_firebase(self, file_path: str) -> bool:
        """Delete file from Firebase Storage"""
        bucket = firebase_storage.bucket(app=self.firebase_app)
        blob = bucket.blob(file_path)
        blob.delete()
        return True
    
    async def _delete_from_supabase(self, file_path: str) -> bool:
        """Delete file from Supabase Storage"""
        bucket_name = settings.SUPABASE_BUCKET
        result = self.supabase_client.storage.from_(bucket_name).remove([file_path])
        return not result.get("error")
    
    async def _delete_from_local(self, file_path: str) -> bool:
        """Delete file from local storage"""
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    
    async def get_file_url(self, filename: str, folder: str = "videos") -> Optional[str]:
        """
        Get the URL for a file
        
        Args:
            filename: Name of the file
            folder: Folder the file is in
            
        Returns:
            URL to access the file
        """
        try:
            if self.storage_type == "firebase":
                bucket = firebase_storage.bucket(app=self.firebase_app)
                blob = bucket.blob(f"{folder}/{filename}")
                return blob.public_url
            elif self.storage_type == "supabase":
                bucket_name = settings.SUPABASE_BUCKET
                return self.supabase_client.storage.from_(bucket_name).get_public_url(f"{folder}/{filename}")
            else:
                return os.path.join(settings.UPLOAD_DIR, folder, filename)
                
        except Exception as e:
            logger.error(f"Failed to get file URL for {filename}: {e}")
            return None
    
    async def health_check(self) -> bool:
        """
        Check if the storage service is healthy
        
        Returns:
            True if healthy, False otherwise
        """
        try:
            if self.storage_type == "firebase":
                bucket = firebase_storage.bucket(app=self.firebase_app)
                # Try to list one file to check connection
                list(bucket.list_blobs(max_results=1))
                return True
            elif self.storage_type == "supabase":
                # Try to list buckets to check connection
                result = self.supabase_client.storage.list_buckets()
                return not result.get("error")
            else:
                # Check if upload directory exists and is writable
                return os.path.exists(settings.UPLOAD_DIR) and os.access(settings.UPLOAD_DIR, os.W_OK)
                
        except Exception as e:
            logger.error(f"Storage health check failed: {e}")
            return False
    
    async def cleanup(self):
        """Clean up resources"""
        if self.firebase_app:
            firebase_admin.delete_app(self.firebase_app)
        
        if self.supabase_client:
            # Supabase client doesn't need explicit cleanup
            pass
        
        logger.info("Storage service cleanup completed")


# Global storage service instance
storage_service = StorageService()
