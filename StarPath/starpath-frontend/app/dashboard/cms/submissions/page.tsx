'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { API_URL } from '@/lib/api-config';

interface Submission {
  submission_id: string;
  facility_id: string;
  facility_name: string;
  cms_provider_id: string;
  submission_date: string;
  submission_type: string;
  status: string;
  validation_passed: boolean;
  cms_confirmation_id?: string;
  submitted_by: string;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  FAILED: 'bg-red-100 text-red-800',
  VALIDATION_ERROR: 'bg-orange-100 text-orange-800',
};

const statusIcons: Record<string, string> = {
  PENDING: '⏳',
  SUBMITTED: '📤',
  ACCEPTED: '✅',
  REJECTED: '❌',
  FAILED: '⚠️',
  VALIDATION_ERROR: '⚠️',
};

export default function SubmissionsPage() {
  const { user, token } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, [token, statusFilter]);

  const fetchSubmissions = async () => {
    if (!token) return;

    try {
      setLoading(true);
      let url = `${API_URL}/api/v1/cms/submissions`;
      if (statusFilter) {
        url += `?status=${statusFilter}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
      } else {
        setError('Failed to load submissions');
      }
    } catch (err) {
      setError('Error fetching submissions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (submissionId: string) => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/api/v1/cms/submissions/${submissionId}/retry`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        alert('Submission queued for retry');
        fetchSubmissions();
      } else {
        alert('Failed to retry submission');
      }
    } catch (err) {
      console.error(err);
      alert('Error retrying submission');
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Please log in to view submissions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CMS Submissions</h1>
          <p className="text-gray-600 mt-2">Track all submissions to CMS</p>
        </div>
        <Link href="/dashboard/cms">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to CMS
          </button>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {['PENDING', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'FAILED', 'VALIDATION_ERROR'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions Table */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading submissions...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600">No submissions found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Facility</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">CMS ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Submitted</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Validation</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {submissions.map((submission) => (
                  <tr key={submission.submission_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900">{submission.facility_name}</div>
                      <div className="text-xs text-gray-500">{submission.facility_id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{submission.cms_provider_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(submission.submission_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-medium ${statusColors[submission.status] || 'bg-gray-100'}`}>
                        <span>{statusIcons[submission.status]}</span>
                        {submission.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full font-medium ${
                        submission.validation_passed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {submission.validation_passed ? '✓ Passed' : '✗ Failed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => setSelectedSubmission(submission)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View
                      </button>
                      {(submission.status === 'FAILED' || submission.status === 'VALIDATION_ERROR') && (
                        <button
                          onClick={() => handleRetry(submission.submission_id)}
                          className="text-orange-600 hover:text-orange-800 font-medium ml-2"
                        >
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Submission Details</h2>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Submission ID</label>
                  <p className="text-gray-900 font-mono text-sm">{selectedSubmission.submission_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Facility</label>
                  <p className="text-gray-900">{selectedSubmission.facility_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">CMS Provider ID</label>
                  <p className="text-gray-900">{selectedSubmission.cms_provider_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className="text-gray-900">{selectedSubmission.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Submitted Date</label>
                  <p className="text-gray-900">{new Date(selectedSubmission.submission_date).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Submitted By</label>
                  <p className="text-gray-900">{selectedSubmission.submitted_by}</p>
                </div>
              </div>

              {selectedSubmission.cms_confirmation_id && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-900">CMS Confirmation ID</p>
                  <p className="text-green-800 font-mono">{selectedSubmission.cms_confirmation_id}</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 mb-2">Validation Status</p>
                <p className={`text-blue-800 ${selectedSubmission.validation_passed ? 'font-semibold' : ''}`}>
                  {selectedSubmission.validation_passed ? '✓ Data validation passed' : '✗ Data validation failed'}
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
