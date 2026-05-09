'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { API_URL } from '@/lib/api-config';
import { mockStaffing } from '@/lib/mock-data';

interface StaffingData {
  facility_id: string;
  rn_staffing: number;
  ln_staffing: number;
  aide_staffing: number;
  staffing_score: number;
  reporting_period: string;
}

export default function StaffingPage() {
  const { user, token } = useAuth();
  const [staffing, setStaffing] = useState<StaffingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'compare'>('list');

  useEffect(() => {
    fetchStaffingData();
  }, [token]);

  const fetchStaffingData = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/staffing`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStaffing(data.staffing || []);
      } else if (response.status === 404) {
        // Use mock data for demo
        setStaffing(mockStaffing);
      } else {
        setError('Failed to load staffing data');
      }
    } catch (err) {
      // Use mock data for demo
      setStaffing(mockStaffing);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // CMS National Benchmarks (hours per resident day)
  const benchmarks = {
    rn: 0.75,
    ln: 0.45,
    aide: 1.3,
  };

  const getStatusColor = (value: number, benchmark: number) => {
    if (value >= benchmark * 1.1) return 'text-green-600 bg-green-50';
    if (value >= benchmark) return 'text-blue-600 bg-blue-50';
    if (value >= benchmark * 0.9) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusLabel = (value: number, benchmark: number) => {
    if (value >= benchmark * 1.1) return 'Above Average';
    if (value >= benchmark) return 'At Target';
    if (value >= benchmark * 0.9) return 'Near Target';
    return 'Below Target';
  };

  const stats = {
    averageRN: (staffing.reduce((sum, s) => sum + s.rn_staffing, 0) / staffing.length || 0).toFixed(2),
    averageLN: (staffing.reduce((sum, s) => sum + s.ln_staffing, 0) / staffing.length || 0).toFixed(2),
    averageAide: (staffing.reduce((sum, s) => sum + s.aide_staffing, 0) / staffing.length || 0).toFixed(2),
    facilitiesAboveAverage: staffing.filter(s => s.rn_staffing >= benchmarks.rn).length,
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Please log in to access staffing information.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-8">
        <h1 className="text-4xl font-bold text-gray-900">Staffing Levels</h1>
        <p className="text-lg text-gray-600 mt-3">
          Monitor nursing staff ratios and compare against national benchmarks and state averages
        </p>
      </div>

      {/* National Benchmarks Info */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">CMS National Benchmarks (Hours per Resident Day)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-blue-700">Registered Nurses (RN)</div>
            <div className="text-2xl font-bold text-blue-900 mt-1">{benchmarks.rn}</div>
          </div>
          <div>
            <div className="text-sm text-blue-700">Licensed Nurses (LN)</div>
            <div className="text-2xl font-bold text-blue-900 mt-1">{benchmarks.ln}</div>
          </div>
          <div>
            <div className="text-sm text-blue-700">Nursing Aides</div>
            <div className="text-2xl font-bold text-blue-900 mt-1">{benchmarks.aide}</div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-semibold text-gray-600 uppercase">Avg RN Staffing</div>
          <div className="text-4xl font-bold text-blue-600 mt-3">{stats.averageRN}</div>
          <div className="text-xs text-gray-500 mt-2">per resident day</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-semibold text-gray-600 uppercase">Avg LN Staffing</div>
          <div className="text-4xl font-bold text-blue-600 mt-3">{stats.averageLN}</div>
          <div className="text-xs text-gray-500 mt-2">per resident day</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-semibold text-gray-600 uppercase">Avg Aide Staffing</div>
          <div className="text-4xl font-bold text-blue-600 mt-3">{stats.averageAide}</div>
          <div className="text-xs text-gray-500 mt-2">per resident day</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-semibold text-gray-600 uppercase">Above Average</div>
          <div className="text-4xl font-bold text-green-600 mt-3">{stats.facilitiesAboveAverage}</div>
          <div className="text-xs text-gray-500 mt-2">of {staffing.length} facilities</div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('list')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            viewMode === 'list'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          List View
        </button>
        <button
          onClick={() => setViewMode('compare')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            viewMode === 'compare'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Benchmark Comparison
        </button>
      </div>

      {/* Staffing Data */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            {viewMode === 'list' ? 'Staffing Levels by Facility' : 'Benchmark Comparison Analysis'}
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">Loading staffing data...</p>
          </div>
        ) : staffing.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No staffing data available yet.</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-4 p-6">
            {staffing.map((item, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
                  <div>
                    <div className="text-xs font-semibold text-gray-600 uppercase">Facility</div>
                    <div className="font-bold text-gray-900 mt-1">{item.facility_id}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-600 uppercase">RN Staffing</div>
                    <div className={`font-bold mt-1 ${getStatusColor(item.rn_staffing, benchmarks.rn)}`}>
                      {item.rn_staffing.toFixed(2)} / {benchmarks.rn}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{getStatusLabel(item.rn_staffing, benchmarks.rn)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-600 uppercase">LN Staffing</div>
                    <div className={`font-bold mt-1 ${getStatusColor(item.ln_staffing, benchmarks.ln)}`}>
                      {item.ln_staffing.toFixed(2)} / {benchmarks.ln}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{getStatusLabel(item.ln_staffing, benchmarks.ln)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-600 uppercase">Aide Staffing</div>
                    <div className={`font-bold mt-1 ${getStatusColor(item.aide_staffing, benchmarks.aide)}`}>
                      {item.aide_staffing.toFixed(2)} / {benchmarks.aide}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{getStatusLabel(item.aide_staffing, benchmarks.aide)}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">{item.reporting_period}</div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    item.staffing_score >= 4
                      ? 'bg-green-100 text-green-700'
                      : item.staffing_score >= 3
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    Score: {item.staffing_score}/5
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Facility</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-900">RN Staffing</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-900">Vs Benchmark</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-900">LN Staffing</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-900">Vs Benchmark</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-900">Aide Staffing</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-900">Vs Benchmark</th>
                </tr>
              </thead>
              <tbody>
                {staffing.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.facility_id}</td>
                    <td className="px-6 py-4 text-center">{item.rn_staffing.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        item.rn_staffing >= benchmarks.rn ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {((item.rn_staffing / benchmarks.rn - 1) * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">{item.ln_staffing.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        item.ln_staffing >= benchmarks.ln ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {((item.ln_staffing / benchmarks.ln - 1) * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">{item.aide_staffing.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        item.aide_staffing >= benchmarks.aide ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {((item.aide_staffing / benchmarks.aide - 1) * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
