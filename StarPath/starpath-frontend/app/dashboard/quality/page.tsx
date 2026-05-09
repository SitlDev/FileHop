'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { API_URL } from '@/lib/api-config';
import { mockQualityMeasures } from '@/lib/mock-data';

interface QualityMeasure {
  id: string;
  measure_name: string;
  facility_score: number;
  state_average: number;
  national_average: number;
  comparison: string;
  reporting_period: string;
}

export default function QualityMeasuresPage() {
  const { user, token } = useAuth();
  const [measures, setMeasures] = useState<QualityMeasure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchQualityMeasures();
  }, [token]);

  const fetchQualityMeasures = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/quality-measures`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMeasures(data.measures || []);
      } else if (response.status === 404) {
        // Use mock data for demo
        setMeasures(mockQualityMeasures);
      } else {
        setError('Failed to load quality measures');
      }
    } catch (err) {
      // Use mock data for demo
      setMeasures(mockQualityMeasures);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getComparisonIcon = (comparison: string) => {
    switch (comparison?.toLowerCase()) {
      case 'better':
        return '↑';
      case 'worse':
        return '↓';
      case 'same':
        return '→';
      default:
        return '—';
    }
  };

  const getComparisonColor = (comparison: string) => {
    switch (comparison?.toLowerCase()) {
      case 'better':
        return 'text-green-600 bg-green-50';
      case 'worse':
        return 'text-red-600 bg-red-50';
      case 'same':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const stats = {
    aboveAverage: measures.filter(m => m.facility_score > m.state_average).length,
    atOrAboveNational: measures.filter(m => m.facility_score >= m.national_average).length,
    totalMeasures: measures.length,
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Please log in to access quality measures.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Icon Badge */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
            <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Quality Measures</h1>
        </div>
        <p className="text-slate-600 text-lg mb-8">Track CMS Five-Star Quality Reporting Program (QRP) measures and benchmark against state and national averages</p>

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

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {/* Stat Card 1 */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <div className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Above State Avg</span>
                <div className="p-2 bg-green-50 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
              </div>
              <div className="text-4xl font-bold text-green-600">{stats.aboveAverage}</div>
              <div className="mt-3 text-xs text-slate-500">of {stats.totalMeasures} measures</div>
            </div>
          </div>

          {/* Stat Card 2 */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <div className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">National Benchmark</span>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
              <div className="text-4xl font-bold text-blue-600">{stats.atOrAboveNational}</div>
              <div className="mt-3 text-xs text-slate-500">meeting or exceeding national</div>
            </div>
          </div>

          {/* Stat Card 3 */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <div className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Total Tracked</span>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000-2H3a1 1 0 000 2h1a1 1 0 000 2h2a1 1 0 100-2H4a1 1 0 010-2h1a2 2 0 012 2v1h2V5a2 2 0 012-2 1 1 0 100-2h-1a1 1 0 000 2h1a1 1 0 000 2h-2a1 1 0 100 2h4a1 1 0 100-2h-1a1 1 0 010-2h1a2 2 0 012 2v1h2V5a2 2 0 012-2 1 1 0 100-2h-1a1 1 0 000 2h1a1 1 0 000 2h-2a1 1 0 100 2h4v2h1a1 1 0 100-2h-1a2 2 0 01-2-2V5a2 2 0 01-2-2 1 1 0 100 2h1a1 1 0 000-2H9a1 1 0 100 2h2v1H9a1 1 0 100-2H7a1 1 0 010-2H5a1 1 0 000 2h2v1a1 1 0 100-2H4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="text-4xl font-bold text-purple-600">{stats.totalMeasures}</div>
              <div className="mt-3 text-xs text-slate-500">active quality indicators</div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-3 mb-8 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2.5 rounded-lg font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Measures
          </button>
          <button
            onClick={() => setSelectedCategory('infection')}
            className={`px-4 py-2.5 rounded-lg font-semibold transition-all ${
              selectedCategory === 'infection'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Infections
          </button>
          <button
            onClick={() => setSelectedCategory('safety')}
            className={`px-4 py-2.5 rounded-lg font-semibold transition-all ${
              selectedCategory === 'safety'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Safety
          </button>
        </div>

        {/* Quality Measures */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full">
                <svg className="w-6 h-6 text-slate-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <p className="text-slate-600 font-medium">Loading quality measures...</p>
            </div>
          </div>
        ) : measures.length === 0 ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-slate-600 font-medium">No quality measures available</p>
              <p className="text-slate-500 text-sm mt-1">Data will appear once facilities are added</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {measures.map((measure, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all duration-300">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">{measure.measure_name}</h3>
                    <p className="text-sm text-slate-600 mt-1">Reporting Period: {measure.reporting_period}</p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${
                    measure.comparison?.toLowerCase() === 'better'
                      ? 'bg-green-100 text-green-700'
                      : measure.comparison?.toLowerCase() === 'worse'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    <span className="mr-2">{getComparisonIcon(measure.comparison)}</span>
                    {measure.comparison?.charAt(0).toUpperCase() + measure.comparison?.slice(1)}
                  </span>
                </div>

                {/* Benchmark Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Facility Score</div>
                    <div className="text-2xl font-bold text-blue-900 mt-2">{measure.facility_score.toFixed(1)}%</div>
                    <div className="text-xs text-blue-600 mt-1">Your facility</div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">State Average</div>
                    <div className="text-2xl font-bold text-slate-900 mt-2">{measure.state_average.toFixed(1)}%</div>
                    <div className="text-xs text-slate-600 mt-1">
                      {measure.facility_score > measure.state_average ? (
                        <span className="text-green-600 font-semibold">↑ Above</span>
                      ) : measure.facility_score < measure.state_average ? (
                        <span className="text-red-600 font-semibold">↓ Below</span>
                      ) : (
                        <span className="text-slate-600">Equal to</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">National Average</div>
                    <div className="text-2xl font-bold text-slate-900 mt-2">{measure.national_average.toFixed(1)}%</div>
                    <div className="text-xs text-slate-600 mt-1">
                      {measure.facility_score > measure.national_average ? (
                        <span className="text-green-600 font-semibold">↑ Above</span>
                      ) : measure.facility_score < measure.national_average ? (
                        <span className="text-red-600 font-semibold">↓ Below</span>
                      ) : (
                        <span className="text-slate-600">Equal to</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600">Performance Range</span>
                    <span className="text-xs text-slate-500">
                      {measure.facility_score > measure.national_average 
                        ? 'Above National' 
                        : measure.facility_score > measure.state_average
                        ? 'Above State'
                        : 'Below Benchmarks'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        measure.facility_score > measure.national_average
                          ? 'bg-green-600'
                          : measure.facility_score > measure.state_average
                          ? 'bg-blue-600'
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.min(measure.facility_score, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mt-8">
          <h3 className="font-bold text-slate-900 mb-3 text-lg">Comparison Indicators</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full font-bold text-xs">↑</span>
              <span className="text-slate-700"><span className="font-semibold">Better</span> — Performing above state average</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-100 text-slate-600 rounded-full font-bold text-xs">→</span>
              <span className="text-slate-700"><span className="font-semibold">Same</span> — Meeting benchmark target</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-600 rounded-full font-bold text-xs">↓</span>
              <span className="text-slate-700"><span className="font-semibold">Worse</span> — Below state average</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
