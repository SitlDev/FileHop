'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  mockFacilities,
  mockRatings,
  mockInspections,
  mockStaffing,
  mockQualityMeasures,
  mockAlerts,
  mockDashboardStats,
} from '@/lib/mock-data';

/**
 * Design Preview / Demo Page
 * 
 * This page demonstrates the UI design using mock data.
 * Useful for:
 * - Design review before API integration
 * - Testing responsive layouts
 * - Performance testing with realistic data volumes
 * - Creating mockups for stakeholder review
 * 
 * To use this page in production, add it to the navigation or
 * access it directly at /dashboard/demo
 */

export default function DemoPage() {
  const [selectedFacility, setSelectedFacility] = useState(mockFacilities[0].id);
  const [selectedTab, setSelectedTab] = useState('overview');

  const selectedFacilityData = mockFacilities.find((f) => f.id === selectedFacility);
  const selectedRating = mockRatings.find((r) => r.facility_id === selectedFacility);
  const facilityInspections = mockInspections.filter((i) => i.facility_id === selectedFacility);
  const facilityStaffing = mockStaffing.find((s) => s.facility_id === selectedFacility);
  const facilityMeasures = mockQualityMeasures.filter((m) => m.facility_id === selectedFacility);

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className="text-xl">
          {star <= rating ? '★' : '☆'}
        </span>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Design Preview</h1>
          <p className="text-gray-600 mt-2">
            This page showcases the UI design with sample data. All data shown here is mock data for design purposes.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-blue-800">
            <strong>Demo Mode:</strong> Using sample data to demonstrate page layouts and components.
            This page is useful for design review, responsive testing, and performance analysis.
          </p>
        </div>

        {/* Facility Selector */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-900 mb-3">Select Facility:</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockFacilities.map((facility) => (
              <button
                key={facility.id}
                onClick={() => setSelectedFacility(facility.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedFacility === facility.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900">{facility.name}</div>
                <div className="text-sm text-gray-600 mt-1">{facility.address.city}, {facility.address.state}</div>
                <div className="text-xs text-gray-500 mt-1">CMS ID: {facility.cms_provider_id}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
              {selectedFacilityData && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedFacilityData.name}</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-semibold text-gray-600 uppercase">Address</div>
                      <div className="text-sm text-gray-700 mt-1">
                        {selectedFacilityData.address.street}<br />
                        {selectedFacilityData.address.city}, {selectedFacilityData.address.state} {selectedFacilityData.address.zip}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-gray-600 uppercase">Licensed Beds</div>
                      <div className="text-2xl font-bold text-blue-600 mt-1">{selectedFacilityData.bed_count}</div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-gray-600 uppercase">Ownership</div>
                      <div className="text-sm text-gray-700 mt-1">{selectedFacilityData.ownership_type}</div>
                    </div>

                    {selectedRating && (
                      <div className="pt-4 border-t border-gray-200">
                        <div className="text-xs font-semibold text-gray-600 uppercase mb-3">Overall Rating</div>
                        <div className="mb-3">
                          <StarRating rating={selectedRating.overall_rating} />
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedRating.overall_rating}/5
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Effective: {new Date(selectedRating.effective_date).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              {['overview', 'inspections', 'staffing', 'quality'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-4 py-3 font-medium border-b-2 transition-all ${
                    selectedTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {selectedTab === 'overview' && selectedRating && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Four-Domain Ratings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Health Inspections', rating: selectedRating.health_inspection_rating },
                      { label: 'Staffing', rating: selectedRating.staffing_rating },
                      { label: 'Quality Measures', rating: selectedRating.qm_rating },
                    ].map((domain) => (
                      <div key={domain.label} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="text-sm font-semibold text-gray-600 mb-3">{domain.label}</div>
                        <div className="mb-3">
                          <StarRating rating={domain.rating} />
                        </div>
                        <div className="text-2xl font-bold text-blue-600">{domain.rating}/5</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Inspections Tab */}
            {selectedTab === 'inspections' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Health Inspections</h3>
                <div className="space-y-3">
                  {facilityInspections.map((inspection) => (
                    <div key={inspection.id} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {new Date(inspection.survey_date).toLocaleDateString()} - {inspection.survey_type}
                          </div>
                          <div className="text-sm text-gray-600">Cycle {inspection.cycle}</div>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                          {inspection.deficiency_count} Deficiencies
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${inspection.health_score}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-2">Health Score: {inspection.health_score}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Staffing Tab */}
            {selectedTab === 'staffing' && facilityStaffing && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Staffing Levels</h3>
                {[
                  { label: 'RN Staffing', value: facilityStaffing.rn_staffing },
                  { label: 'LN Staffing', value: facilityStaffing.ln_staffing },
                  { label: 'Aide Staffing', value: facilityStaffing.aide_staffing },
                ].map((staffing) => (
                  <div key={staffing.label} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-gray-900">{staffing.label}</div>
                      <div className="text-2xl font-bold text-blue-600">{staffing.value.toFixed(2)}</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">Hours per resident day</div>
                  </div>
                ))}
              </div>
            )}

            {/* Quality Measures Tab */}
            {selectedTab === 'quality' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quality Measures</h3>
                <div className="space-y-3">
                  {facilityMeasures.map((measure) => (
                    <div key={measure.id} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="font-semibold text-gray-900">{measure.measure_name}</div>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            measure.comparison === 'Better'
                              ? 'bg-green-100 text-green-700'
                              : measure.comparison === 'Worse'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {measure.comparison}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">{measure.measure_value}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Stats Section */}
        <div className="mt-12 pt-12 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Total Facilities', value: mockDashboardStats.totalFacilities },
              { label: 'Average Rating', value: mockDashboardStats.averageRating.toFixed(1) },
              { label: 'Total Inspections', value: mockDashboardStats.totalInspections },
              { label: 'Total Deficiencies', value: mockDashboardStats.totalDeficiencies },
              { label: 'Pending Alerts', value: mockDashboardStats.pendingAlerts },
              { label: 'Compliance Rate', value: `${mockDashboardStats.complianceRate}%` },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-sm font-semibold text-gray-600 uppercase">{stat.label}</div>
                <div className="text-3xl font-bold text-blue-600 mt-3">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts Section */}
        <div className="mt-12 pt-12 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sample Alerts</h2>
          <div className="space-y-4">
            {mockAlerts.slice(0, 5).map((alert) => {
              const severityColor = {
                critical: 'bg-red-100 text-red-800 border-red-300',
                high: 'bg-orange-100 text-orange-800 border-orange-300',
                medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                low: 'bg-blue-100 text-blue-800 border-blue-300',
              };

              return (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 ${severityColor[alert.severity]}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{alert.title}</div>
                      <div className="text-sm mt-1 opacity-90">{alert.description}</div>
                      <div className="text-xs mt-2 opacity-75">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {alert.resolved && (
                      <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Resolved
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
