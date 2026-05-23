import React, { useState } from 'react';
import { FileUploader } from './FileUploader';
import { StorageQuota } from './StorageQuota';
import { PaymentModal } from './PaymentModal';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { generateFileHash } from '@/lib/file-utils';

interface UploadPageProps {
  onSuccess?: (uploadId: string) => void;
}

export function UploadPage({ onSuccess }: UploadPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageQuota, setStorageQuota] = useState(2147483648); // 2GB
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);

  // Fetch user storage info
  React.useEffect(() => {
    const fetchStorageInfo = async () => {
      try {
        const response = await apiClient.get('/api/profile/storage');
        setStorageUsed(Number(response.data.storageUsedBytes));
        setStorageQuota(Number(response.data.storageQuotaBytes));
      } catch (error) {
        console.error('Failed to fetch storage info:', error);
      }
    };

    fetchStorageInfo();
  }, []);

  const handleFileUpload = async (selectedFile: File) => {
    try {
      setUploading(true);
      setFile(selectedFile);

      // Check quota
      const wouldExceedQuota = storageUsed + selectedFile.size > storageQuota;
      if (wouldExceedQuota) {
        toast.error('Storage quota would be exceeded');
        setUploading(false);
        return;
      }

      // Generate file hash
      const fileHash = await generateFileHash(selectedFile);

      // Convert file to buffer
      const fileBuffer = await selectedFile.arrayBuffer();

      // Upload to backend
      const response = await apiClient.post('/api/uploads', {
        filename: selectedFile.name,
        fileBuffer: new Uint8Array(fileBuffer),
        fileSizeBytes: selectedFile.size,
        mimeType: selectedFile.type,
        fileHash,
      });

      const newUploadId = response.data.upload.id;
      setUploadId(newUploadId);
      setStorageUsed(storageUsed + selectedFile.size);

      toast.success('File uploaded successfully!');

      // Show payment modal for unauthenticated users
      const token = localStorage.getItem('authToken');
      if (!token) {
        setShowPaymentModal(true);
      } else {
        onSuccess?.(newUploadId);
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      const message = error.response?.data?.error || 'Upload failed';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Upload a File</h1>
          <p className="mt-2 text-gray-600">Share large files securely with 15-day expiration</p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload section */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <FileUploader
            onUpload={handleFileUpload}
            disabled={uploading}
          />
        </div>

        {/* Storage quota */}
        {file && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Upload Preview: {file.name}
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">File size:</span>
                <span className="font-medium text-gray-900">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <StorageQuota
                used={storageUsed + file.size}
                limit={storageQuota}
                showDetails
              />
            </div>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Fast & Secure</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Files are uploaded directly to secure AWS S3 storage with encryption.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Auto Expiration</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Files automatically expire and are deleted after 15 days.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Easy Sharing</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Share with QR codes or email. Track downloads in real-time.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Flexible Pricing</h3>
                <p className="mt-2 text-sm text-gray-600">
                  $1.99 per download or $3.99/month for unlimited downloads.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          setShowPaymentModal(false);
          onSuccess?.(uploadId || '');
        }}
      />
    </div>
  );
}
