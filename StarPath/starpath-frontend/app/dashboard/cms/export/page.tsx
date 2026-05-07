'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { API_URL } from '@/lib/api-config';

interface Facility {
  id: string;
  name: string;
  cms_provider_id: string;
  city: string;
  state: string;
}

interface ValidationResult {
  is_valid: boolean;
  total_errors: number;
  total_warnings: number;
  errors: Array<{ field: string; message: string; severity: string }>;
  warnings: Array<{ field: string; message: string; severity: string }>;
  can_submit: boolean;
}

interface ExportResult {
  facility_id: string;
  format: string;
  data?: string;
  error?: string;
}

export default function ExportPage() {
  const { user, token } = useAuth();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'json' | 'xml'>('json');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [exportData, setExportData] = useState<ExportResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFacilities();
  }, [token]);

  const fetchFacilities = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/v1/facilities`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFacilities(data.facilities || []);
      }
    } catch (err) {
      console.error('Failed to load facilities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!selectedFacility || !token) return;

    try {
      setValidating(true);
      const response = await fetch(
        `${API_URL}/api/v1/cms/validate/${selectedFacility}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setValidation(data);
      } else {
        alert('Validation failed');
      }
    } catch (err) {
      console.error('Validation error:', err);
      alert('Error validating data');
    } finally {
      setValidating(false);
    }
  };

  const handleExport = async () => {
    if (!selectedFacility || !token) return;

    try {
      setExporting(true);
      const response = await fetch(
        `${API_URL}/api/v1/cms/export/${selectedFacility}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ format: exportFormat }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setExportData({
          facility_id: selectedFacility,
          format: exportFormat,
          data: data.data,
        });
      } else {
        alert('Export failed');
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('Error exporting data');
    } finally {
      setExporting(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFacility || !token || !validation?.can_submit) return;

    try {
      setSubmitting(true);
      const response = await fetch(
        `${API_URL}/api/v1/cms/submit/${selectedFacility}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            submission_type: 'facility_data',
            include_inspection_history: true,
            years_of_data: 3,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        alert(`Submission created successfully!\nSubmission ID: ${data.submission_id}`);
        setValidation(null);
        setExportData(null);
      } else {
        alert('Submission failed');
      }
    } catch (err) {
      console.error('Submission error:', err);
      alert('Error submitting data');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadExport = () => {
    if (!exportData?.data) return;

    const element = document.createElement('a');
    const file = new Blob([exportData.data], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `facility-export-${selectedFacility.slice(0, 8)}.${exportFormat}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Please log in to export data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Export Facility Data</h1>
          <p className="text-gray-600 mt-2">Export, validate, and submit facility data to CMS</p>
        </div>
        <Link href="/dashboard/cms">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to CMS
          </button>
        </Link>
      </div>

      {/* Facility Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Select Facility</label>
        <select
          value={selectedFacility}
          onChange={(e) => {
            setSelectedFacility(e.target.value);
            setValidation(null);
            setExportData(null);
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">-- Choose a facility --</option>
          {facilities.map((facility) => (
            <option key={facility.id} value={facility.id}>
              {facility.name} ({facility.cms_provider_id}) - {facility.city}, {facility.state}
            </option>
          ))}
        </select>
      </div>

      {selectedFacility && (
        <>
          {/* Step 1: Validate */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Step 1: Validate Data</h2>
                <p className="text-sm text-gray-600 mt-1">Check if data meets CMS requirements</p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {validation ? (validation.can_submit ? '✓ Valid' : '✗ Invalid') : '⏳ Pending'}
              </span>
            </div>

            {validation && (
              <div className="mb-4 space-y-3">
                {validation.total_errors > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="font-medium text-red-900 mb-2">Errors ({validation.total_errors})</p>
                    <ul className="space-y-1">
                      {validation.errors.map((err, idx) => (
                        <li key={idx} className="text-sm text-red-800">
                          <span className="font-medium">{err.field}:</span> {err.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {validation.total_warnings > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="font-medium text-yellow-900 mb-2">Warnings ({validation.total_warnings})</p>
                    <ul className="space-y-1">
                      {validation.warnings.map((warn, idx) => (
                        <li key={idx} className="text-sm text-yellow-800">
                          <span className="font-medium">{warn.field}:</span> {warn.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {validation.can_submit && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">✓ Data is valid and ready for submission</p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleValidate}
              disabled={validating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {validating ? 'Validating...' : 'Validate Data'}
            </button>
          </div>

          {/* Step 2: Export */}
          {validation && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Step 2: Export Data</h2>
                  <p className="text-sm text-gray-600 mt-1">Generate CMS-compliant export file</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {exportData ? '✓ Exported' : '⏳ Pending'}
                </span>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                <div className="flex gap-4">
                  {(['json', 'xml'] as const).map((format) => (
                    <label key={format} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="format"
                        value={format}
                        checked={exportFormat === format}
                        onChange={(e) => setExportFormat(e.target.value as 'json' | 'xml')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700 font-medium">{format.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleExport}
                disabled={exporting}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
              >
                {exporting ? 'Exporting...' : 'Export Data'}
              </button>

              {exportData && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-3">Export preview (first 500 chars):</p>
                  <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-auto max-h-48 text-gray-800">
                    {exportData.data?.substring(0, 500)}...
                  </pre>
                  <button
                    onClick={downloadExport}
                    className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    Download Export
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Submit */}
          {validation?.can_submit && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Step 3: Submit to CMS</h2>
                  <p className="text-sm text-gray-600 mt-1">Send validated data to CMS</p>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {submitting ? 'Submitting...' : 'Submit to CMS'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
