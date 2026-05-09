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
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-8">
        <h1 className="text-4xl font-bold text-gray-900">Alerts & Notifications</h1>
        <p className="text-lg text-gray-600 mt-3">
          Track important notifications and facility alerts by severity level
        </p>
      </div>

      {/* Alert Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-red-700 uppercase">Critical</div>
          <div className="text-3xl font-bold text-red-600 mt-2">{alertStats.critical}</div>
          <div className="text-xs text-red-600 mt-1">Unresolved</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-orange-700 uppercase">High</div>
          <div className="text-3xl font-bold text-orange-600 mt-2">{alertStats.high}</div>
          <div className="text-xs text-orange-600 mt-1">Unresolved</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-yellow-700 uppercase">Medium</div>
          <div className="text-3xl font-bold text-yellow-600 mt-2">{alertStats.medium}</div>
          <div className="text-xs text-yellow-600 mt-1">Unresolved</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-blue-700 uppercase">Low</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{alertStats.low}</div>
          <div className="text-xs text-blue-600 mt-1">Unresolved</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-gray-700 uppercase">Total</div>
          <div className="text-3xl font-bold text-gray-600 mt-2">{alertStats.total}</div>
          <div className="text-xs text-gray-600 mt-1">
            {alertStats.unresolved} unresolved
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('unresolved')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'unresolved'
              ? 'bg-red-600 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Unresolved ({alertStats.unresolved})
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'resolved'
              ? 'bg-green-600 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Resolved ({alertStats.resolved})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'all'
              ? 'bg-gray-600 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          All ({alertStats.total})
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600">Loading alerts...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600">
              {filter === 'unresolved' ? 'No unresolved alerts. Great job!' : 'No alerts to display.'}
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 rounded-lg p-6 transition-all ${getSeverityColor(alert.severity)} bg-white shadow-sm hover:shadow-md`}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getSeverityBadgeColor(alert.severity)}`}>
                      {getSeverityLabel(alert.severity)}
                    </span>
                    {alert.resolved && (
                      <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                        Resolved
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                  <p className="text-gray-700 text-sm mt-2">{alert.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-600 flex-wrap">
                    <span className="font-medium">Facility: {alert.facility_id}</span>
                    <span>•</span>
                    <span>Type: {alert.type}</span>
                    <span>•</span>
                    <span>{new Date(alert.created_at).toLocaleDateString()} {new Date(alert.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Severity Legend */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Alert Severity Levels</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <span className="inline-block w-3 h-3 bg-red-600 rounded-full mt-1 flex-shrink-0"></span>
            <div>
              <div className="font-semibold text-gray-900">Critical</div>
              <div className="text-gray-600 text-xs">Requires immediate attention</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="inline-block w-3 h-3 bg-orange-600 rounded-full mt-1 flex-shrink-0"></span>
            <div>
              <div className="font-semibold text-gray-900">High</div>
              <div className="text-gray-600 text-xs">Urgent priority action needed</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="inline-block w-3 h-3 bg-yellow-600 rounded-full mt-1 flex-shrink-0"></span>
            <div>
              <div className="font-semibold text-gray-900">Medium</div>
              <div className="text-gray-600 text-xs">Moderate priority follow-up</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="inline-block w-3 h-3 bg-blue-600 rounded-full mt-1 flex-shrink-0"></span>
            <div>
              <div className="font-semibold text-gray-900">Low</div>
              <div className="text-gray-600 text-xs">Informational notification</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
