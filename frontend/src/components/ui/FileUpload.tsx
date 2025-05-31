import React, { useRef, useState } from 'react';
import { Upload, X, FileText, Image, File, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  maxFiles?: number;
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.txt',
  multiple = true,
  maxSize = 10,
  maxFiles = 5,
  label,
  helperText,
  error,
  disabled = false,
  className = ''
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-5 w-5 text-primary" />;
    }
    if (file.type.includes('pdf') || file.type.includes('document')) {
      return <FileText className="h-5 w-5 text-danger" />;
    }
    return <File className="h-5 w-5 text-text-secondary" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }
    return null;
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles);
    const validFiles: File[] = [];
    const errors: string[] = [];

    newFiles.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      console.error('File validation errors:', errors);
      return;
    }

    const totalFiles = files.length + validFiles.length;
    if (totalFiles > maxFiles) {
      console.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const updatedFiles = [...files, ...validFiles];
    setFiles(updatedFiles);
    onFileSelect(updatedFiles);
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFileSelect(updatedFiles);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-2">
          {label}
        </label>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-xl p-6 transition-all duration-200
          ${dragOver ? 'border-primary bg-primary-50' : 'border-border'}
          ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-primary hover:bg-primary-50'}
          ${error ? 'border-danger' : ''}
        `}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        <div className="text-center">
          <Upload className={`mx-auto h-8 w-8 mb-3 ${dragOver ? 'text-primary' : 'text-text-secondary'}`} />
          <p className="text-sm font-medium text-text-primary mb-1">
            {dragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs text-text-secondary">
            {accept.split(',').join(', ')} up to {maxSize}MB each
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-text-primary">
            Uploaded Files ({files.length}/{maxFiles})
          </p>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
            >
              <div className="flex items-center space-x-3">
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="p-1 text-text-secondary hover:text-danger transition-colors"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(error || helperText) && (
        <div className="mt-2 text-sm">
          {error ? (
            <span className="text-danger flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {error}
            </span>
          ) : (
            <span className="text-text-secondary">{helperText}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;