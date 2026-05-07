'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { API_URL } from '@/lib/api-config';

interface CMSStats {
  totalSubmissions: number;
  pendingSubmissions: number;
  acceptedSubmissions: number;
  failedSubmissions: number;
  exportCount: number;
}

export default function CMSPage() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<CMSStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, [token]);

  const fetchStats = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/cms/submissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalSubmissions: data.count,
          pendingSubmissions: data.submissions.filter((s: any) => s.status === 'PENDING').length,
          acceptedSubmissions: data.submissions.filter((s: any) => s.status === 'ACCEPTED').length,
          failedSubmissions: data.submissions.filter((s: any) => s.status === 'FAILED').length,
          exportCount: 0, // Will be fetched from export endpoint
        });
      }
    } catch (err) {
      setError('Failed to load CMS statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Please log in to access CMS integration features.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">CMS Integration</h1>
        <p className="text-gray-600 mt-2">Export and submit facility data to CMS Five-Star Quality Rating System</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600">Total Submissions</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalSubmissions}</div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600">Pending</div>
            <div className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingSubmissions}</div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600">Accepted</div>
            <div className="text-3xl font-bold text-green-600 mt-2">{stats.acceptedSubmissions}</div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600">Failed</div>
            <div className="text-3xl font-bold text-red-600 mt-2">{stats.failedSubmissions}</div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600">Exports</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{stats.exportCount}</div>
          </div>
        </div>
      )}

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Export Card */}
        <Link href="/dashboard/cms/export">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-200 rounded-lg mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
            <p className="text-gray-700 mt-2">Export facility ratings and inspection data in CMS-compliant format</p>
            <div className="mt-4 text-sm font-medium text-blue-600">Get Started →</div>
          </div>
        </Link>

        {/* Validate Card */}
        <Link href="/dashboard/cms/export">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-200 rounded-lg mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Validate Data</h3>
            <p className="text-gray-700 mt-2">Verify facility data meets CMS requirements before submission</p>
            <div className="mt-4 text-sm font-medium text-purple-600">Check Status →</div>
          </div>
        </Link>

        {/* Submissions Card */}
        <Link href="/dashboard/cms/submissions">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-200 rounded-lg mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">View Submissions</h3>
            <p className="text-gray-700 mt-2">Track submission history and CMS responses</p>
            <div className="mt-4 text-sm font-medium text-green-600">View History →</div>
          </div>
        </Link>
      </div>

      {/* Information Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">About CMS Integration</h3>
        <div className="space-y-3 text-gray-700">
          <p>
            <strong>What is CMS Integration?</strong> Export your facility's Five-Star Quality ratings and inspection data in official CMS format for regulatory compliance.
          </p>
          <p>
            <strong>Data Validation:</strong> All data is validated against CMS requirements before submission to ensure compliance and reduce rejection rates.
          </p>
          <p>
            <strong>Submission Tracking:</strong> Monitor the status of all submissions to CMS and view confirmation responses.
          </p>
          <p>
            <strong>Audit Trail:</strong> Maintain complete records of all exports and submissions for regulatory audits.
          </p>
        </div>
      </div>

      {/* Getting Started Guide */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h3>
        <ol className="space-y-3 text-gray-700 list-decimal list-inside">
          <li>Navigate to a facility to export data</li>
          <li>Choose JSON or XML export format</li>
          <li>Review validation results for any issues</li>
          <li>Submit validated data to CMS</li>
          <li>Track submission status in the submissions page</li>
        </ol>
      </div>
    </div>
  );
}
