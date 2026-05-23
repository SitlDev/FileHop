import React from 'react';
import { formatBytes, formatDate } from '@/lib/utils';
import { Upload } from '@/lib/types';

interface FileListProps {
  files: Upload[];
  onDelete?: (id: string) => void;
  onShare?: (id: string) => void;
  onDownload?: (id: string) => void;
  isLoading?: boolean;
}

export function FileList({
  files,
  onDelete,
  onShare,
  onDownload,
  isLoading = false,
}: FileListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="mt-4 text-gray-500">No files uploaded yet</p>
      </div>
    );
  }

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();
  const daysRemaining = (expiresAt: string) => {
    const days = Math.ceil(
      (new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, days);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Filename
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Uploaded
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Expires In
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Downloads
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {files.map((file) => {
            const expired = isExpired(file.expiresAt);
            const days = daysRemaining(file.expiresAt);

            return (
              <tr key={file.id} className={expired ? 'opacity-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-gray-100 rounded">
                      📄
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {file.filename}
                      </p>
                      <p className={`text-xs ${file.status === 'deleted' ? 'text-red-500' : 'text-gray-500'}`}>
                        {file.status === 'deleted' ? 'Deleted' : 'Active'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatBytes(Number(file.fileSizeBytes))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(file.uploadedAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {expired ? (
                    <span className="text-red-600 font-medium">Expired</span>
                  ) : (
                    <span className={days <= 3 ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                      {days} days
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {file.downloadCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {!expired && (
                    <>
                      {onDownload && (
                        <button
                          onClick={() => onDownload(file.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Download
                        </button>
                      )}
                      {onShare && (
                        <button
                          onClick={() => onShare(file.id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          Share
                        </button>
                      )}
                    </>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(file.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
