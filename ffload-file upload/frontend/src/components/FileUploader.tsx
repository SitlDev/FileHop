import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { formatBytes } from '@/lib/utils';
import { MAX_FILE_SIZE } from '@/lib/constants';

interface FileUploaderProps {
  onUpload?: (file: File) => void;
  onProgress?: (progress: number) => void;
  disabled?: boolean;
}

export function FileUploader({ onUpload, onProgress: _onProgress, disabled = false }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        toast.error('Invalid file type');
        return;
      }

      const file = acceptedFiles[0];

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File exceeds maximum size of ${formatBytes(MAX_FILE_SIZE)}`);
        return;
      }

      setUploading(true);
      setProgress(0);

      // Simulate upload progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + Math.random() * 30;
        });
      }, 200);

      // Call parent handler
      if (onUpload) {
        onUpload(file);
      }

      // Cleanup
      setTimeout(() => {
        clearInterval(interval);
        setProgress(100);
        setUploading(false);
        setProgress(0);
      }, 2000);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: disabled || uploading,
    noClick: uploading,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        relative border-2 border-dashed rounded-lg p-8 transition-all duration-200
        ${isDragActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }
        ${(disabled || uploading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <input {...getInputProps()} />

      <div className="text-center">
        <svg
          className={`mx-auto h-12 w-12 ${uploading ? 'text-blue-500' : 'text-gray-400'}`}
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M16 20l8-8 8 8M24 12v16" strokeWidth={2} strokeLinecap="round" />
        </svg>

        <p className="mt-4 text-lg font-medium text-gray-900">
          {uploading ? 'Uploading...' : 'Drop your file here'}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          or click to select (max {formatBytes(MAX_FILE_SIZE)})
        </p>

        {uploading && (
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
