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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Icon Badge */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.3A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">CMS Integration</h1>
        </div>
        <p className="text-slate-600 text-lg mb-8">Export and submit facility data to the CMS Five-Star Quality Rating System</p>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-20 mb-4"></div>
                <div className="h-8 bg-slate-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
            {/* Total Submissions */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-600 to-slate-700 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Total Submissions</span>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    </svg>
                  </div>
                </div>
                <div className="text-4xl font-bold text-slate-600">{stats.totalSubmissions}</div>
              </div>
            </div>
            
            {/* Pending */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Pending</span>
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 102 0V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="text-4xl font-bold text-yellow-600">{stats.pendingSubmissions}</div>
              </div>
            </div>
            
            {/* Accepted */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Accepted</span>
                  <div className="p-2 bg-green-50 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="text-4xl font-bold text-green-600">{stats.acceptedSubmissions}</div>
              </div>
            </div>
            
            {/* Failed */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Failed</span>
                  <div className="p-2 bg-red-50 rounded-lg">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="text-4xl font-bold text-red-600">{stats.failedSubmissions}</div>
              </div>
            </div>
            
            {/* Exports */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Exports</span>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.3A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" />
                    </svg>
                  </div>
                </div>
                <div className="text-4xl font-bold text-blue-600">{stats.exportCount}</div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Main Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Export Card */}
            <Link href="/dashboard/cms/export">
              <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-8 hover:shadow-xl transition-all cursor-pointer group">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-500 rounded-lg mb-6 group-hover:bg-blue-600 transition-colors">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Export Data</h3>
                <p className="text-slate-600 mt-3 text-sm">Export facility ratings and inspection data in CMS-compliant format for regulatory submission</p>
                <div className="mt-6 text-sm font-semibold text-blue-600 group-hover:text-blue-700">Get Started →</div>
              </div>
            </Link>

            {/* Validate Card */}
            <Link href="/dashboard/cms/export">
              <div className="bg-gradient-to-br from-purple-50 via-purple-50 to-purple-100 rounded-2xl border border-purple-200 p-8 hover:shadow-xl transition-all cursor-pointer group">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-500 rounded-lg mb-6 group-hover:bg-purple-600 transition-colors">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Validate Data</h3>
                <p className="text-slate-600 mt-3 text-sm">Verify that facility data meets all CMS requirements before submission to reduce rejection rates</p>
                <div className="mt-6 text-sm font-semibold text-purple-600 group-hover:text-purple-700">Check Status →</div>
              </div>
            </Link>

            {/* Submissions Card */}
            <Link href="/dashboard/cms/submissions">
              <div className="bg-gradient-to-br from-green-50 via-green-50 to-green-100 rounded-2xl border border-green-200 p-8 hover:shadow-xl transition-all cursor-pointer group">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-green-500 rounded-lg mb-6 group-hover:bg-green-600 transition-colors">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900">View Submissions</h3>
                <p className="text-slate-600 mt-3 text-sm">Track submission history, status updates, and CMS responses in real-time</p>
                <div className="mt-6 text-sm font-semibold text-green-600 group-hover:text-green-700">View History →</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Information Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* About CMS Integration */}
          <div className="bg-blue-50 rounded-2xl border border-blue-200 p-8">
          <div className="flex items-start mb-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
              <h3 className="text-xl font-bold text-slate-900 ml-4">About CMS Integration</h3>
            </div>
            <div className="space-y-4 text-slate-700">
              <div>
                <p className="font-semibold text-slate-900">What is CMS Integration?</p>
                <p className="text-sm mt-1">Export your facility's Five-Star Quality ratings and inspection data in official CMS format for regulatory compliance.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Data Validation</p>
                <p className="text-sm mt-1">All data is validated against CMS requirements before submission to ensure compliance and reduce rejection rates.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Submission Tracking</p>
                <p className="text-sm mt-1">Monitor the status of all submissions to CMS and view confirmation responses.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Audit Trail</p>
                <p className="text-sm mt-1">Maintain complete records of all exports and submissions for regulatory audits.</p>
              </div>
            </div>
          </div>

          {/* Getting Started Guide */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8">
          <div className="flex items-start mb-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gray-200">
                <svg className="h-6 w-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
              <h3 className="text-xl font-bold text-slate-900 ml-4">Getting Started</h3>
            </div>
            <ol className="space-y-3 text-slate-700">
              {[
                'Navigate to a facility to export data',
                'Choose JSON or XML export format',
                'Review validation results for any issues',
                'Submit validated data to CMS',
                'Track submission status in the submissions page'
              ].map((item, i) => (
                <li key={i} className="flex items-start text-sm">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-600 text-white text-sm font-semibold mr-3 flex-shrink-0">{i + 1}</span>
                  <span className="pt-0.5">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
