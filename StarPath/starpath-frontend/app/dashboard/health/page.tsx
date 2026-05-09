'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { API_URL } from '@/lib/api-config';
import { mockInspections, mockFacilities } from '@/lib/mock-data';

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
        return 'bg-red-100 text-red-800';
      case 'E':
        return 'bg-orange-100 text-orange-800';
      case 'G':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
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

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Please log in to access health inspections.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-8">
        <h1 className="text-4xl font-bold text-gray-900">Health Inspections</h1>
        <p className="text-lg text-gray-600 mt-3">
          Comprehensive analysis of facility health inspection records, deficiencies, and compliance trends
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-semibold text-gray-600 uppercase">Total Inspections</div>
          <div className="text-4xl font-bold text-blue-600 mt-3">{stats.totalInspections}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-semibold text-gray-600 uppercase">Avg Health Score</div>
          <div className="text-4xl font-bold text-green-600 mt-3">{stats.averageScore}%</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-semibold text-gray-600 uppercase">Total Deficiencies</div>
          <div className="text-4xl font-bold text-orange-600 mt-3">{stats.totalDeficiencies}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-semibold text-gray-600 uppercase">Critical Issues</div>
          <div className="text-4xl font-bold text-red-600 mt-3">{stats.criticalDeficiencies}</div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Inspection Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="STANDARD">Standard</option>
              <option value="REVISIT">Revisit</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="recent">Most Recent</option>
              <option value="deficiencies">Most Deficiencies</option>
              <option value="score">Lowest Score</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inspections List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Inspections ({filteredInspections.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">Loading inspections...</p>
          </div>
        ) : filteredInspections.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No health inspections found matching your filters.</p>
          </div>
        ) : (
          <div className="space-y-4 p-6">
            {filteredInspections.map((inspection) => (
              <div key={inspection.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-4">
                  <div>
                    <div className="text-xs font-semibold text-gray-600 uppercase">Survey Date</div>
                    <div className="text-lg font-bold text-gray-900 mt-1">
                      {new Date(inspection.survey_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-600 uppercase">Type</div>
                    <div className="text-lg font-bold text-gray-900 mt-1">{inspection.survey_type}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-600 uppercase">Cycle</div>
                    <div className="text-lg font-bold text-gray-900 mt-1">#{inspection.cycle}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-600 uppercase">Deficiencies</div>
                    <div className="mt-1">
                      <span className="inline-flex items-center justify-center w-10 h-10 bg-red-100 text-red-700 rounded-full text-lg font-bold">
                        {inspection.deficiency_count}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-600 uppercase">Health Score</div>
                    <div className="mt-1">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              inspection.health_score >= 90
                                ? 'bg-green-600'
                                : inspection.health_score >= 75
                                ? 'bg-yellow-600'
                                : 'bg-red-600'
                            }`}
                            style={{ width: `${inspection.health_score}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-900">{inspection.health_score}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deficiencies */}
                {inspection.deficiencies && inspection.deficiencies.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="text-sm font-semibold text-gray-900 mb-3">Deficiencies Found:</div>
                    <div className="space-y-2">
                      {inspection.deficiencies.map((deficiency, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${getSeverityColor(
                              deficiency.severity
                            )}`}
                          >
                            {deficiency.tag}
                          </span>
                          <div>
                            <div className="text-sm text-gray-900">{deficiency.description}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Severity: {getSeverityLabel(deficiency.severity)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
