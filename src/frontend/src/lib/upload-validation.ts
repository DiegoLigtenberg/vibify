/**
 * Upload validation utilities for music files
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FileValidationOptions {
  maxFileSize: number; // in bytes
  allowedTypes: string[];
  minDuration: number; // in seconds
  maxDuration: number; // in seconds
  maxDescriptionLength: number;
  maxTitleLength: number;
  maxArtistLength: number;
  maxAlbumLength: number;
}

export const DEFAULT_VALIDATION_OPTIONS: FileValidationOptions = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: ['audio/mpeg', 'audio/mp3', 'audio/mpeg3', 'audio/x-mpeg-3'],
  minDuration: 60, // 1 minute
  maxDuration: 300, // 5 minutes
  maxDescriptionLength: 500, // Based on analysis: max 690, avg 279, set to 500 for reasonable limit
  maxTitleLength: 100,
  maxArtistLength: 100,
  maxAlbumLength: 100,
};

export const THUMBNAIL_VALIDATION_OPTIONS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  targetWidth: 1280,
  targetHeight: 720,
  minWidth: 640, // Minimum size before upscaling
  minHeight: 360,
  maxWidth: 2560, // Maximum size before requiring crop
  maxHeight: 1440,
};

export interface SongMetadata {
  title: string;
  artist: string;
  album?: string;
  description?: string;
  releaseDate?: string;
  youtubeUrl?: string;
  isPublic: boolean;
}

/**
 * Validate audio file type and size
 */
export function validateAudioFile(file: File, options: FileValidationOptions = DEFAULT_VALIDATION_OPTIONS): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file type
  if (!options.allowedTypes.includes(file.type)) {
    errors.push(`Invalid file type. Allowed types: ${options.allowedTypes.join(', ')}`);
  }

  // Check file size
  if (file.size > options.maxFileSize) {
    errors.push(`File too large. Maximum size: ${formatFileSize(options.maxFileSize)}`);
  }

  // Check if file is too small (likely corrupted)
  if (file.size < 1024) { // Less than 1KB
    errors.push('File appears to be corrupted or empty');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate image file for thumbnail
 */
export function validateImageFile(file: File, options = THUMBNAIL_VALIDATION_OPTIONS): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file type
  if (!options.allowedTypes.includes(file.type)) {
    errors.push(`Image type ${file.type} is not supported. Allowed types: ${options.allowedTypes.join(', ')}`);
  }

  // Check file size
  if (file.size > options.maxFileSize) {
    errors.push(`Image size ${formatFileSize(file.size)} exceeds maximum allowed size of ${formatFileSize(options.maxFileSize)}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get image dimensions from file
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Validate image dimensions
 */
export function validateImageDimensions(width: number, height: number, options = THUMBNAIL_VALIDATION_OPTIONS): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check minimum dimensions
  if (width < options.minWidth || height < options.minHeight) {
    errors.push(`Image too small. Minimum size: ${options.minWidth}x${options.minHeight}, got: ${width}x${height}`);
  }

  // Check maximum dimensions
  if (width > options.maxWidth || height > options.maxHeight) {
    warnings.push(`Image very large. Maximum recommended: ${options.maxWidth}x${options.maxHeight}, got: ${width}x${height}. Will be cropped.`);
  }

  // Check aspect ratio (should be close to 16:9)
  const aspectRatio = width / height;
  const targetAspectRatio = options.targetWidth / options.targetHeight;
  const aspectRatioDiff = Math.abs(aspectRatio - targetAspectRatio);
  
  if (aspectRatioDiff > 0.1) { // Allow 10% deviation
    warnings.push(`Image aspect ratio (${aspectRatio.toFixed(2)}) differs from target (${targetAspectRatio.toFixed(2)}). Will be cropped to fit.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Crop image to target dimensions
 */
export function cropImage(
  file: File, 
  cropX: number, 
  cropY: number, 
  cropWidth: number, 
  cropHeight: number,
  targetWidth: number = THUMBNAIL_VALIDATION_OPTIONS.targetWidth,
  targetHeight: number = THUMBNAIL_VALIDATION_OPTIONS.targetHeight
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    img.onload = () => {
      try {
        // Set canvas size to target dimensions
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // Draw cropped image scaled to target size
        ctx.drawImage(
          img,
          cropX, cropY, cropWidth, cropHeight, // Source rectangle
          0, 0, targetWidth, targetHeight      // Destination rectangle
        );
        
        // Convert to blob
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            const croppedFile = new File([blob], file.name, { type: 'image/png' });
            resolve(croppedFile);
          } else {
            reject(new Error('Failed to create cropped image'));
          }
        }, 'image/png', 0.9);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Calculate optimal crop area for 16:9 aspect ratio
 */
export function calculateOptimalCrop(width: number, height: number, targetWidth: number = THUMBNAIL_VALIDATION_OPTIONS.targetWidth, targetHeight: number = THUMBNAIL_VALIDATION_OPTIONS.targetHeight) {
  const targetAspectRatio = targetWidth / targetHeight;
  const currentAspectRatio = width / height;
  
  let cropWidth, cropHeight, cropX, cropY;
  
  if (currentAspectRatio > targetAspectRatio) {
    // Image is wider than target - crop sides
    cropHeight = height;
    cropWidth = height * targetAspectRatio;
    cropX = (width - cropWidth) / 2;
    cropY = 0;
  } else {
    // Image is taller than target - crop top/bottom
    cropWidth = width;
    cropHeight = width / targetAspectRatio;
    cropX = 0;
    cropY = (height - cropHeight) / 2;
  }
  
  return {
    x: Math.round(cropX),
    y: Math.round(cropY),
    width: Math.round(cropWidth),
    height: Math.round(cropHeight)
  };
}

/**
 * Validate song metadata
 */
export function validateSongMetadata(metadata: SongMetadata, options: FileValidationOptions = DEFAULT_VALIDATION_OPTIONS): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!metadata.title.trim()) {
    errors.push('Title is required');
  } else if (metadata.title.length > options.maxTitleLength) {
    errors.push(`Title too long. Maximum ${options.maxTitleLength} characters`);
  }

  if (!metadata.artist.trim()) {
    errors.push('Artist is required');
  } else if (metadata.artist.length > options.maxArtistLength) {
    errors.push(`Artist name too long. Maximum ${options.maxArtistLength} characters`);
  }

  // Optional fields
  if (metadata.album && metadata.album.length > options.maxAlbumLength) {
    errors.push(`Album name too long. Maximum ${options.maxAlbumLength} characters`);
  }

  if (metadata.description && metadata.description.length > options.maxDescriptionLength) {
    errors.push(`Description too long. Maximum ${options.maxDescriptionLength} characters`);
  }

  // Validate YouTube URL format
  if (metadata.youtubeUrl) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
    if (!youtubeRegex.test(metadata.youtubeUrl)) {
      errors.push('Invalid YouTube URL format');
    }
  }

  // Validate release date format (YYYY-MM-DD)
  if (metadata.releaseDate) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(metadata.releaseDate)) {
      errors.push('Release date must be in YYYY-MM-DD format');
    } else {
      const date = new Date(metadata.releaseDate);
      const now = new Date();
      if (date > now) {
        warnings.push('Release date is in the future');
      }
      if (date < new Date('1900-01-01')) {
        warnings.push('Release date seems too old');
      }
    }
  }

  // Content validation
  if (metadata.title && metadata.title.trim().length < 2) {
    warnings.push('Title seems too short');
  }

  if (metadata.artist && metadata.artist.trim().length < 2) {
    warnings.push('Artist name seems too short');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get audio duration from file
 */
export function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    });
    
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load audio file'));
    });
    
    audio.src = url;
  });
}

/**
 * Validate audio duration
 */
export async function validateAudioDuration(file: File, options: FileValidationOptions = DEFAULT_VALIDATION_OPTIONS): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const duration = await getAudioDuration(file);
    
    if (duration < options.minDuration) {
      errors.push(`Audio too short. Minimum duration: ${formatDuration(options.minDuration)}`);
    }
    
    if (duration > options.maxDuration) {
      errors.push(`Audio too long. Maximum duration: ${formatDuration(options.maxDuration)}`);
    }

    // Warn if very close to limits
    if (duration < options.minDuration + 10) {
      warnings.push('Audio is very close to minimum duration');
    }
    
    if (duration > options.maxDuration - 10) {
      warnings.push('Audio is very close to maximum duration');
    }

  } catch (error) {
    errors.push('Could not determine audio duration. File may be corrupted.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Comprehensive file validation
 */
export async function validateUploadFile(file: File, metadata: SongMetadata, options: FileValidationOptions = DEFAULT_VALIDATION_OPTIONS): Promise<ValidationResult> {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Validate file
  const fileValidation = validateAudioFile(file, options);
  allErrors.push(...fileValidation.errors);
  allWarnings.push(...fileValidation.warnings);

  // Validate metadata
  const metadataValidation = validateSongMetadata(metadata, options);
  allErrors.push(...metadataValidation.errors);
  allWarnings.push(...metadataValidation.warnings);

  // Validate duration
  const durationValidation = await validateAudioDuration(file, options);
  allErrors.push(...durationValidation.errors);
  allWarnings.push(...durationValidation.warnings);

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}

/**
 * Utility functions
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Sanitize text input to prevent XSS and ensure clean data
 */
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .substring(0, 1000); // Limit length
}

/**
 * Generate a clean filename from title and artist
 */
export function generateCleanFilename(title: string, artist: string): string {
  const cleanTitle = title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
  const cleanArtist = artist.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
  return `${cleanArtist}-${cleanTitle}`.toLowerCase();
}
