import React, { useState, useEffect } from 'react';
import { StorageQuota } from './StorageQuota';
import { SubscriptionManager } from './SubscriptionManager';
import { FileList } from './FileList';
import { formatBytes } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name?: string;
  storageUsedBytes: number;
  storageQuotaBytes: number;
  subscriptionStatus: 'free' | 'active' | 'cancelled';
}

export function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [profileRes, uploadsRes] = await Promise.all([
        apiClient.get('/api/profile'),
        apiClient.get('/api/uploads'),
      ]);

      if (profileRes.data.user) {
        setUser(profileRes.data.user);
      }

      if (uploadsRes.data.uploads) {
        setUploads(uploadsRes.data.uploads);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uploadId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await apiClient.delete(`/api/uploads/${uploadId}`);
      setUploads(uploads.filter((u) => u.id !== uploadId));
      toast.success('File deleted successfully');
      // Refetch user to update storage
      fetchData();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleShare = async (uploadId: string) => {
    const recipientEmail = prompt('Enter recipient email:');
    if (!recipientEmail) return;

    try {
      await apiClient.post(`/api/downloads/${uploadId}/share`, {
        recipientEmail,
      });
      toast.success('Download link sent!');
    } catch (error) {
      console.error('Share failed:', error);
      toast.error('Failed to share file');
    }
  };

  const handleDownload = async (uploadId: string) => {
    try {
      const response = await apiClient.get(`/api/downloads/${uploadId}`);
      const downloadUrl = response.data.downloadUrl;

      // Create a temporary link and click it
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.click();

      toast.success('Download started');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {user?.name || user?.email}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Storage */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Storage Used</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {formatBytes(user?.storageUsedBytes || 0)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Files */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Files Uploaded</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{uploads.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Subscription</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {user?.subscriptionStatus === 'active' ? 'Pro' : 'Free'}
                </p>
              </div>
              <div className={`p-3 rounded-full ${user?.subscriptionStatus === 'active' ? 'bg-purple-100' : 'bg-gray-100'}`}>
                <svg
                  className={`w-6 h-6 ${user?.subscriptionStatus === 'active' ? 'text-purple-600' : 'text-gray-600'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v10H4V5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Manager */}
        <div className="mb-8">
          <SubscriptionManager />
        </div>

        {/* Storage quota */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Storage Quota</h2>
          <StorageQuota
            used={user?.storageUsedBytes || 0}
            limit={user?.storageQuotaBytes || 0}
            showDetails
          />
        </div>

        {/* Files section */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Files</h2>
          </div>
          <FileList
            files={uploads}
            onDelete={handleDelete}
            onShare={handleShare}
            onDownload={handleDownload}
            isLoading={false}
          />
        </div>
      </div>
    </div>
  );
}
