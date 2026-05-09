'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { API_URL } from '@/lib/api-config';
import { mockAlerts } from '@/lib/mock-data';

interface Alert {
  id: string;
  facility_id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  created_at: string;
  resolved: boolean;
}

export default function AlertsPage() {
  const { user, token } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');

  useEffect(() => {
    fetchAlerts();
  }, [token]);

  const fetchAlerts = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.notifications || []);
      } else if (response.status === 404) {
        // Use mock data for demo
        setAlerts(mockAlerts);
      } else {
        setError('Failed to load alerts');
      }
    } catch (err) {
      // Use mock data for demo
      setAlerts(mockAlerts);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'resolved') return alert.resolved;
    if (filter === 'unresolved') return !alert.resolved;
    return true;
  });

  const alertStats = {
    critical: alerts.filter(a => a.severity === 'critical' && !a.resolved).length,
    high: alerts.filter(a => a.severity === 'high' && !a.resolved).length,
    medium: alerts.filter(a => a.severity === 'medium' && !a.resolved).length,
    low: alerts.filter(a => a.severity === 'low' && !a.resolved).length,
    total: alerts.length,
    unresolved: alerts.filter(a => !a.resolved).length,
    resolved: alerts.filter(a => a.resolved).length,
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-300 bg-red-50 hover:bg-red-100';
      case 'high':
        return 'border-orange-300 bg-orange-50 hover:bg-orange-100';
      case 'medium':
        return 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100';
      default:
        return 'border-blue-300 bg-blue-50 hover:bg-blue-100';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getSeverityLabel = (severity: string) => {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Please log in to access alerts.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Icon Badge */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-red-100 to-orange-100 rounded-lg">
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Alerts & Notifications</h1>
        </div>
        <p className="text-slate-600 text-lg mb-8">Track important notifications and facility alerts by severity level</p>

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

        {/* Alert Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {/* Critical Stat */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <div className="relative bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Critical</span>
                <div className="p-1.5 bg-red-50 rounded">
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-red-600">{alertStats.critical}</div>
              <div className="text-xs text-slate-500 mt-1">unresolved</div>
            </div>
          </div>

          {/* High Stat */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <div className="relative bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">High</span>
                <div className="p-1.5 bg-orange-50 rounded">
                  <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-orange-600">{alertStats.high}</div>
              <div className="text-xs text-slate-500 mt-1">unresolved</div>
            </div>
          </div>

          {/* Medium Stat */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <div className="relative bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Medium</span>
                <div className="p-1.5 bg-yellow-50 rounded">
                  <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-yellow-600">{alertStats.medium}</div>
              <div className="text-xs text-slate-500 mt-1">unresolved</div>
            </div>
          </div>

          {/* Low Stat */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <div className="relative bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Low</span>
                <div className="p-1.5 bg-blue-50 rounded">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18.355 7.369a.5.5 0 00-.646-.646l-8.612 8.612a.5.5 0 00.646.646l8.612-8.612zM9.172 4.828a.75.75 0 11-1.06-1.06L15.939 9.576a.75.75 0 111.06-1.06L9.172 4.829zm6.364 1.637a.75.75 0 111.06-1.06l6.364 6.364a.75.75 0 11-1.06 1.06l-6.364-6.364zM4.172 9.172a.75.75 0 11-1.06-1.06L9.476 3.808a.75.75 0 111.06 1.06L4.172 9.172z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-600">{alertStats.low}</div>
              <div className="text-xs text-slate-500 mt-1">unresolved</div>
            </div>
          </div>

          {/* Total Stat */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-600 to-slate-700 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <div className="relative bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Total</span>
                <div className="p-1.5 bg-slate-50 rounded">
                  <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.5 1.5H5.75A2.25 2.25 0 003.5 3.75v12.5A2.25 2.25 0 005.75 18.5h8.5a2.25 2.25 0 002.25-2.25V6.5m-12-5v5m6-5v5" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-600">{alertStats.total}</div>
              <div className="text-xs text-slate-500 mt-1">{alertStats.unresolved} unresolved</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 mb-8 flex-wrap">
          <button
            onClick={() => setFilter('unresolved')}
            className={`px-4 py-2.5 rounded-lg font-semibold transition-all ${
              filter === 'unresolved'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Unresolved ({alertStats.unresolved})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-4 py-2.5 rounded-lg font-semibold transition-all ${
              filter === 'resolved'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Resolved ({alertStats.resolved})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2.5 rounded-lg font-semibold transition-all ${
              filter === 'all'
                ? 'bg-slate-600 text-white shadow-md'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All ({alertStats.total})
          </button>
        </div>

        {/* Alerts List */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full">
                <svg className="w-6 h-6 text-slate-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <p className="text-slate-600 font-medium">Loading alerts...</p>
            </div>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-slate-600 font-medium">{filter === 'unresolved' ? 'No unresolved alerts. Great job!' : 'No alerts to display.'}</p>
              <p className="text-slate-500 text-sm mt-1">Alerts will appear as needed</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => {
              const borderColorMap = {
                critical: 'border-l-4 border-red-500',
                high: 'border-l-4 border-orange-500',
                medium: 'border-l-4 border-yellow-500',
                low: 'border-l-4 border-blue-500'
              };
              return (
                <div
                  key={alert.id}
                  className={`${borderColorMap[alert.severity as keyof typeof borderColorMap]} bg-white rounded-2xl p-6 hover:shadow-md transition-all duration-300`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {getSeverityLabel(alert.severity)}
                        </span>
                        {alert.resolved && (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            ✓ Resolved
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{alert.title}</h3>
                      <p className="text-slate-700 text-sm mt-2">{alert.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-600 flex-wrap">
                        <span className="font-medium">Facility: {alert.facility_id}</span>
                        <span>•</span>
                        <span>Type: {alert.type}</span>
                        <span>•</span>
                        <span>{new Date(alert.created_at).toLocaleDateString()} {new Date(alert.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Severity Legend */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mt-8">
          <h3 className="font-bold text-slate-900 mb-4 text-lg">Alert Severity Levels</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <span className="inline-block w-3 h-3 bg-red-600 rounded-full mt-1.5 flex-shrink-0"></span>
              <div>
                <div className="font-semibold text-slate-900">Critical</div>
                <div className="text-slate-600 text-xs mt-0.5">Immediate attention required</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <span className="inline-block w-3 h-3 bg-orange-600 rounded-full mt-1.5 flex-shrink-0"></span>
              <div>
                <div className="font-semibold text-slate-900">High</div>
                <div className="text-slate-600 text-xs mt-0.5">Urgent action needed</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <span className="inline-block w-3 h-3 bg-yellow-600 rounded-full mt-1.5 flex-shrink-0"></span>
              <div>
                <div className="font-semibold text-slate-900">Medium</div>
                <div className="text-slate-600 text-xs mt-0.5">Moderate priority follow-up</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="inline-block w-3 h-3 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></span>
              <div>
                <div className="font-semibold text-slate-900">Low</div>
                <div className="text-slate-600 text-xs mt-0.5">Informational notification</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
