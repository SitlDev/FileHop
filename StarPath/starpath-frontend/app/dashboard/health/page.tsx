'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { API_URL } from '@/lib/api-config';
import { mockInspections, mockFacilities } from '@/lib/mock-data';
import Sidebar from '@/components/Sidebar';
interface Deficiency {
  tag: string;
  description: string;
  severity: string;
}

interface HealthInspection {
  id: string;
  facility_id: string;
  survey_date: string;
  survey_type: string;
  cycle: number;
  deficiency_count: number;
  health_score: number;
  status: string;
  deficiencies: Deficiency[];
}

export default function HealthInspectionsPage() {
  const { user, token } = useAuth();
  const [inspections, setInspections] = useState<HealthInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [expandedInspection, setExpandedInspection] = useState<string | null>(null);

  useEffect(() => {
    fetchInspections();
  }, [token]);

  const fetchInspections = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/inspections`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInspections(data.inspections || []);
      } else if (response.status === 404) {
        // Use mock data for demo
        setInspections(mockInspections);
      } else {
        setError('Failed to load health inspections');
      }
    } catch (err) {
      // Use mock data for demo
      setInspections(mockInspections);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInspections = inspections
    .filter((i) => filterType === 'all' || i.survey_type === filterType)
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.survey_date).getTime() - new Date(a.survey_date).getTime();
      } else if (sortBy === 'deficiencies') {
        return b.deficiency_count - a.deficiency_count;
      } else if (sortBy === 'score') {
        return b.health_score - a.health_score;
      }
      return 0;
    });

  const stats = {
    totalInspections: inspections.length,
    averageScore: inspections.length > 0 
      ? (inspections.reduce((sum, i) => sum + i.health_score, 0) / inspections.length).toFixed(1)
      : 0,
    totalDeficiencies: inspections.reduce((sum, i) => sum + i.deficiency_count, 0),
    criticalDeficiencies: inspections.reduce((sum, i) => {
      const critical = i.deficiencies?.filter(d => d.severity === 'E' || d.severity === 'H').length || 0;
      return sum + critical;
    }, 0),
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'H':
        return 'bg-red-900 bg-opacity-20 text-red-400';
      case 'E':
        return 'bg-orange-900 bg-opacity-20 text-orange-400';
      case 'G':
        return 'bg-yellow-900 bg-opacity-20 text-yellow-400';
      default:
        return 'bg-blue-900 bg-opacity-20 text-blue-400';
    }
  };

  const getSeverityLabel = (severity: string) => {
    const labels: { [key: string]: string } = {
      'H': 'Immediate',
      'E': 'Serious',
      'G': 'Other',
      'D': 'Minor',
    };
    return labels[severity] || 'Unknown';
  };

  const renderStars = (score: number, maxScore: number = 5) => {
    const percentage = (score / maxScore) * 5;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(percentage)) {
        stars.push(<span key={i} className="text-yellow-400">★</span>);
      } else if (i - percentage < 1 && i - percentage > 0) {
        stars.push(<span key={i} className="text-yellow-400">★</span>);
      } else {
        stars.push(<span key={i} className="text-slate-600">★</span>);
      }
    }
    return stars;
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">Please log in to access health inspections.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-1.429 5.951 1.429a1 1 0 001.169-1.409l-7-14z" />
                  </svg>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Health Inspections</h1>
              </div>
              <p className="text-slate-600 text-base sm:text-lg ml-11">
                Track compliance, deficiencies, and health scores across all facility inspections
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats - Enhanced */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Inspections */}
          <div className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Total Inspections</span>
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a1 1 0 001 1h12a1 1 0 001-1V6a2 2 0 00-2-2H4zm12 8H4v2a2 2 0 002 2h8a2 2 0 002-2v-2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-blue-600">{stats.totalInspections}</div>
            <div className="mt-3 text-xs text-slate-600">Facility surveys completed</div>
          </div>

          {/* Average Health Score */}
          <div className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Avg Health Score</span>
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-green-600">{stats.averageScore}%</div>
            <div className="mt-3 text-xs text-slate-600">Across all inspections</div>
          </div>

          {/* Total Deficiencies */}
          <div className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Total Deficiencies</span>
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-orange-600">{stats.totalDeficiencies}</div>
            <div className="mt-3 text-xs text-slate-600">Identified issues</div>
          </div>

          {/* Critical Issues */}
          <div className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Critical Issues</span>
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-red-600">{stats.criticalDeficiencies}</div>
            <div className="mt-3 text-xs text-slate-600">Immediate action needed</div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Filters Section - Enhanced */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 11.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 007 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
            </svg>
            Filter & Sort
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Inspection Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-slate-900 transition-colors"
              >
                <option value="all">All Types</option>
                <option value="STANDARD">Standard</option>
                <option value="REVISIT">Revisit</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-slate-900 transition-colors"
              >
                <option value="recent">Most Recent</option>
                <option value="deficiencies">Most Deficiencies</option>
                <option value="score">Lowest Score</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inspections List - Enhanced */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-lg text-sm font-semibold">
                {filteredInspections.length}
              </span>
              Inspections Found
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="space-y-4 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-200 rounded-full">
                  <svg className="w-6 h-6 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <p className="text-slate-600 font-medium">Loading inspections...</p>
              </div>
            </div>
          ) : filteredInspections.length === 0 ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-slate-600 font-medium">No inspections found</p>
                <p className="text-slate-500 text-sm mt-1">Try adjusting your filters</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInspections.map((inspection) => (
                <div
                  key={inspection.id}
                  className="group bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition-all duration-300 overflow-hidden"
                >
                  {/* Inspection Header - Clickable */}
                  <button
                    onClick={() => setExpandedInspection(expandedInspection === inspection.id ? null : inspection.id)}
                    className="w-full p-6 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
                      {/* Survey Date */}
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Survey Date</span>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v2h16V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h12a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          <span className="font-semibold text-slate-900">
                            {new Date(inspection.survey_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Type Badge */}
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Type</span>
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold w-fit ${
                          inspection.survey_type === 'STANDARD'
                            ? 'bg-blue-900 bg-opacity-20 text-blue-400'
                            : 'bg-purple-900 bg-opacity-20 text-purple-400'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${inspection.survey_type === 'STANDARD' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                          {inspection.survey_type}
                        </span>
                      </div>

                      {/* Deficiencies Count */}
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Deficiencies</span>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg font-bold text-sm ${
                            inspection.deficiency_count === 0
                              ? 'bg-green-900 bg-opacity-20 text-green-400'
                              : inspection.deficiency_count <= 5
                              ? 'bg-yellow-900 bg-opacity-20 text-yellow-400'
                              : 'bg-red-900 bg-opacity-20 text-red-400'
                          }`}>
                            {inspection.deficiency_count}
                          </span>
                          <span className="text-xs text-slate-500">found</span>
                        </div>
                      </div>

                      {/* Health Score */}
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Health Score</span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="w-full bg-slate-200 rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full transition-all ${
                                  inspection.health_score >= 90
                                    ? 'bg-green-500'
                                    : inspection.health_score >= 75
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${inspection.health_score}%` }}
                              />
                            </div>
                          </div>
                          <span className="font-bold text-slate-900 text-sm min-w-fit">{inspection.health_score}%</span>
                        </div>
                      </div>

                      {/* Expand Icon */}
                      <div className="flex justify-end">
                        <div className={`p-2 rounded-lg bg-slate-100 group-hover:bg-slate-200 transition-colors ${expandedInspection === inspection.id ? 'rotate-180' : ''}`} style={{ transform: expandedInspection === inspection.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                          <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Expandable Deficiencies Section */}
                  {expandedInspection === inspection.id && inspection.deficiencies && inspection.deficiencies.length > 0 && (
                    <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                      <div className="mb-3">
                        <h4 className="text-sm font-bold text-red-600 mb-4 flex items-center gap-2">
                            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Deficiencies Found
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {inspection.deficiencies.map((deficiency, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-slate-100 rounded-lg border border-slate-200">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${getSeverityColor(
                                deficiency.severity
                              )} whitespace-nowrap`}
                            >
                              {deficiency.tag}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-slate-900">{deficiency.description}</div>
                              <div className="text-xs text-slate-600 mt-1">
                                Severity: <span className="font-semibold">{getSeverityLabel(deficiency.severity)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty Deficiencies State */}
                  {expandedInspection === inspection.id && (!inspection.deficiencies || inspection.deficiencies.length === 0) && (
                    <div className="border-t border-slate-200 bg-slate-50 px-6 py-8 text-center">
                      <svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm font-semibold text-green-600">No deficiencies found</p>
                      <p className="text-xs text-slate-600 mt-1">This inspection passed with no issues</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </main>
  </div>
  );
}
