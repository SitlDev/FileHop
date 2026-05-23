'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Navigation } from '@/components/Navigation';
import { SubscriptionManager } from '@/components/SubscriptionManager';
import { PaymentMethodManager } from '@/components/PaymentMethodManager';
import { PaymentRetryManager } from '@/components/PaymentRetryManager';
import toast from 'react-hot-toast';

interface Payment {
  id: string;
  stripeId: string;
  amount: string;
  currency: string;
  type: string;
  status: string;
  date: string;
  createdAt: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  pages: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ total: 0, page: 1, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchPaymentHistory();
  }, [currentPage]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/payments/history?page=${currentPage}&limit=10`);
      setPayments(response.data.payments);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'One-time') {
      return '💳';
    } else if (type === 'Subscription') {
      return '📅';
    }
    return '💰';
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Billing & Payments</h1>
            <p className="text-gray-600">Manage your subscription and view payment history</p>
          </div>

          {/* Two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Subscription and Payment Method section (left, spans 1 column on mobile, 2 on desktop) */}
            <div className="lg:col-span-1 space-y-6">
              <SubscriptionManager />
              <PaymentMethodManager />
              <PaymentRetryManager />
            </div>

            {/* Payment history (right, spans full on mobile, 1 column on desktop) */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {pagination.total} transaction{pagination.total !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Table */}
                {loading ? (
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                  </div>
                ) : payments.length === 0 ? (
                  <div className="p-6 text-center">
                    <svg
                      className="w-12 h-12 text-gray-400 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-gray-600">No payments yet</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Invoice ID</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((payment) => (
                            <tr
                              key={payment.id}
                              className="border-b border-gray-200 hover:bg-gray-50 transition"
                            >
                              <td className="px-6 py-4 text-sm text-gray-900">{payment.date}</td>
                              <td className="px-6 py-4 text-sm">
                                <span className="flex items-center gap-2">
                                  <span>{getTypeIcon(payment.type)}</span>
                                  {payment.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                {payment.currency} {payment.amount}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(payment.status)}`}>
                                  {payment.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 font-mono text-xs">
                                <code className="bg-gray-100 px-2 py-1 rounded">
                                  {payment.stripeId.substring(0, 16)}...
                                </code>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Page {pagination.page} of {pagination.pages}
                        </div>
                        <div className="space-x-2">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                            disabled={currentPage === pagination.pages}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Help section */}
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Need help?</h3>
                <p className="text-sm text-blue-700 mb-4">
                  For invoice details or billing questions, please contact our support team.
                </p>
                <a
                  href="mailto:support@filehop.com"
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Contact Support →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
