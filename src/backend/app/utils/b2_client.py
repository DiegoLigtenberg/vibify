"""
Backblaze B2 Client for Vibify
Handles file uploads, downloads, and URL generation
"""

import os
import boto3
from typing import Optional
from botocore.exceptions import ClientError
from ..config.logging_global import get_logger

# Setup logging
logger = get_logger(__name__)

class B2Client:
    def __init__(self):
        self.key_id = os.getenv("B2_APPLICATION_KEY_ID")
        self.application_key = os.getenv("B2_APPLICATION_KEY")
        self.bucket_name = os.getenv("B2_BUCKET_NAME")
        self.endpoint_url = os.getenv("B2_ENDPOINT_URL")
        self.audio_folder = os.getenv("B2_AUDIO_FOLDER", "audio")
        self.thumbnail_folder = os.getenv("B2_THUMBNAIL_FOLDER", "thumbnails")
        self.base_url = os.getenv("B2_BASE_URL")
        
        # Initialize S3 client for B2
        self.s3_client = boto3.client(
            's3',
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.key_id,
            aws_secret_access_key=self.application_key
        )
    
    def get_audio_url(self, filename: str) -> str:
        """
        Generate public URL for audio file
        Example: audio/0000000.mp3 -> https://f003.backblazeb2.com/file/bucket-vibify/audio/0000000.mp3
        """
        if not filename:
            return ""
        
        # Ensure filename doesn't start with folder name
        if filename.startswith(f"{self.audio_folder}/"):
            filename = filename[len(f"{self.audio_folder}/"):]
        
        return f"{self.base_url}/file/{self.bucket_name}/{self.audio_folder}/{filename}"
    
    def get_thumbnail_url(self, filename: str) -> str:
        """
        Generate public URL for thumbnail file
        Example: thumbnail/0000000.png -> https://f003.backblazeb2.com/file/bucket-vibify/thumbnails/0000000.png
        """
        if not filename:
            return ""
        
        # Ensure filename doesn't start with folder name
        if filename.startswith(f"{self.thumbnail_folder}/"):
            filename = filename[len(f"{self.thumbnail_folder}/"):]
        
        # Use correct B2 URL format with bucket name
        return f"{self.base_url}/file/{self.bucket_name}/{self.thumbnail_folder}/{filename}"
    
    def upload_audio(self, file_path: str, filename: str) -> bool:
        """
        Upload audio file to B2
        """
        try:
            key = f"{self.audio_folder}/{filename}"
            self.s3_client.upload_file(file_path, self.bucket_name, key)
            return True
        except ClientError as e:
            logger.error(f"Error uploading audio file: {e}")
            return False
    
    def upload_thumbnail(self, file_path: str, filename: str) -> bool:
        """
        Upload thumbnail file to B2
        """
        try:
            key = f"{self.thumbnail_folder}/{filename}"
            self.s3_client.upload_file(file_path, self.bucket_name, key)
            return True
        except ClientError as e:
            logger.error(f"Error uploading thumbnail file: {e}")
            return False
    
    def file_exists(self, folder: str, filename: str) -> bool:
        """
        Check if file exists in B2
        """
        try:
            key = f"{folder}/{filename}"
            self.s3_client.head_object(Bucket=self.bucket_name, Key=key)
            return True
        except ClientError:
            return False
    
    def delete_file(self, folder: str, filename: str) -> bool:
        """
        Delete file from B2
        """
        try:
            key = f"{folder}/{filename}"
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=key)
            return True
        except ClientError as e:
            logger.error(f"Error deleting file: {e}")
            return False

# No global instance - create instances as needed
