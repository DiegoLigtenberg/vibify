"""
Backblaze B2 Client for Vibify
Handles file uploads, downloads, and URL generation
"""

import os
import requests
import boto3
from base64 import b64encode
from typing import Optional
from botocore.exceptions import ClientError
from datetime import datetime, timedelta
from ..config.logging_global import get_logger

# Setup logging
logger = get_logger(__name__)

class B2Client:
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(B2Client, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        from ..config.simple_config import Config
        
        # Configuration
        self.key_id = Config.B2_KEY_ID
        self.application_key = Config.B2_APPLICATION_KEY
        self.bucket_name = Config.B2_BUCKET_NAME
        self.endpoint_url = Config.B2_ENDPOINT_URL
        self.audio_folder = Config.B2_AUDIO_FOLDER
        self.thumbnail_folder = Config.B2_THUMBNAIL_FOLDER
        self.api_url = Config.B2_API_URL
        
        # Authentication state with caching
        self._auth_token = None
        self._download_url = None
        self._bucket_id = None
        self._is_authenticated = False
        self._auth_expires_at = None
        self._session = requests.Session()  # Reuse connections
        
        # Initialize S3 client for B2 (for uploads and presigned URLs)
        self.s3_client = boto3.client(
            's3',
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.key_id,
            aws_secret_access_key=self.application_key
        )
        
        # Mark as initialized
        self._initialized = True
        
        # Pre-authenticate on startup
        self._ensure_authenticated()
    
    def _ensure_authenticated(self) -> bool:
        """Ensure we have valid authentication with B2 API (with caching)"""
        # Check if we have a valid cached token
        if (self._is_authenticated and 
            self._auth_expires_at and 
            datetime.now() < self._auth_expires_at):
            return True
            
        try:
            # Prepare authentication
            auth_string = f"{self.key_id}:{self.application_key}"
            auth_b64 = b64encode(auth_string.encode('ascii')).decode('ascii')
            
            # Use session for connection reuse
            response = self._session.get(
                f"{self.api_url}/b2api/v2/b2_authorize_account",
                headers={'Authorization': f'Basic {auth_b64}'},
                timeout=30
            )
            
            if response.status_code != 200:
                raise Exception(f"B2 authentication failed: {response.status_code} - {response.text}")
            
            data = response.json()
            self._auth_token = data['authorizationToken']
            self._download_url = data['downloadUrl']
            self._bucket_id = self._find_bucket_id(data)
            
            if not self._bucket_id:
                raise Exception(f"Bucket '{self.bucket_name}' not found in allowed buckets")
            
            # Cache for 23 hours (B2 tokens are valid for 24 hours)
            self._auth_expires_at = datetime.now() + timedelta(hours=23)
            self._is_authenticated = True
            
            logger.info("B2 authentication successful and cached")
            return True
            
        except requests.RequestException as e:
            logger.error(f"Network error during B2 authentication: {e}")
            raise Exception(f"B2 authentication network error: {e}")
    
    def _find_bucket_id(self, auth_data: dict) -> Optional[str]:
        """Find bucket ID from authentication response"""
        allowed = auth_data.get('allowed', {})
        
        # Check if allowed contains bucket info directly (single bucket access)
        if allowed.get('bucketName') == self.bucket_name:
            return allowed.get('bucketId')
        
        # Check if allowed contains buckets array (multiple bucket access)
        buckets = allowed.get('buckets', [])
        if isinstance(buckets, list):
            for bucket in buckets:
                if bucket.get('bucketName') == self.bucket_name:
                    return bucket.get('bucketId')
        
        return None
    
    def _get_download_authorization(self) -> Optional[str]:
        """Get download authorization token for private bucket access (cached)"""
        # For now, we're using the main auth token directly in URLs
        # This method is kept for future use if needed
        return self._auth_token
    
    def get_audio_url(self, filename: str) -> str:
        """Generate download URL for audio file using Native B2 API (optimized)"""
        if not filename:
            return ""
        
        # Ensure we're authenticated (cached)
        self._ensure_authenticated()
        
        # Clean filename
        if filename.startswith(f"{self.audio_folder}/"):
            filename = filename[len(f"{self.audio_folder}/"):]
        
        # Use Native B2 download URL with authorization token
        download_url = f"{self._download_url}/file/{self.bucket_name}/{self.audio_folder}/{filename}?Authorization={self._auth_token}"
        
        return download_url
    
    def get_thumbnail_url(self, filename: str) -> str:
        """Generate download URL for thumbnail file using Native B2 API (optimized)"""
        if not filename:
            return ""
        
        # Ensure we're authenticated (cached)
        self._ensure_authenticated()
        
        # Clean filename
        if filename.startswith(f"{self.thumbnail_folder}/"):
            filename = filename[len(f"{self.thumbnail_folder}/"):]
        
        # Use Native B2 download URL with authorization token
        download_url = f"{self._download_url}/file/{self.bucket_name}/{self.thumbnail_folder}/{filename}?Authorization={self._auth_token}"
        
        return download_url
    
    def upload_audio(self, file_path: str, filename: str) -> None:
        """Upload audio file to B2"""
        try:
            key = f"{self.audio_folder}/{filename}"
            self.s3_client.upload_file(file_path, self.bucket_name, key)
        except ClientError as e:
            logger.error(f"Error uploading audio file {filename}: {e}")
            raise
    
    def upload_thumbnail(self, file_path: str, filename: str) -> None:
        """Upload thumbnail file to B2"""
        try:
            key = f"{self.thumbnail_folder}/{filename}"
            self.s3_client.upload_file(file_path, self.bucket_name, key)
        except ClientError as e:
            logger.error(f"Error uploading thumbnail file {filename}: {e}")
            raise
    
    def file_exists(self, folder: str, filename: str) -> bool:
        """Check if file exists in B2"""
        try:
            key = f"{folder}/{filename}"
            self.s3_client.head_object(Bucket=self.bucket_name, Key=key)
            return True
        except ClientError:
            return False
    
    def delete_file(self, folder: str, filename: str) -> None:
        """Delete file from B2"""
        try:
            key = f"{folder}/{filename}"
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=key)
        except ClientError as e:
            logger.error(f"Error deleting file {filename}: {e}")
            raise
    
    def warm_up(self):
        """Pre-authenticate to warm up the connection"""
        try:
            self._ensure_authenticated()
            logger.info("B2 client warmed up successfully")
        except Exception as e:
            logger.error(f"Failed to warm up B2 client: {e}")
    
    def is_authenticated(self) -> bool:
        """Check if client is currently authenticated"""
        return (self._is_authenticated and 
                self._auth_expires_at and 
                datetime.now() < self._auth_expires_at)

