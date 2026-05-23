'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { formatBytes, formatDate } from '@/lib/utils';
import QRCode from 'qrcode.react';
import toast from 'react-hot-toast';
import { Navigation } from '@/components/Navigation';
import { PaymentModal } from '@/components/PaymentModal';

interface UploadInfo {
  filename: string;
  fileSizeBytes: string;
  uploadedAt: string;
  expiresAt: string;
  daysRemaining: number;
  downloadCount: number;
  downloadUrl: string;
  qrCode: string;
}

export default function DownloadPage() {
  const { uploadId } = useParams();
  const [uploadInfo, setUploadInfo] = useState<UploadInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloaded, setDownloaded] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const fetchUploadInfo = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/downloads/${uploadId}`);
        
        // Get QR code
        const qrResponse = await apiClient.get(`/api/downloads/${uploadId}/qr`);
        
        setUploadInfo({
          ...response.data,
          qrCode: qrResponse.data.qrCode,
        });
      } catch (error) {
        console.error('Failed to fetch upload info:', error);
        toast.error('File not found or expired');
      } finally {
        setLoading(false);
      }
    };

    if (uploadId) {
      fetchUploadInfo();
    }
  }, [uploadId]);

  const handleDownload = async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Please log in to download');
        return;
      }

      // Show payment modal
      setShowPaymentModal(true);
    } catch (error) {
      console.error('Download initiation failed:', error);
      toast.error('Failed to initiate download');
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      if (uploadInfo?.downloadUrl) {
        const link = document.createElement('a');
        link.href = uploadInfo.downloadUrl;
        link.download = uploadInfo.filename;
        link.click();
        setDownloaded(true);
        toast.success('Download started');
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed. Please try again.');
    }
  };

  const handleEmailShare = async () => {
    const email = prompt('Enter recipient email:');
    if (!email) return;

    try {
      await apiClient.post(`/api/downloads/${uploadId}/share`, {
        uploadId,
        recipientEmail: email,
      });
      toast.success('Download link sent!');
    } catch (error) {
      console.error('Share failed:', error);
      toast.error('Failed to share file');
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      </>
    );
  }

  if (!uploadInfo) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">File Not Found</h1>
            <p className="text-gray-600 mb-6">This file has expired or does not exist.</p>
            <a
              href="/upload"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Upload a File
            </a>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white">
              <h1 className="text-3xl font-bold mb-2">Ready to Download</h1>
              <p className="text-blue-100">Your file is ready to download</p>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* File info */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-4 bg-gray-100 rounded-lg">
                    <svg
                      className="w-8 h-8 text-gray-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{uploadInfo.filename}</h2>
                    <p className="text-gray-600 mt-1">
                      Size: {formatBytes(Number(uploadInfo.fileSizeBytes))}
                    </p>
                    <p className="text-gray-600">
                      Uploaded: {formatDate(uploadInfo.uploadedAt)}
                    </p>
                  </div>
                </div>

                {/* Expiration info */}
                <div className={`p-4 rounded-lg ${
                  uploadInfo.daysRemaining <= 3
                    ? 'bg-orange-50 border border-orange-200'
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  <p className={`font-semibold ${
                    uploadInfo.daysRemaining <= 3
                      ? 'text-orange-900'
                      : 'text-blue-900'
                  }`}>
                    ⏱️ Expires in {uploadInfo.daysRemaining} days
                  </p>
                  <p className={`text-sm mt-1 ${
                    uploadInfo.daysRemaining <= 3
                      ? 'text-orange-700'
                      : 'text-blue-700'
                  }`}>
                    Downloaded {uploadInfo.downloadCount} times
                  </p>
                </div>
              </div>

              {/* Download section */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Download File</h3>
                <button
                  onClick={handleDownload}
                  className="w-full px-6 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 mb-4"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Download File
                </button>
                {downloaded && (
                  <p className="text-green-600 font-medium text-center">
                    ✓ Download started. Check your downloads folder.
                  </p>
                )}
              </div>

              {/* QR Code section */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Share with QR Code</h3>
                <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                  <QRCode
                    value={window.location.href}
                    level="H"
                    size={200}
                    includeMargin
                  />
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">
                  Scan to share this download link
                </p>
              </div>

              {/* Share via email */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Share via Email</h3>
                <button
                  onClick={handleEmailShare}
                  className="w-full px-6 py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Download Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
