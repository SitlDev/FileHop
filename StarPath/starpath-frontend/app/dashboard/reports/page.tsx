'use client'

import { useState, useEffect } from 'react'
import { FileText, Download, Calendar, AlertCircle, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getToken } from '@/lib/auth'
import { useAuth } from '@/lib/useAuth'
import Sidebar from '@/components/Sidebar'

interface Facility {
  id: string
  cms_provider_id: string
  name: string
  bed_count: number
  is_active: boolean
}

interface Report {
  id: string
  type: 'facility' | 'ratings_trend' | 'staffing' | 'quality_measures' | 'comparative'
  name: string
  description: string
  icon: React.ReactNode
  sections?: string[]
}

interface ReportOptions {
  includeDeficiencies: boolean
  includeStaffingDetails: boolean
  includeQualityMeasures: boolean
  includeComparative: boolean
  timeRange: 'quarterly' | 'annual' | 'all'
  format: 'pdf' | 'csv' | 'excel'
}

export default function ReportsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [selectedFacility, setSelectedFacility] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string>('')
  const [error, setError] = useState('')
  const [showCustomization, setShowCustomization] = useState<string | null>(null)
  const [reportOptions, setReportOptions] = useState<ReportOptions>({
    includeDeficiencies: true,
    includeStaffingDetails: true,
    includeQualityMeasures: true,
    includeComparative: false,
    timeRange: 'quarterly',
    format: 'pdf',
  })

  const reports: Report[] = [
    {
      id: 'facility',
      type: 'facility',
      name: 'Comprehensive Facility Report',
      description: 'Complete facility overview including ratings, inspections, and deficiencies',
      icon: <FileText size={20} />,
      sections: ['Overall Rating', 'Four-Domain Ratings', 'Health Inspections', 'Deficiencies', 'Staffing Summary'],
    },
    {
      id: 'ratings_trend',
      type: 'ratings_trend',
      name: 'Ratings Trend Analysis',
      description: 'Historical ratings trends and performance analysis',
      icon: <TrendingUp size={20} />,
      sections: ['Rating History', 'Trend Analysis', 'Summary Statistics'],
    },
    {
      id: 'staffing',
      type: 'staffing',
      name: 'Staffing Domain Report',
      description: 'Detailed staffing ratios, turnover, and adequacy analysis',
      icon: <FileText size={20} />,
      sections: ['Staffing Levels', 'RN/LPN/CNA Ratios', 'Turnover Rate', 'State/National Comparison'],
    },
    {
      id: 'quality_measures',
      type: 'quality_measures',
      name: 'Quality Measures Report',
      description: 'Long-stay and short-stay quality indicators with trend analysis',
      icon: <TrendingUp size={20} />,
      sections: ['Long-Stay Indicators', 'Short-Stay Indicators', 'Trend Analysis', 'Benchmarking'],
    },
    {
      id: 'comparative',
      type: 'comparative',
      name: 'Comparative Analysis Report',
      description: 'Facility performance vs. state and national benchmarks',
      icon: <FileText size={20} />,
      sections: ['State Comparison', 'National Comparison', 'Percentile Ranking', 'Performance Summary'],
    },
  ]

  useEffect(() => {
    fetchFacilities()
  }, [])

  const fetchFacilities = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/facilities/`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setFacilities(data)
        if (data.length > 0) {
          setSelectedFacility(data[0].id)
        }
      } else if (response.status === 401) {
        router.push('/auth/login')
      }
    } catch (err) {
      setError('Failed to load facilities')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = async (reportType: string) => {
    if (!selectedFacility) {
      setError('Please select a facility')
      return
    }

    setDownloading(reportType)

    try {
      let endpoint = ''
      let filename = ''
      const facility = facilities.find((f) => f.id === selectedFacility)
      const facilityName = facility?.name || 'Facility'

      // Build query params from options
      const params = new URLSearchParams()
      params.append('include_deficiencies', reportOptions.includeDeficiencies.toString())
      params.append('include_staffing_details', reportOptions.includeStaffingDetails.toString())
      params.append('include_quality_measures', reportOptions.includeQualityMeasures.toString())
      params.append('include_comparative', reportOptions.includeComparative.toString())
      params.append('time_range', reportOptions.timeRange)
      params.append('format', reportOptions.format)

      if (reportType === 'facility') {
        endpoint = `/api/v1/reports/facility/${selectedFacility}?${params}`
        filename = `${facilityName}_Report_${new Date().toISOString().split('T')[0]}.${reportOptions.format}`
      } else if (reportType === 'ratings_trend') {
        endpoint = `/api/v1/reports/ratings-trend/${selectedFacility}?${params}`
        filename = `${facilityName}_Ratings_Trend_${new Date().toISOString().split('T')[0]}.${reportOptions.format}`
      } else if (reportType === 'staffing') {
        endpoint = `/api/v1/reports/staffing/${selectedFacility}?${params}`
        filename = `${facilityName}_Staffing_Report_${new Date().toISOString().split('T')[0]}.${reportOptions.format}`
      } else if (reportType === 'quality_measures') {
        endpoint = `/api/v1/reports/quality-measures/${selectedFacility}?${params}`
        filename = `${facilityName}_Quality_Measures_${new Date().toISOString().split('T')[0]}.${reportOptions.format}`
      } else if (reportType === 'comparative') {
        endpoint = `/api/v1/reports/comparative/${selectedFacility}?${params}`
        filename = `${facilityName}_Comparative_Analysis_${new Date().toISOString().split('T')[0]}.${reportOptions.format}`
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        setShowCustomization(null)
      } else {
        setError('Failed to download report')
      }
    } catch (err) {
      setError('Error downloading report')
      console.error(err)
    } finally {
      setDownloading('')
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50">
        <Sidebar user={user} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin mb-4">
              <FileText size={32} className="text-indigo-500" />
            </div>
            <p className="text-slate-600">Loading reports...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar user={user} />

      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Reports & Exports</h1>
            <p className="text-slate-600">Download facility reports and analysis data</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {/* Facility Selection */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-3">Select Facility</label>
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="w-full px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose a facility --</option>
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name} ({facility.bed_count} beds)
                </option>
              ))}
            </select>

            {selectedFacility && (
              <div className="mt-4 p-4 bg-slate-100/50 rounded-lg">
                <p className="text-sm text-slate-700">
                  <strong>Selected:</strong>{' '}
                  {facilities.find((f) => f.id === selectedFacility)?.name}
                </p>
              </div>
            )}
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-400">
                    {report.icon}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-slate-900 mb-2">{report.name}</h3>
                <p className="text-slate-600 text-sm mb-4 flex-grow">{report.description}</p>

                {report.sections && (
                  <div className="mb-4 p-3 bg-slate-100/50 rounded-lg">
                    <p className="text-xs font-semibold text-slate-700 mb-2">Includes:</p>
                    <ul className="text-xs text-slate-600 space-y-1">
                      {report.sections.map((section, i) => (
                        <li key={i}>• {section}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2">
                  {selectedFacility && (
                    <>
                      <button
                        onClick={() => setShowCustomization(showCustomization === report.id ? null : report.id)}
                        className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-600 text-slate-900 text-sm font-medium rounded-lg transition"
                      >
                        Customize
                      </button>
                      <button
                        onClick={() => downloadReport(report.type)}
                        disabled={downloading === report.type}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-500 text-slate-900 text-sm font-medium rounded-lg transition"
                      >
                        <Download size={16} />
                        {downloading === report.type ? 'Downloading...' : 'Download'}
                      </button>
                    </>
                  )}
                </div>

                {/* Customization Panel */}
                {showCustomization === report.id && selectedFacility && (
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700">Report Format:</label>
                      <select
                        value={reportOptions.format}
                        onChange={(e) => setReportOptions({ ...reportOptions, format: e.target.value as any })}
                        className="w-full px-2 py-1 bg-slate-100 border border-slate-300 rounded text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="pdf">PDF (Printable)</option>
                        <option value="csv">CSV (Data)</option>
                        <option value="excel">Excel (Spreadsheet)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700">Time Range:</label>
                      <select
                        value={reportOptions.timeRange}
                        onChange={(e) => setReportOptions({ ...reportOptions, timeRange: e.target.value as any })}
                        className="w-full px-2 py-1 bg-slate-100 border border-slate-300 rounded text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="quarterly">Last Quarter</option>
                        <option value="annual">Last Year</option>
                        <option value="all">All Time</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700">Report Sections:</label>
                      <div className="space-y-1">
                        <label className="flex items-center gap-2 text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={reportOptions.includeDeficiencies}
                            onChange={(e) => setReportOptions({ ...reportOptions, includeDeficiencies: e.target.checked })}
                            className="w-3 h-3 rounded"
                          />
                          Include Deficiencies
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={reportOptions.includeStaffingDetails}
                            onChange={(e) => setReportOptions({ ...reportOptions, includeStaffingDetails: e.target.checked })}
                            className="w-3 h-3 rounded"
                          />
                          Include Staffing Details
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={reportOptions.includeQualityMeasures}
                            onChange={(e) => setReportOptions({ ...reportOptions, includeQualityMeasures: e.target.checked })}
                            className="w-3 h-3 rounded"
                          />
                          Include Quality Measures
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={reportOptions.includeComparative}
                            onChange={(e) => setReportOptions({ ...reportOptions, includeComparative: e.target.checked })}
                            className="w-3 h-3 rounded"
                          />
                          Include Benchmarking
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-600 flex-shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-300 mb-2">CMS-Compliant Reports</h4>
                  <p className="text-blue-200/80 text-sm">
                    All reports follow official CMS Five-Star Quality Rating System standards from Medicare.gov Nursing Home Compare, ensuring professional compliance and accuracy.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-500/20 rounded-lg text-green-600 flex-shrink-0">
                  <Download size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-green-300 mb-2">Multiple Export Formats</h4>
                  <p className="text-green-200/80 text-sm">
                    Download reports as PDF for printing, CSV for data analysis, or Excel for spreadsheet integration. Customize sections and time ranges before downloading.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Report Features Section */}
          <div className="mt-8">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Report Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/50 border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-indigo-400 mb-2 text-sm">Facility Report</h4>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>✓ Current star ratings</li>
                  <li>✓ Four-domain analysis</li>
                  <li>✓ Recent inspections</li>
                  <li>✓ Deficiency details</li>
                  <li>✓ Staffing summary</li>
                </ul>
              </div>

              <div className="bg-white/50 border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-600 mb-2 text-sm">Trend Analysis</h4>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>✓ Historical ratings</li>
                  <li>✓ Performance trends</li>
                  <li>✓ 24-month history</li>
                  <li>✓ Trend indicators</li>
                  <li>✓ Summary statistics</li>
                </ul>
              </div>

              <div className="bg-white/50 border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-600 mb-2 text-sm">Comparative Analysis</h4>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>✓ State benchmarks</li>
                  <li>✓ National averages</li>
                  <li>✓ Percentile ranking</li>
                  <li>✓ Performance gaps</li>
                  <li>✓ Improvement areas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
