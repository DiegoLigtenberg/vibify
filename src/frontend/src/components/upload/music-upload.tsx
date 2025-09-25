'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Music, FileAudio } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export function MusicUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = Array.from(selectedFiles).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending',
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);
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

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const uploadFiles = async () => {
    // TODO: Implement actual upload logic
    console.log('Uploading files:', files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Upload Music</h1>
        <p className="text-spotify-muted">Add your favorite songs to Vibify</p>
      </div>

      {/* Upload Area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragOver
            ? 'border-spotify-green bg-green-900/20'
            : 'border-spotify-muted hover:border-spotify-text'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Music className="h-12 w-12 text-spotify-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Drop your music files here
        </h3>
        <p className="text-spotify-muted mb-4">
          or click to browse your computer
        </p>
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="spotify"
        >
          <Upload className="h-4 w-4 mr-2" />
          Choose Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Files to Upload ({files.length})
            </h3>
            <Button
              onClick={uploadFiles}
              variant="spotify"
              disabled={files.some(f => f.status === 'uploading')}
            >
              Upload All
            </Button>
          </div>

          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center space-x-4 p-4 bg-spotify-lightgray rounded-lg"
              >
                <FileAudio className="h-8 w-8 text-spotify-muted" />
                
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {file.file.name}
                  </p>
                  <p className="text-spotify-muted text-xs">
                    {formatFileSize(file.file.size)}
                  </p>
                  
                  {file.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="w-full bg-spotify-gray rounded-full h-2">
                        <div
                          className="bg-spotify-green h-2 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                      <p className="text-spotify-muted text-xs mt-1">
                        {file.progress}% uploaded
                      </p>
                    </div>
                  )}
                  
                  {file.status === 'error' && file.error && (
                    <p className="text-red-400 text-xs mt-1">
                      {file.error}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => removeFile(file.id)}
                  className="text-spotify-muted hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
