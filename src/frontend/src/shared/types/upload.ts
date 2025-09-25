export interface UploadProgress {
  file_id: string;
  filename: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number; // 0-100
  error_message?: string;
  uploaded_at?: string;
}

export interface UploadValidation {
  file_id: string;
  filename: string;
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  file_size: number;
  duration?: number;
  format: string;
}

export interface UploadRequest {
  files: File[];
  metadata?: Record<string, any>;
}

export interface UploadResponse {
  upload_id: string;
  files: UploadProgress[];
  total_files: number;
  completed_files: number;
  failed_files: number;
}

export interface UploadStatus {
  upload_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  files: UploadProgress[];
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface FileValidationRules {
  max_file_size: number; // in bytes
  allowed_formats: string[];
  max_duration?: number; // in seconds
  min_duration?: number; // in seconds
}

export interface UploadSettings {
  validation_rules: FileValidationRules;
  auto_process: boolean;
  generate_thumbnails: boolean;
  extract_metadata: boolean;
}
