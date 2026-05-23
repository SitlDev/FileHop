'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

interface FailedPayment {
  id: string;
  amount: number;
  amountPaid: number;
  currency: string;
  dueDate: string;
  status: string;
  lastAttemptDate: string | null;
}

interface RetryResult {
  invoiceId: string;
  status: string;
  amount: number;
}

export function PaymentRetryManager() {
  const [failedPayments, setFailedPayments] = useState<FailedPayment[]>([]);
  const [retryResults, setRetryResults] = useState<RetryResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [emailSentTime, setEmailSentTime] = useState<Date | null>(null);

  useEffect(() => {
    fetchFailedPayments();
  }, []);

  const fetchFailedPayments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/payments/failed');
      setFailedPayments(response.data.failedPayments || []);
    } catch (error) {
      console.error('Failed to fetch failed payments:', error);
      // If endpoint doesn't exist or user not authenticated, just show empty state
      setFailedPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayments = async () => {
    try {
      setRetrying(true);
      const response = await apiClient.post('/payments/retry');

      setRetryResults(response.data.invoices || []);
      setShowResults(true);
      setEmailSentTime(new Date());

      if (response.data.retriedCount > 0) {
        toast.success(
          `Successfully retried ${response.data.retriedCount} payment${response.data.retriedCount !== 1 ? 's' : ''}!`
        );
      } else {
        toast.success('No failed payments to retry');
      }

      // Refresh failed payments list
      await fetchFailedPayments();
    } catch (error) {
      console.error('Failed to retry payments:', error);
      toast.error('Failed to retry payments. Please try again.');
    } finally {
      setRetrying(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Payment Recovery</h2>
        <p className="text-sm text-gray-600 mt-1">Retry failed payment attempts</p>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : failedPayments.length > 0 ? (
          <>
            {/* Failed Payments Alert */}
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-red-600 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-red-900">
                    {failedPayments.length} Payment{failedPayments.length !== 1 ? 's' : ''} Failed
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    We've sent you a notification email. Click below to retry these payments.
                  </p>
                </div>
              </div>
            </div>

            {/* Failed Payments Table */}
            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Invoice ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Due Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {failedPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">
                        {payment.id.substring(0, 14)}...
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {formatCurrency(payment.amount - payment.amountPaid, payment.currency)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(payment.dueDate)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                          Failed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Retry Button */}
            <button
              onClick={handleRetryPayments}
              disabled={retrying}
              className="w-full px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {retrying ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Retrying Payments...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 1119.414 4.414l-1.414-1.414A5.002 5.002 0 005.101 5H7a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm9 13a1 1 0 100 2 1 1 0 000-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Retry Failed Payments
                </>
              )}
            </button>
          </>
        ) : showResults && retryResults.length > 0 ? (
          <>
            {/* Successful Retry Results */}
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-green-600 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-green-900">Payments Recovered!</p>
                  <p className="text-sm text-green-700 mt-1">
                    {retryResults.filter((r) => r.status === 'succeeded').length} of{' '}
                    {retryResults.length} payment{retryResults.length !== 1 ? 's' : ''} succeeded.
                  </p>
                </div>
              </div>
            </div>

            {/* Retry Results Table */}
            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Invoice ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {retryResults.map((result) => (
                    <tr key={result.invoiceId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">
                        {result.invoiceId.substring(0, 14)}...
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                            result.status === 'succeeded'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {result.status === 'succeeded' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {result.status === 'succeeded' ? 'Payment successful' : 'Awaiting payment'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Email Notification Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2.5 3A1.5 1.5 0 001 4.5v.006c0 .001 0 .001 0 .006v11A1.5 1.5 0 002.5 17h15a1.5 1.5 0 001.5-1.5v-11a1.5 1.5 0 00-1.5-1.5h-15zm15 2.5v9H2.5v-9h15z" />
                </svg>
                <div style={{ flex: 1 }}>
                  <p className="text-sm font-semibold text-blue-900">Email Notification Sent</p>
                  <p className="text-sm text-blue-700 mt-1">
                    We've sent you a confirmation email with the payment retry results.
                  </p>
                  {emailSentTime && (
                    <p className="text-xs text-blue-600 mt-2">
                      📧 Sent at {emailSentTime.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </p>
                  )}
                  <p className="text-xs text-blue-600 mt-2">
                    Check your inbox and spam folder. If you don't receive it within a few minutes, please <a href="mailto:support@filehop.dev" style={{ color: '#0284c7', textDecoration: 'underline' }}>contact support</a>.
                  </p>
                </div>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => {
                setShowResults(false);
                setRetryResults([]);
                fetchFailedPayments();
              }}
              className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Check Payment Status Again
            </button>
          </>
        ) : (
          <>
            {/* All Payments Current */}
            <div className="flex flex-col items-center justify-center h-24">
              <svg
                className="w-12 h-12 text-green-600 mb-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm font-semibold text-gray-900">All Payments Up to Date</p>
              <p className="text-xs text-gray-600 mt-1">No failed payments detected</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
