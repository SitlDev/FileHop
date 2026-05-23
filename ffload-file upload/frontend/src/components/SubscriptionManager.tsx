import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

interface SubscriptionStatus {
  hasSubscription: boolean;
  status?: string;
  subscriptionId?: string;
  amount?: string;
  currency?: string;
  billingPeriod?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

export function SubscriptionManager() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/payments/subscription');
      setSubscription(response.data);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to unlimited downloads.')) {
      return;
    }

    try {
      setCancelling(true);
      await apiClient.post('/api/payments/cancel-subscription');
      toast.success('Subscription cancelled');
      fetchSubscriptionStatus();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-3 bg-gray-200 rounded w-full" />
        </div>
      </div>
    );
  }

  if (!subscription?.hasSubscription) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Upgrade to Pro</h3>
        <p className="text-gray-600 mb-4">
          Get unlimited downloads for just $3.99/month
        </p>
        <a
          href="/download"
          className="inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          View Plans
        </a>
      </div>
    );
  }

  const startDate = subscription.currentPeriodStart 
    ? new Date(subscription.currentPeriodStart).toLocaleDateString()
    : '';
  const endDate = subscription.currentPeriodEnd 
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
    : '';

  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ✨ Pro Subscription Active
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Amount */}
          <div>
            <p className="text-sm text-gray-600">Monthly Payment</p>
            <p className="text-2xl font-bold text-gray-900">
              {subscription.currency} {subscription.amount}
            </p>
          </div>

          {/* Billing Period */}
          <div>
            <p className="text-sm text-gray-600">Billing Period</p>
            <p className="text-lg font-semibold text-gray-900">
              {subscription.billingPeriod}
            </p>
          </div>

          {/* Current Period */}
          <div className="col-span-2">
            <p className="text-sm text-gray-600">Current Period</p>
            <p className="text-sm text-gray-900">
              {startDate} to {endDate}
            </p>
          </div>
        </div>

        {/* Status Message */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
          <p className="text-sm font-medium text-green-800">
            ✓ Your subscription is active and you have unlimited downloads
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleCancelSubscription}
            disabled={cancelling}
            className="w-full px-4 py-2 text-red-600 border border-red-200 font-medium rounded-lg hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Included with Pro</h4>
        <ul className="space-y-2">
          <li className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Unlimited downloads for 30 days
          </li>
          <li className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Priority support
          </li>
          <li className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Cancel anytime
          </li>
        </ul>
      </div>
    </div>
  );
}
