"""
File validation utilities for Vibify
"""

import os
import logging
from pathlib import Path
from typing import List, Tuple, Optional
from PIL import Image
import mutagen
from mutagen.mp3 import MP3
from mutagen.id3 import ID3NoHeaderError

logger = logging.getLogger(__name__)

class FileValidator:
    """Validates audio and image files for upload"""
    
    def __init__(self, max_file_size_mb: int = 50, allowed_audio_formats: List[str] = None, 
                 allowed_image_formats: List[str] = None):
        self.max_file_size_bytes = max_file_size_mb * 1024 * 1024
        self.allowed_audio_formats = allowed_audio_formats or ["mp3", "wav", "flac", "m4a", "aac"]
        self.allowed_image_formats = allowed_image_formats or ["jpg", "jpeg", "png", "webp"]
    
    def validate_audio_file(self, file_path: Path) -> Tuple[bool, str]:
        """
        Validate audio file
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            # Check file exists
            if not file_path.exists():
                return False, f"File does not exist: {file_path}"
            
            # Check file size
            file_size = file_path.stat().st_size
            if file_size > self.max_file_size_bytes:
                return False, f"File too large: {file_size / (1024*1024):.1f}MB > {self.max_file_size_bytes / (1024*1024)}MB"
            
            if file_size == 0:
                return False, "File is empty"
            
            # Check file extension
            file_ext = file_path.suffix.lower().lstrip('.')
            if file_ext not in self.allowed_audio_formats:
                return False, f"Unsupported audio format: {file_ext}. Allowed: {', '.join(self.allowed_audio_formats)}"
            
            # Try to read audio metadata
            try:
                audio_file = mutagen.File(str(file_path))
                if audio_file is None:
                    return False, "Unable to read audio file metadata"
                
                # Check if it's actually an audio file
                if not hasattr(audio_file, 'info'):
                    return False, "File does not contain valid audio data"
                
                # Check duration (optional)
                if hasattr(audio_file.info, 'length') and audio_file.info.length <= 0:
                    return False, "Audio file has invalid duration"
                
            except Exception as e:
                logger.warning(f"Could not read audio metadata for {file_path}: {e}")
                # Don't fail validation for metadata issues, just warn
            
            return True, ""
            
        except Exception as e:
            logger.error(f"Error validating audio file {file_path}: {e}")
            return False, f"Validation error: {str(e)}"
    
    def validate_image_file(self, file_path: Path) -> Tuple[bool, str]:
        """
        Validate image file
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            # Check file exists
            if not file_path.exists():
                return False, f"File does not exist: {file_path}"
            
            # Check file size
            file_size = file_path.stat().st_size
            if file_size > self.max_file_size_bytes:
                return False, f"File too large: {file_size / (1024*1024):.1f}MB > {self.max_file_size_bytes / (1024*1024)}MB"
            
            if file_size == 0:
                return False, "File is empty"
            
            # Check file extension
            file_ext = file_path.suffix.lower().lstrip('.')
            if file_ext not in self.allowed_image_formats:
                return False, f"Unsupported image format: {file_ext}. Allowed: {', '.join(self.allowed_image_formats)}"
            
            # Try to open as image
            try:
                with Image.open(file_path) as img:
                    # Check if it's actually an image
                    img.verify()
                    
                    # Check dimensions (optional)
                    if img.size[0] < 50 or img.size[1] < 50:
                        return False, f"Image too small: {img.size}. Minimum: 50x50 pixels"
                    
                    if img.size[0] > 5000 or img.size[1] > 5000:
                        return False, f"Image too large: {img.size}. Maximum: 5000x5000 pixels"
                
            except Exception as e:
                return False, f"Invalid image file: {str(e)}"
            
            return True, ""
            
        except Exception as e:
            logger.error(f"Error validating image file {file_path}: {e}")
            return False, f"Validation error: {str(e)}"
    
    def validate_file_pair(self, audio_path: Path, image_path: Path) -> Tuple[bool, List[str]]:
        """
        Validate both audio and image files for a song
        
        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []
        
        # Validate audio file
        audio_valid, audio_error = self.validate_audio_file(audio_path)
        if not audio_valid:
            errors.append(f"Audio: {audio_error}")
        
        # Validate image file
        image_valid, image_error = self.validate_image_file(image_path)
        if not image_valid:
            errors.append(f"Image: {image_error}")
        
        return len(errors) == 0, errors

def get_audio_duration(file_path: Path) -> Optional[float]:
    """Get audio file duration in seconds"""
    try:
        audio_file = mutagen.File(str(file_path))
        if audio_file and hasattr(audio_file, 'info') and hasattr(audio_file.info, 'length'):
            return audio_file.info.length
    except Exception as e:
        logger.warning(f"Could not get duration for {file_path}: {e}")
    return None

def get_image_dimensions(file_path: Path) -> Optional[Tuple[int, int]]:
    """Get image dimensions as (width, height)"""
    try:
        with Image.open(file_path) as img:
            return img.size
    except Exception as e:
        logger.warning(f"Could not get dimensions for {file_path}: {e}")
    return None
