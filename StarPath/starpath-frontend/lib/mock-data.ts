/**
 * Mock Data Generator for UI/UX Design Preview
 * These sample data are used to populate pages without requiring API calls
 */

export const mockFacilities = [
  {
    id: '1',
    name: 'Sunrise Senior Care',
    cms_provider_id: '100001',
    address: {
      street: '123 Oak Avenue',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
    },
    bed_count: 120,
    ownership_type: 'For Profit',
    phone: '(415) 555-0101',
    overall_rating: 5,
  },
  {
    id: '2',
    name: 'Meadowbrook Health Center',
    cms_provider_id: '100002',
    address: {
      street: '456 Pine Street',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90001',
    },
    bed_count: 150,
    ownership_type: 'Non Profit',
    phone: '(213) 555-0202',
    overall_rating: 4,
  },
  {
    id: '3',
    name: 'Garden Vista Nursing Home',
    cms_provider_id: '100003',
    address: {
      street: '789 Maple Drive',
      city: 'San Diego',
      state: 'CA',
      zip: '92101',
    },
    bed_count: 100,
    ownership_type: 'For Profit',
    phone: '(619) 555-0303',
    overall_rating: 3,
  },
];

export const mockRatings = [
  {
    id: '1',
    facility_id: '1',
    overall_rating: 5,
    health_inspection_rating: 5,
    staffing_rating: 4,
    qm_rating: 5,
    effective_date: '2026-04-15',
    trend: 'improved',
  },
  {
    id: '2',
    facility_id: '2',
    overall_rating: 4,
    health_inspection_rating: 4,
    staffing_rating: 4,
    qm_rating: 3,
    effective_date: '2026-04-10',
    trend: 'stable',
  },
  {
    id: '3',
    facility_id: '3',
    overall_rating: 3,
    health_inspection_rating: 3,
    staffing_rating: 3,
    qm_rating: 3,
    effective_date: '2026-03-20',
    trend: 'declined',
  },
];

export const mockInspections = [
  {
    id: '1',
    facility_id: '1',
    survey_date: '2026-03-15',
    survey_type: 'STANDARD',
    cycle: 2,
    deficiency_count: 2,
    health_score: 95,
    status: 'Completed',
    deficiencies: [
      { tag: 'F835', description: 'Infection control procedures', severity: 'G' },
      { tag: 'F689', description: 'Nutrition and hydration', severity: 'E' },
    ],
  },
  {
    id: '2',
    facility_id: '1',
    survey_date: '2025-12-10',
    survey_type: 'STANDARD',
    cycle: 1,
    deficiency_count: 4,
    health_score: 88,
    status: 'Completed',
    deficiencies: [
      { tag: 'F689', description: 'Nutrition and hydration', severity: 'E' },
      { tag: 'F835', description: 'Infection control procedures', severity: 'G' },
      { tag: 'F868', description: 'Administration of medications', severity: 'H' },
      { tag: 'F656', description: 'Nursing services', severity: 'G' },
    ],
  },
  {
    id: '3',
    facility_id: '2',
    survey_date: '2026-02-20',
    survey_type: 'STANDARD',
    cycle: 1,
    deficiency_count: 5,
    health_score: 82,
    status: 'Completed',
    deficiencies: [
      { tag: 'F689', description: 'Nutrition and hydration', severity: 'E' },
      { tag: 'F835', description: 'Infection control procedures', severity: 'G' },
      { tag: 'F868', description: 'Administration of medications', severity: 'H' },
      { tag: 'F656', description: 'Nursing services', severity: 'G' },
      { tag: 'F823', description: 'Resident rights and care', severity: 'E' },
    ],
  },
];

export const mockStaffing = [
  {
    id: '1',
    facility_id: '1',
    rn_staffing: 0.95,
    ln_staffing: 1.23,
    aide_staffing: 1.45,
    staffing_score: 5,
    reporting_period: 'Q1 2026',
  },
  {
    id: '2',
    facility_id: '2',
    rn_staffing: 0.78,
    ln_staffing: 0.98,
    aide_staffing: 1.12,
    staffing_score: 3,
    reporting_period: 'Q1 2026',
  },
  {
    id: '3',
    facility_id: '3',
    rn_staffing: 0.65,
    ln_staffing: 0.85,
    aide_staffing: 0.95,
    staffing_score: 2,
    reporting_period: 'Q1 2026',
  },
];

export const mockQualityMeasures = [
  {
    id: '1',
    facility_id: '1',
    measure_name: 'Residents who received an antipsychotic medication',
    measure_value: 15,
    comparison: 'Better',
    reporting_period: 'Q1 2026',
  },
  {
    id: '2',
    facility_id: '1',
    measure_name: 'Residents assessed and given pneumococcal vaccine',
    measure_value: 88,
    comparison: 'Better',
    reporting_period: 'Q1 2026',
  },
  {
    id: '3',
    facility_id: '1',
    measure_name: 'Residents who have had a catheter inserted',
    measure_value: 22,
    comparison: 'Same',
    reporting_period: 'Q1 2026',
  },
  {
    id: '4',
    facility_id: '2',
    measure_name: 'Residents who received an antipsychotic medication',
    measure_value: 24,
    comparison: 'Worse',
    reporting_period: 'Q1 2026',
  },
  {
    id: '5',
    facility_id: '2',
    measure_name: 'Residents assessed and given pneumococcal vaccine',
    measure_value: 72,
    comparison: 'Worse',
    reporting_period: 'Q1 2026',
  },
];

export const mockAlerts = [
  {
    id: '1',
    facility_id: '1',
    type: 'Rating Change',
    severity: 'low' as const,
    title: 'Health Inspection Rating Updated',
    description: 'Facility 1 health inspection rating improved from 4 to 5 stars',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    resolved: false,
  },
  {
    id: '2',
    facility_id: '2',
    type: 'Deficiency',
    severity: 'medium' as const,
    title: 'New Deficiencies Identified',
    description: 'Facility 2 has 5 new deficiencies from recent health inspection',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    resolved: false,
  },
  {
    id: '3',
    facility_id: '3',
    type: 'Staffing Concern',
    severity: 'high' as const,
    title: 'Low Staffing Ratios',
    description: 'Facility 3 staffing levels below state average for nursing staff',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    resolved: false,
  },
  {
    id: '4',
    facility_id: '1',
    type: 'Compliance',
    severity: 'critical' as const,
    title: 'CMS Compliance Review Required',
    description: 'Facility 1 requires immediate CMS compliance review',
    created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    resolved: false,
  },
  {
    id: '5',
    facility_id: '2',
    type: 'Rating Change',
    severity: 'low' as const,
    title: 'Staffing Rating Improved',
    description: 'Facility 2 staffing rating improved from 2 to 3 stars',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    resolved: true,
  },
];

export const mockCMSSubmissions = [
  {
    id: '1',
    facility_id: '1',
    status: 'ACCEPTED',
    submission_date: '2026-04-15',
    cms_response_date: '2026-04-16',
    message: 'Submission successfully processed and accepted by CMS',
  },
  {
    id: '2',
    facility_id: '2',
    status: 'PENDING',
    submission_date: '2026-05-08',
    cms_response_date: null,
    message: 'Submission is currently being processed by CMS',
  },
  {
    id: '3',
    facility_id: '3',
    status: 'FAILED',
    submission_date: '2026-04-20',
    cms_response_date: '2026-04-20',
    message: 'Validation error: Missing required field "staffing_ratio"',
  },
];

export const mockDashboardStats = {
  totalFacilities: 3,
  averageRating: 4.0,
  facilitiesAboveAverage: 2,
  pendingAlerts: 4,
  resolvedAlerts: 1,
  totalInspections: 3,
  totalDeficiencies: 11,
  complianceRate: 92,
};

export const generateMockReport = (facilityId: string) => {
  const facility = mockFacilities.find((f) => f.id === facilityId);
  const rating = mockRatings.find((r) => r.facility_id === facilityId);
  const inspections = mockInspections.filter((i) => i.facility_id === facilityId);

  return {
    facility,
    rating,
    inspections,
    generatedAt: new Date().toISOString(),
  };
};
