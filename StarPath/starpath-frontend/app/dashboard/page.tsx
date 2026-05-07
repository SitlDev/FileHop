'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import StatCard from '@/components/ui/StatCard'
import RatingBadge from '@/components/ui/RatingBadge'
import { getToken, getCurrentUser, User } from '@/lib/auth'
import { API_URL } from '@/lib/api-config'

interface Facility {
  id: string
  cms_provider_id: string
  name: string
  bed_count: number
  is_active: boolean
}

interface StarRating {
  id: string
  facility_id: string
  overall_rating: number
  health_inspection_rating: number
  staffing_rating: number
  qm_rating: number
  effective_date: string
}

interface AnalyticMetrics {
  totalFacilities: number
  activeFacilities: number
  averageRating: number
  totalBeds: number
  facilityCount: number
  lowRatingCount: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [ratings, setRatings] = useState<StarRating[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [metrics, setMetrics] = useState<AnalyticMetrics>({
    totalFacilities: 0,
    activeFacilities: 0,
    averageRating: 0,
    totalBeds: 0,
    facilityCount: 0,
    lowRatingCount: 0,
  })
  const [trends, setTrends] = useState<{
    [facilityId: string]: {
      current: number
      previous: number
      direction: 'up' | 'down' | 'stable'
      percentChange: number
    }
  }>({})
  const [lowRatingAlerts, setLowRatingAlerts] = useState<
    {
      facilityId: string
      facilityName: string
      rating: number
      type: string
    }[]
  >([])

  useEffect(() => {
    const fetchAnalytics = async () => {
      const token = getToken()
      if (!token) {
        router.push('/auth/login')
        return
      }

      try {
        // Get current user
        const userData = await getCurrentUser(token)
        setUser(userData)

        // Get facilities
        const facilitiesRes = await fetch(`${API_URL}/api/v1/facilities/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!facilitiesRes.ok) throw new Error('Failed to fetch facilities')
        const facilitiesData: Facility[] = await facilitiesRes.json()
        setFacilities(facilitiesData)

        // Get all ratings for each facility
        const allRatings: StarRating[] = []
        const facilityTrends: typeof trends = {}
        const alerts: typeof lowRatingAlerts = []

        for (const facility of facilitiesData) {
          try {
            const ratingsRes = await fetch(
              `${API_URL}/api/v1/ratings/facility/${facility.id}`,
              {
                headers: { 'Authorization': `Bearer ${token}` },
              }
            )

            if (ratingsRes.ok) {
              const facilityRatings: StarRating[] = await ratingsRes.json()
              allRatings.push(...facilityRatings)

              // Calculate trends
              if (facilityRatings.length >= 2) {
                const latest = facilityRatings[0]
                const previous = facilityRatings[1]
                const currentRating = latest.overall_rating
                const previousRating = previous.overall_rating
                const change = currentRating - previousRating
                const percentChange =
                  previousRating > 0 ? (change / previousRating) * 100 : 0

                facilityTrends[facility.id] = {
                  current: currentRating,
                  previous: previousRating,
                  direction:
                    change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
                  percentChange: Math.abs(percentChange),
                }

                // Check for low ratings
                if (currentRating <= 2) {
                  alerts.push({
                    facilityId: facility.id,
                    facilityName: facility.name,
                    rating: currentRating,
                    type: 'low-rating',
                  })
                }
              } else if (facilityRatings.length === 1) {
                const latest = facilityRatings[0]
                facilityTrends[facility.id] = {
                  current: latest.overall_rating,
                  previous: latest.overall_rating,
                  direction: 'stable',
                  percentChange: 0,
                }

                if (latest.overall_rating <= 2) {
                  alerts.push({
                    facilityId: facility.id,
                    facilityName: facility.name,
                    rating: latest.overall_rating,
                    type: 'low-rating',
                  })
                }
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch ratings for facility ${facility.id}`)
          }
        }

        setRatings(allRatings)
        setTrends(facilityTrends)
        setLowRatingAlerts(alerts)

        // Calculate metrics
        const activeFacilityCount = facilitiesData.filter(
          (f) => f.is_active
        ).length
        const totalBedsCount = facilitiesData.reduce(
          (sum, f) => sum + (f.bed_count || 0),
          0
        )

        let avgRating = 0
        if (allRatings.length > 0) {
          // Get latest rating for each facility
          const latestRatings = facilitiesData.map((fac) => {
            const facRatings = allRatings.filter((r) => r.facility_id === fac.id)
            return facRatings.length > 0 ? facRatings[0].overall_rating : 0
          })
          avgRating =
            latestRatings.reduce((sum, r) => sum + r, 0) /
            latestRatings.filter((r) => r > 0).length
        }

        setMetrics({
          totalFacilities: facilitiesData.length,
          activeFacilities: activeFacilityCount,
          averageRating: Math.round(avgRating * 10) / 10,
          totalBeds: totalBedsCount,
          facilityCount: facilitiesData.length,
          lowRatingCount: alerts.length,
        })
      } catch (err) {
        setError('Failed to load dashboard data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [router])

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-slate-400">
              Welcome back, {user?.full_name || 'User'}! Here's your facility overview.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-900 border border-red-700 rounded-lg text-red-100 mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-slate-300">Loading analytics...</div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  label="Total Facilities"
                  value={metrics.totalFacilities.toString()}
                  sub={`${metrics.activeFacilities} active`}
                />
                <StatCard
                  label="Avg Star Rating"
                  value={metrics.averageRating.toFixed(1)}
                  sub="across all facilities"
                />
                <StatCard
                  label="Total Beds"
                  value={metrics.totalBeds.toString()}
                  sub="licensed capacity"
                />
                <StatCard
                  label="Alerts"
                  value={metrics.lowRatingCount.toString()}
                  sub={`${metrics.lowRatingCount} low ratings`}
                />
              </div>

              {/* Low Rating Alerts */}
              {lowRatingAlerts.length > 0 && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-300 mb-2">
                        Facilities with Low Ratings
                      </h3>
                      <div className="space-y-1 text-sm text-red-200">
                        {lowRatingAlerts.map((alert) => (
                          <p key={alert.facilityId}>
                            • {alert.facilityName}:{' '}
                            <span className="font-medium">
                              {alert.rating} ★
                            </span>
                          </p>
                        ))}
                      </div>
                      <Link
                        href="/dashboard/facilities"
                        className="text-red-300 hover:text-red-200 text-sm mt-2 inline-block underline"
                      >
                        View all facilities →
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Rating Trends */}
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-8">
                <h2 className="text-xl font-bold text-white mb-4">
                  Recent Rating Trends
                </h2>

                {facilities.length === 0 ? (
                  <p className="text-slate-400">
                    No facilities yet. Create your first facility to see trends.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {facilities.map((facility) => {
                      const trend = trends[facility.id]
                      if (!trend) return null

                      return (
                        <Link
                          key={facility.id}
                          href={`/dashboard/facilities/${facility.id}`}
                          className="flex items-center justify-between p-4 bg-slate-700/30 border border-slate-600 rounded-lg hover:border-blue-500 transition"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <RatingBadge rating={trend.current} />
                            <div className="flex-1">
                              <p className="font-medium text-white">
                                {facility.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {facility.bed_count} beds
                              </p>
                            </div>
                          </div>

                          {trend.direction !== 'stable' && (
                            <div
                              className={`flex items-center gap-1 px-3 py-1 rounded-lg ${
                                trend.direction === 'up'
                                  ? 'bg-green-500/20 text-green-300'
                                  : 'bg-red-500/20 text-red-300'
                              }`}
                            >
                              {trend.direction === 'up' ? (
                                <TrendingUp size={16} />
                              ) : (
                                <TrendingDown size={16} />
                              )}
                              <span className="text-xs font-semibold">
                                {trend.percentChange.toFixed(0)}%
                              </span>
                            </div>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/dashboard/facilities"
                  className="p-6 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-white font-semibold"
                >
                  📊 View All Facilities
                </Link>
                <Link
                  href="/dashboard/facilities?addNew=true"
                  className="p-6 bg-green-600 hover:bg-green-700 rounded-lg transition text-white font-semibold"
                >
                  ➕ Add New Facility
                </Link>
                <Link
                  href="/dashboard/profile"
                  className="p-6 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition text-white font-semibold"
                >
                  ⚙️ Settings
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
