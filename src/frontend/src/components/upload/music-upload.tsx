'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Music, FileAudio, Edit3, Check, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/auth-store';
import { 
  validateAudioFile, 
  validateImageFile, 
  validateImageDimensions,
  getImageDimensions,
  cropImage,
  calculateOptimalCrop,
  validateSongMetadata,
  validateUploadFile,
  formatFileSize,
  formatDuration,
  sanitizeText,
  generateCleanFilename,
  DEFAULT_VALIDATION_OPTIONS,
  THUMBNAIL_VALIDATION_OPTIONS,
  type SongMetadata,
  type ValidationResult
} from '../../lib/upload-validation';

interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
  thumbnail?: string;
  metadata?: {
    title: string;
    artist: string;
    album?: string;
    description?: string;
    release_date?: string;
    youtube_url?: string;
    duration: number;
  };
}

export function MusicUpload() {
  const { user, isAuthenticated } = useAuthStore();
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [cropData, setCropData] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);

  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-spotify-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Upload Music</h1>
          <p className="text-spotify-muted mb-6">You must be logged in to upload music</p>
          <Button 
            onClick={() => window.location.href = '/'}
            variant="spotify"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const selectedFile = selectedFiles[0]; // Only take first file
    
    // Clear previous validation errors
    setValidationErrors([]);
    setValidationWarnings([]);
    
    // Validate audio file
    const audioValidation = validateAudioFile(selectedFile, DEFAULT_VALIDATION_OPTIONS);
    
    if (!audioValidation.isValid) {
      setValidationErrors(audioValidation.errors);
      return;
    }
    
    // Set warnings if any
    if (audioValidation.warnings.length > 0) {
      setValidationWarnings(audioValidation.warnings);
    }

    const newFile: UploadedFile = {
      id: Math.random().toString(36).substr(2, 9),
      file: selectedFile,
      status: 'pending',
      progress: 0,
      metadata: {
        title: sanitizeText(selectedFile.name.replace(/\.[^/.]+$/, "")), // Remove extension and sanitize
        artist: "Unknown Artist",
        duration: 0
      }
    };

    setFile(newFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = () => {
    setFile(null);
    setShowMetadataForm(false);
  };

  const startUpload = () => {
    if (!file) return;
    setShowMetadataForm(true);
  };

  const uploadFile = async () => {
    if (!file || !thumbnailFile) return;

    // User authentication is already checked in component render
    if (!user?.id) {
      console.error('No user ID available');
      return;
    }

    // Clear previous validation errors
    setValidationErrors([]);
    setValidationWarnings([]);

    // Prepare metadata for validation
    const metadata: SongMetadata = {
      title: file.metadata?.title || '',
      artist: file.metadata?.artist || '',
      album: file.metadata?.album,
      description: file.metadata?.description,
      releaseDate: file.metadata?.release_date,
      youtubeUrl: file.metadata?.youtube_url,
      isPublic: false
    };

    // Comprehensive validation
    try {
      const validation = await validateUploadFile(file.file, metadata, DEFAULT_VALIDATION_OPTIONS);
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return;
      }
      
      if (validation.warnings.length > 0) {
        setValidationWarnings(validation.warnings);
      }
    } catch (error) {
      setValidationErrors(['Validation failed. Please check your files and try again.']);
      return;
    }

    // Start upload process
    setFile(prev => prev ? { ...prev, status: 'uploading', progress: 0 } : null);

    try {
      // Prepare form data with sanitized inputs
      const formData = new FormData();
      formData.append('file', file.file);
      formData.append('title', sanitizeText(file.metadata?.title || ''));
      formData.append('artist', sanitizeText(file.metadata?.artist || ''));
      formData.append('album', sanitizeText(file.metadata?.album || ''));
      formData.append('description', sanitizeText(file.metadata?.description || ''));
      formData.append('release_date', file.metadata?.release_date || '');
      formData.append('youtube_url', file.metadata?.youtube_url || '');
      formData.append('is_public', 'false'); // User uploads start as private
      
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      // Upload to backend with progress tracking
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setFile(prev => prev ? { ...prev, progress } : null);
        }
      });

      const response = await new Promise<Response>((resolve, reject) => {
        xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/upload/song`);
        xhr.setRequestHeader('X-User-ID', user.id);
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: new Headers({ 'Content-Type': 'application/json' })
            }));
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        };
        
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(formData);
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result = await response.json();
      
      if (result.success) {
        // Mark as completed
        setFile(prev => prev ? { 
          ...prev, 
          status: 'completed', 
          progress: 100
        } : null);
        
        // Show success message
        alert('Song uploaded successfully! It will be reviewed before being made public.');
        
        // Reset form
        setFile(null);
        setShowMetadataForm(false);
        setThumbnailFile(null);
        setThumbnailPreview(null);
      } else {
        throw new Error(result.error || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      setFile(prev => prev ? { 
        ...prev, 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Upload failed'
      } : null);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const changeMusicFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = (e) => {
      const newFile = (e.target as HTMLInputElement).files?.[0];
      if (newFile && file) {
        setFile({ 
          ...file, 
          file: newFile,
          metadata: {
            ...file.metadata!,
            title: newFile.name.replace(/\.[^/.]+$/, "")
          }
        });
      }
    };
    input.click();
  };

  const handleThumbnailSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Clear previous validation errors
    setValidationErrors([]);
    setValidationWarnings([]);

    // Validate image file
    const imageValidation = validateImageFile(selectedFile, THUMBNAIL_VALIDATION_OPTIONS);
    
    if (!imageValidation.isValid) {
      setValidationErrors(imageValidation.errors);
      return;
    }

    try {
      // Get image dimensions
      const dimensions = await getImageDimensions(selectedFile);
      
      // Validate dimensions
      const dimensionValidation = validateImageDimensions(dimensions.width, dimensions.height, THUMBNAIL_VALIDATION_OPTIONS);
      
      if (!dimensionValidation.isValid) {
        setValidationErrors(dimensionValidation.errors);
        return;
      }

      // Set warnings if any
      if (dimensionValidation.warnings.length > 0) {
        setValidationWarnings(dimensionValidation.warnings);
      }

      // Process image based on size
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setOriginalImage(imageUrl);
        
        const targetWidth = THUMBNAIL_VALIDATION_OPTIONS.targetWidth;
        const targetHeight = THUMBNAIL_VALIDATION_OPTIONS.targetHeight;
        
        // Case 1: Exact size - use directly
        if (dimensions.width === targetWidth && dimensions.height === targetHeight) {
          processImage(imageUrl, selectedFile, false);
        }
        // Case 2: Smaller than target - auto-upscale
        else if (dimensions.width <= targetWidth && dimensions.height <= targetHeight) {
          processImage(imageUrl, selectedFile, false);
        }
        // Case 3: Larger than target - show crop interface
        else {
          setShowCropModal(true);
        }
      };
      reader.readAsDataURL(selectedFile);
      
    } catch (error) {
      setValidationErrors(['Failed to load image. Please try a different file.']);
    }
  };

  const processImage = async (imageUrl: string, file: File, isCropped: boolean = false) => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas to target size (1280x720)
      canvas.width = 1280;
      canvas.height = 720;

      if (isCropped && cropData) {
        // Crop and resize
        ctx.drawImage(
          img,
          cropData.x, cropData.y, cropData.width, cropData.height,
          0, 0, 1280, 720
        );
      } else {
        // Auto-upscale small images
        ctx.drawImage(img, 0, 0, 1280, 720);
      }

      // Convert to blob and update state
      canvas.toBlob((blob) => {
        if (blob) {
          const processedFile = new File([blob], file.name, { type: 'image/jpeg' });
          setThumbnailFile(processedFile);
          setThumbnailPreview(canvas.toDataURL());
        }
      }, 'image/jpeg', 0.9);
    };
    img.src = imageUrl;
  };

  const handleCrop = () => {
    if (originalImage && cropData) {
      // Create a temporary file for processing
      const tempFile = new File([], 'temp.jpg', { type: 'image/jpeg' });
      processImage(originalImage, tempFile, true);
      setShowCropModal(false);
      setCropData(null);
    }
  };

  const handleCropDrag = (e: React.MouseEvent) => {
    if (!cropImageRef.current || !cropData) return;

    const rect = cropImageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert screen coordinates to image coordinates
    const scaleX = cropImageRef.current.naturalWidth / rect.width;
    const scaleY = cropImageRef.current.naturalHeight / rect.height;
    
    const imageX = x * scaleX;
    const imageY = y * scaleY;
    
    if (isDragging && dragStart) {
      const deltaX = imageX - dragStart.x;
      const deltaY = imageY - dragStart.y;
      
      setCropData(prev => prev ? {
        ...prev,
        x: Math.max(0, Math.min(prev.x + deltaX, cropImageRef.current!.naturalWidth - prev.width)),
        y: Math.max(0, Math.min(prev.y + deltaY, cropImageRef.current!.naturalHeight - prev.height))
      } : null);
      
      setDragStart({ x: imageX, y: imageY });
    }
  };

  const handleCropMouseDown = (e: React.MouseEvent) => {
    if (!cropImageRef.current || !cropData) return;

    const rect = cropImageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const scaleX = cropImageRef.current.naturalWidth / rect.width;
    const scaleY = cropImageRef.current.naturalHeight / rect.height;
    
    setDragStart({ x: x * scaleX, y: y * scaleY });
    setIsDragging(true);
  };

  const handleCropMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setOriginalImage(null);
    setCropData(null);
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
  };

  // formatFileSize is now imported from upload-validation.ts

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Upload Music</h1>
        <p className="text-spotify-muted">Add your favorite songs to Vibify</p>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <h3 className="text-red-400 font-semibold mb-2">Upload Failed</h3>
          <ul className="text-red-300 text-sm space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Validation Warnings */}
      {validationWarnings.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
          <h3 className="text-yellow-400 font-semibold mb-2">Warnings</h3>
          <ul className="text-yellow-300 text-sm space-y-1">
            {validationWarnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload Area - Only show if no file selected */}
      {!file && (
      <div
        className={cn(
            'border-2 border-dashed rounded-lg p-12 text-center transition-colors',
          isDragOver
            ? 'border-spotify-green bg-green-900/20'
            : 'border-spotify-muted hover:border-spotify-text'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
          <Music className="h-16 w-16 text-spotify-muted mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-white mb-3">
            Drop your MP3 file here
        </h3>
          <p className="text-spotify-muted mb-6 text-lg">
          or click to browse your computer
        </p>
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="spotify"
            size="lg"
        >
            <Upload className="h-5 w-5 mr-2" />
            Choose File
        </Button>
        <input
          ref={fileInputRef}
          type="file"
            accept="audio/mpeg,.mp3"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>
      )}

      {/* Single File Display */}
      {file && !showMetadataForm && (
        <div className="bg-spotify-lightgray rounded-xl p-6 border border-spotify-gray/20">
          <div className="flex items-center space-x-4">
            {/* File Icon */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-spotify-gray rounded-lg flex items-center justify-center">
                <FileAudio className="h-8 w-8 text-spotify-muted" />
              </div>
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium text-lg truncate">
                {file.metadata?.title || file.file.name}
              </h4>
              <p className="text-spotify-muted text-sm">
                {formatFileSize(file.file.size)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={changeMusicFile}
                className="text-spotify-muted hover:text-white transition-colors p-2 rounded-lg hover:bg-spotify-gray/50"
                title="Change file"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              
              <button
                onClick={removeFile}
                className="text-spotify-muted hover:text-white transition-colors p-2 rounded-lg hover:bg-spotify-gray/50"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Subtle Continue Button */}
          <div className="mt-4 text-center">
            <button
              onClick={startUpload}
              className="text-spotify-green hover:text-white transition-colors text-sm font-medium"
              disabled={file.status === 'uploading'}
            >
              Continue to upload details →
            </button>
          </div>
        </div>
      )}

      {/* Metadata Form */}
      {showMetadataForm && file && (
        <div className="bg-spotify-lightgray rounded-xl p-6 border border-spotify-gray/20">
          <h3 className="text-xl font-semibold text-white mb-6">Upload Details</h3>
          
          <div className="space-y-6">
            {/* Thumbnail Upload */}
            <div>
              <label className="block text-white font-medium mb-3">
                Thumbnail <span className="text-red-400">*</span>
              </label>
              <div 
                className="w-32 h-32 bg-spotify-gray rounded-lg flex items-center justify-center border-2 border-dashed border-spotify-muted cursor-pointer hover:border-spotify-green transition-colors relative group"
                onClick={() => thumbnailInputRef.current?.click()}
              >
                {thumbnailPreview ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={thumbnailPreview} 
                      alt="Thumbnail preview" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeThumbnail();
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-spotify-muted mx-auto mb-2" />
                    <p className="text-xs text-spotify-muted">Click to upload</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-spotify-muted mt-2">
                Required: JPG, PNG, or WebP. Auto-upscaled to 1280x720. Large images will show crop interface.
              </p>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleThumbnailSelect}
                className="hidden"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-white font-medium mb-2">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={file.metadata?.title || ''}
                onChange={(e) => setFile(prev => prev ? {
                  ...prev,
                  metadata: { ...prev.metadata!, title: e.target.value }
                } : null)}
                className="w-full px-4 py-2 bg-spotify-gray border border-spotify-muted rounded-lg text-white placeholder-spotify-muted focus:border-spotify-green focus:outline-none"
                placeholder="Enter song title"
                required
              />
              <p className="text-xs text-spotify-muted mt-1">
                Required: Song title (max 200 characters)
              </p>
            </div>

            {/* Artist */}
            <div>
              <label className="block text-white font-medium mb-2">
                Artist <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={file.metadata?.artist || ''}
                onChange={(e) => setFile(prev => prev ? {
                  ...prev,
                  metadata: { ...prev.metadata!, artist: e.target.value }
                } : null)}
                className="w-full px-4 py-2 bg-spotify-gray border border-spotify-muted rounded-lg text-white placeholder-spotify-muted focus:border-spotify-green focus:outline-none"
                placeholder="Enter artist name"
                required
              />
              <p className="text-xs text-spotify-muted mt-1">
                Required: Artist name (max 100 characters)
              </p>
            </div>

            {/* Album */}
            <div>
              <label className="block text-white font-medium mb-2">Album</label>
              <input
                type="text"
                value={file.metadata?.album || ''}
                onChange={(e) => setFile(prev => prev ? {
                  ...prev,
                  metadata: { ...prev.metadata!, album: e.target.value }
                } : null)}
                className="w-full px-4 py-2 bg-spotify-gray border border-spotify-muted rounded-lg text-white placeholder-spotify-muted focus:border-spotify-green focus:outline-none"
                placeholder="Enter album name (optional)"
              />
              <p className="text-xs text-spotify-muted mt-1">
                Optional: Album name (max 100 characters)
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-white font-medium mb-2">Description</label>
              <textarea
                value={file.metadata?.description || ''}
                onChange={(e) => setFile(prev => prev ? {
                  ...prev,
                  metadata: { ...prev.metadata!, description: e.target.value }
                } : null)}
                className="w-full px-4 py-2 bg-spotify-gray border border-spotify-muted rounded-lg text-white placeholder-spotify-muted focus:border-spotify-green focus:outline-none resize-none"
                placeholder="Enter song description (optional)"
                rows={3}
              />
              <p className="text-xs text-spotify-muted mt-1">
                Optional: Song description (max 500 characters)
              </p>
            </div>

            {/* Release Date */}
            <div>
              <label className="block text-white font-medium mb-2">Release Date</label>
              <input
                type="date"
                value={file.metadata?.release_date || ''}
                onChange={(e) => setFile(prev => prev ? {
                  ...prev,
                  metadata: { ...prev.metadata!, release_date: e.target.value }
                } : null)}
                className="w-full px-4 py-2 bg-spotify-gray border border-spotify-muted rounded-lg text-white placeholder-spotify-muted focus:border-spotify-green focus:outline-none"
                placeholder="Select release date"
              />
              <p className="text-xs text-spotify-muted mt-1">
                Optional: When was this song released?
              </p>
            </div>

            {/* YouTube URL */}
            <div>
              <label className="block text-white font-medium mb-2">YouTube URL</label>
              <input
                type="url"
                value={file.metadata?.youtube_url || ''}
                onChange={(e) => setFile(prev => prev ? {
                  ...prev,
                  metadata: { ...prev.metadata!, youtube_url: e.target.value }
                } : null)}
                className="w-full px-4 py-2 bg-spotify-gray border border-spotify-muted rounded-lg text-white placeholder-spotify-muted focus:border-spotify-green focus:outline-none"
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-xs text-spotify-muted mt-1">
                Optional: Link to official YouTube video
              </p>
            </div>

            {/* Upload Button */}
            <div className="flex space-x-4">
              <Button
                onClick={() => setShowMetadataForm(false)}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={uploadFile}
                variant="spotify"
                className="flex-1"
                disabled={file.status === 'uploading' || !thumbnailFile || !file.metadata?.title || !file.metadata?.artist}
              >
                {file.status === 'uploading' ? 'Uploading...' : 'Upload Now'}
              </Button>
            </div>

            {/* Progress Bar */}
                  {file.status === 'uploading' && (
              <div>
                      <div className="w-full bg-spotify-gray rounded-full h-2">
                        <div
                          className="bg-spotify-green h-2 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                <p className="text-spotify-muted text-sm mt-2 text-center">
                        {file.progress}% uploaded
                      </p>
                    </div>
                  )}
          </div>
                    </div>
                  )}
                  
      {/* Crop Modal */}
      {showCropModal && originalImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-spotify-lightgray rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <h3 className="text-xl font-semibold text-white mb-4">Crop Image</h3>
            <p className="text-spotify-muted mb-4">
              Select the area you want to use for your thumbnail (will be resized to 1280x720)
            </p>
            
            <div className="relative mb-4 flex justify-center">
              <div 
                className="relative inline-block cursor-move"
                onMouseMove={handleCropDrag}
                onMouseUp={handleCropMouseUp}
                onMouseLeave={handleCropMouseUp}
              >
                <img
                  ref={cropImageRef}
                  src={originalImage}
                  alt="Crop preview"
                  className="max-w-full max-h-96 object-contain select-none"
                  onLoad={() => {
                    if (cropImageRef.current && !cropData) {
                      // Initialize crop area using optimal calculation
                      const imgWidth = cropImageRef.current.naturalWidth;
                      const imgHeight = cropImageRef.current.naturalHeight;
                      const optimalCrop = calculateOptimalCrop(imgWidth, imgHeight);
                      setCropData(optimalCrop);
                    }
                  }}
                />
                
                {/* Crop overlay */}
                {cropData && cropImageRef.current && (
                  <div
                    className="absolute border-2 border-spotify-green bg-spotify-green/20 pointer-events-auto cursor-move"
                    style={{
                      left: `${(cropData.x / cropImageRef.current.naturalWidth) * 100}%`,
                      top: `${(cropData.y / cropImageRef.current.naturalHeight) * 100}%`,
                      width: `${(cropData.width / cropImageRef.current.naturalWidth) * 100}%`,
                      height: `${(cropData.height / cropImageRef.current.naturalHeight) * 100}%`,
                    }}
                    onMouseDown={handleCropMouseDown}
                  />
                  )}
                </div>
            </div>
            
            <p className="text-sm text-spotify-muted text-center mb-4">
              Drag the green area to select the part of the image you want for your thumbnail
            </p>

            <div className="flex space-x-4">
              <Button
                onClick={handleCropCancel}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCrop}
                variant="spotify"
                className="flex-1"
              >
                Crop & Continue
              </Button>
              </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
