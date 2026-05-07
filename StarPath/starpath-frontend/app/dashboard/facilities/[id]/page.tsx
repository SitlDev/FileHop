'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import RatingBadge from '@/components/ui/RatingBadge'
import StatCard from '@/components/ui/StatCard'
import DomainRadarChart from '@/components/charts/DomainRadarChart'
import RatingProgress from '@/components/charts/RatingProgress'
import RatingTrendChart from '@/components/charts/RatingTrendChart'
import DeficiencyDetailModal from '@/components/DeficiencyDetailModal'
import { getToken, getCurrentUser, User } from '@/lib/auth'
import { API_URL } from '@/lib/api-config'

interface FacilityDetail {
  id: string
  cms_provider_id: string
  name: string
  bed_count: number
  address: {
    street?: string
    city?: string
    state?: string
    zip?: string
  }
  ownership: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Deficiency {
  id: string
  description: string
  severity: string
  scope: string
  f_tag?: string
}

interface HealthInspection {
  id: string
  survey_date: string
  survey_type: string
  cycle: number
  revisit_count: number
  deficiencies?: Deficiency[]
}

interface StarRating {
  id: string
  effective_date: string
  health_inspection_rating: number
  staffing_rating: number
  qm_rating: number
  overall_rating: number
  health_inspection_score: number
  staffing_score: number
  qm_score: number
}

export default function FacilityDetailPage() {
  const router = useRouter()
  const params = useParams()
  const facilityId = params?.id as string

  const [facility, setFacility] = useState<FacilityDetail | null>(null)
  const [inspections, setInspections] = useState<HealthInspection[]>([])
  const [ratings, setRatings] = useState<StarRating[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'inspections' | 'ratings'>('overview')
  const [selectedDeficiency, setSelectedDeficiency] = useState<Deficiency | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken()
      if (!token) {
        router.push('/auth/login')
        return
      }

      try {
        const userData = await getCurrentUser(token)
        setUser(userData)

        // Fetch facility details
        const facilityRes = await fetch(`${API_URL}/api/v1/facilities/${facilityId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!facilityRes.ok) {
          throw new Error('Facility not found')
        }

        const facilityData = await facilityRes.json()
        setFacility(facilityData)

        // Fetch health inspections
        try {
          const inspectionsRes = await fetch(`${API_URL}/api/v1/inspections/facility/${facilityId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })

          if (inspectionsRes.ok) {
            const inspectionsData = await inspectionsRes.json()
            setInspections(inspectionsData)
          }
        } catch (err) {
          console.warn('Failed to fetch inspections:', err)
        }

        // Fetch star ratings
        try {
          const ratingsRes = await fetch(`${API_URL}/api/v1/ratings/facility/${facilityId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })

          if (ratingsRes.ok) {
            const ratingsData = await ratingsRes.json()
            setRatings(ratingsData)
          }
        } catch (err) {
          console.warn('Failed to fetch ratings:', err)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load facility details')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (facilityId) {
      fetchData()
    }
  }, [facilityId, router])

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-900">
        <Sidebar user={user} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-slate-300">Loading facility details...</div>
        </main>
      </div>
    )
  }

  if (error || !facility) {
    return (
      <div className="flex h-screen bg-slate-900">
        <Sidebar user={user} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error || 'Facility not found'}</p>
            <Link href="/dashboard/facilities" className="text-blue-400 hover:text-blue-300">
              ← Back to Facilities
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const latestRating = ratings[0]
  const latestInspection = inspections[0]

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <Link
                href="/dashboard/facilities"
                className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
              >
                ← Back to Facilities
              </Link>
              <h1 className="text-4xl font-bold text-white mb-2">{facility.name}</h1>
              <p className="text-slate-400">Provider ID: {facility.cms_provider_id}</p>
            </div>
            {facility.is_active && (
              <span className="px-3 py-1 bg-green-500/20 text-green-300 text-sm font-medium rounded">
                Active
              </span>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Current Rating" value={latestRating?.overall_rating.toString() || 'N/A'} />
            <StatCard label="Bed Count" value={facility.bed_count?.toString() || 'N/A'} />
            <StatCard label="Last Inspection" value={latestInspection?.survey_date ? new Date(latestInspection.survey_date).toLocaleDateString() : 'N/A'} />
            <StatCard label="Status" value={facility.is_active ? 'Active' : 'Inactive'} />
          </div>

          {/* Facility Info Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Facility Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-400 mb-1">Provider ID</p>
                <p className="text-white font-medium">{facility.cms_provider_id}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Bed Count</p>
                <p className="text-white font-medium">{facility.bed_count || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Ownership</p>
                <p className="text-white font-medium">{facility.ownership || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Status</p>
                <p className="text-white font-medium">{facility.is_active ? 'Active' : 'Inactive'}</p>
              </div>
              {facility.address?.street && (
                <div className="md:col-span-2">
                  <p className="text-sm text-slate-400 mb-1">Address</p>
                  <p className="text-white font-medium">
                    {facility.address.street}
                    {facility.address.city && `, ${facility.address.city}`}
                    {facility.address.state && `, ${facility.address.state}`}
                    {facility.address.zip && ` ${facility.address.zip}`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex gap-4 border-b border-slate-700">
              {(['overview', 'inspections', 'ratings'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'text-blue-400 border-blue-400'
                      : 'text-slate-400 border-transparent hover:text-slate-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {latestRating && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-6">Star Rating Breakdown</h3>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Radar Chart */}
                    <div className="lg:col-span-1 flex items-center justify-center">
                      <DomainRadarChart
                        data={[
                          { domain: 'Health', score: latestRating.health_inspection_rating, max: 5 },
                          { domain: 'Staffing', score: latestRating.staffing_rating, max: 5 },
                          { domain: 'Quality', score: latestRating.qm_rating, max: 5 },
                        ]}
                      />
                    </div>

                    {/* Detailed Scores with Progress */}
                    <div className="lg:col-span-2 space-y-4">
                      <RatingProgress
                        label="Health Inspections"
                        score={latestRating.health_inspection_score}
                        rating={latestRating.health_inspection_rating}
                      />
                      <RatingProgress
                        label="Staffing Quality"
                        score={latestRating.staffing_score}
                        rating={latestRating.staffing_rating}
                      />
                      <RatingProgress
                        label="Quality Measures"
                        score={latestRating.qm_score}
                        rating={latestRating.qm_rating}
                      />

                      <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg mt-6">
                        <p className="text-slate-300 font-medium">Overall Rating</p>
                        <RatingBadge rating={latestRating.overall_rating} size="lg" />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-6">
                    Last updated: {new Date(latestRating.effective_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'inspections' && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Health Inspections</h3>

              {inspections.length === 0 ? (
                <p className="text-slate-400">No inspections recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {inspections.map((inspection, idx) => (
                    <div key={inspection.id} className="border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm text-slate-400">Cycle {inspection.cycle}</p>
                          <p className="text-white font-medium">{inspection.survey_type} Survey</p>
                        </div>
                        {idx === 0 && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                            Latest
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 text-sm mb-2">
                        Survey Date: {new Date(inspection.survey_date).toLocaleDateString()}
                      </p>
                      {inspection.deficiencies && inspection.deficiencies.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <p className="text-sm text-slate-300 mb-2">
                            Deficiencies: <span className="text-red-400 font-medium">{inspection.deficiencies.length}</span>
                          </p>
                          <div className="space-y-2">
                            {inspection.deficiencies.slice(0, 3).map((def) => (
                              <button
                                key={def.id}
                                onClick={() => setSelectedDeficiency(def)}
                                className="text-xs text-slate-400 flex items-start gap-2 hover:text-blue-300 hover:bg-slate-700/50 p-2 rounded transition w-full text-left"
                              >
                                <span className="text-slate-500 mt-0.5">•</span>
                                <span className="line-clamp-2">{def.description} ({def.severity})</span>
                              </button>
                            ))}
                            {inspection.deficiencies.length > 3 && (
                              <p className="text-xs text-slate-500 cursor-pointer hover:text-slate-400 transition">
                                +{inspection.deficiencies.length - 3} more deficiencies
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ratings' && (
            <div className="space-y-6">
              {ratings.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-6">Rating Trends</h3>
                  <RatingTrendChart
                    data={ratings.map(r => ({
                      date: new Date(r.effective_date).toLocaleDateString(),
                      health: r.health_inspection_rating,
                      staffing: r.staffing_rating,
                      quality: r.qm_rating,
                      overall: r.overall_rating,
                    }))}
                  />
                </div>
              )}

              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Rating History</h3>

                {ratings.length === 0 ? (
                  <p className="text-slate-400">No ratings available yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-slate-700">
                        <tr>
                          <th className="text-left py-3 px-4 text-slate-400">Date</th>
                          <th className="text-center py-3 px-4 text-slate-400">Health</th>
                          <th className="text-center py-3 px-4 text-slate-400">Staffing</th>
                          <th className="text-center py-3 px-4 text-slate-400">Quality</th>
                          <th className="text-center py-3 px-4 text-slate-400">Overall</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ratings.map((rating) => (
                          <tr key={rating.id} className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors">
                            <td className="py-3 px-4 text-slate-300">
                              {new Date(rating.effective_date).toLocaleDateString()}
                            </td>
                            <td className="text-center py-3 px-4">
                              <RatingBadge rating={rating.health_inspection_rating} />
                            </td>
                            <td className="text-center py-3 px-4">
                              <RatingBadge rating={rating.staffing_rating} />
                            </td>
                            <td className="text-center py-3 px-4">
                              <RatingBadge rating={rating.qm_rating} />
                            </td>
                            <td className="text-center py-3 px-4">
                              <RatingBadge rating={rating.overall_rating} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Deficiency Detail Modal */}
      <DeficiencyDetailModal
        deficiency={selectedDeficiency}
        onClose={() => setSelectedDeficiency(null)}
      />
    </div>
  )
}
