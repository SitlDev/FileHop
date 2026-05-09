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
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-8">
        <h1 className="text-4xl font-bold text-gray-900">Quality Measures</h1>
        <p className="text-lg text-gray-600 mt-3">
          Track CMS Five-Star Quality Reporting Program (QRP) measures and benchmark against state and national averages
        </p>
      </div>

      {/* Quality Reporting Program Info */}
      <div className="bg-purple-50 rounded-lg border border-purple-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-2">About CMS Quality Reporting Program (QRP)</h3>
        <p className="text-gray-700 text-sm">
          SNF Quality Reporting Program measures track key quality indicators that impact patient outcomes and safety. 
          These measures are publicly reported and directly influence the Five-Star Quality Rating. Each measure is 
          compared against state and national benchmarks to provide context for facility performance.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-semibold text-gray-600 uppercase">Measures Above State Avg</div>
          <div className="text-4xl font-bold text-green-600 mt-3">
            {stats.aboveAverage}/{stats.totalMeasures}
          </div>
          <div className="text-xs text-gray-500 mt-2">facilities performing above state average</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-semibold text-gray-600 uppercase">At or Above National</div>
          <div className="text-4xl font-bold text-blue-600 mt-3">
            {stats.atOrAboveNational}/{stats.totalMeasures}
          </div>
          <div className="text-xs text-gray-500 mt-2">measures meeting national benchmark</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-semibold text-gray-600 uppercase">Total Measures Tracked</div>
          <div className="text-4xl font-bold text-purple-600 mt-3">{stats.totalMeasures}</div>
          <div className="text-xs text-gray-500 mt-2">active quality indicators</div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            selectedCategory === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          All Measures
        </button>
        <button
          onClick={() => setSelectedCategory('infection')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            selectedCategory === 'infection'
              ? 'bg-purple-600 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Infections
        </button>
        <button
          onClick={() => setSelectedCategory('safety')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            selectedCategory === 'safety'
              ? 'bg-purple-600 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Safety
        </button>
      </div>

      {/* Quality Measures */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Loading quality measures...</p>
          </div>
        ) : measures.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">No quality measure data available yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {measures.map((measure, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{measure.measure_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">Reporting Period: {measure.reporting_period}</p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${getComparisonColor(measure.comparison)}`}>
                    <span className="mr-2">{getComparisonIcon(measure.comparison)}</span>
                    {measure.comparison?.charAt(0).toUpperCase() + measure.comparison?.slice(1)}
                  </span>
                </div>

                {/* Benchmark Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-xs font-semibold text-blue-700 uppercase">Facility Score</div>
                    <div className="text-2xl font-bold text-blue-900 mt-2">{measure.facility_score.toFixed(1)}%</div>
                    <div className="text-xs text-blue-600 mt-1">Your facility</div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-xs font-semibold text-gray-700 uppercase">State Average</div>
                    <div className="text-2xl font-bold text-gray-900 mt-2">{measure.state_average.toFixed(1)}%</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {measure.facility_score > measure.state_average ? (
                        <span className="text-green-600 font-semibold">↑ Above</span>
                      ) : measure.facility_score < measure.state_average ? (
                        <span className="text-red-600 font-semibold">↓ Below</span>
                      ) : (
                        <span className="text-gray-600">Equal to</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-xs font-semibold text-gray-700 uppercase">National Average</div>
                    <div className="text-2xl font-bold text-gray-900 mt-2">{measure.national_average.toFixed(1)}%</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {measure.facility_score > measure.national_average ? (
                        <span className="text-green-600 font-semibold">↑ Above</span>
                      ) : measure.facility_score < measure.national_average ? (
                        <span className="text-red-600 font-semibold">↓ Below</span>
                      ) : (
                        <span className="text-gray-600">Equal to</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-600">Performance Range</span>
                    <span className="text-xs text-gray-500">
                      {measure.facility_score > measure.national_average 
                        ? 'Above National' 
                        : measure.facility_score > measure.state_average
                        ? 'Above State'
                        : 'Below Benchmarks'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
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
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Comparison Indicators</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block w-6 h-6 bg-green-100 text-green-600 rounded flex items-center justify-center font-bold">↑</span>
            <span className="text-gray-700"><span className="font-semibold">Better</span> — Facility performing above state average</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-6 h-6 bg-gray-100 text-gray-600 rounded flex items-center justify-center font-bold">→</span>
            <span className="text-gray-700"><span className="font-semibold">Same</span> — Facility meeting benchmark target</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-6 h-6 bg-red-100 text-red-600 rounded flex items-center justify-center font-bold">↓</span>
            <span className="text-gray-700"><span className="font-semibold">Worse</span> — Facility below state average</span>
          </div>
        </div>
      </div>
    </div>
  );
}
