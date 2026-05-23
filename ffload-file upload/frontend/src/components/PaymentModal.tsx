import React, { useEffect, useState } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLIC_KEY, API_BASE_URL } from '@/lib/constants';
import toast from 'react-hot-toast';

interface PaymentFormProps {
  paymentType: 'one_time' | 'subscription';
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentForm({
  paymentType,
  clientSecret,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error('Payment service unavailable');
      return;
    }

    setLoading(true);

    try {
      const result = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/success`,
        },
        redirect: 'if_required',
      });

      const { error, paymentIntent } = result;

      if (error) {
        toast.error(error.message || 'Payment failed');
      } else if (paymentIntent?.status === 'succeeded') {
        // Send confirmation to backend
        const token = localStorage.getItem('authToken');
        const confirmData = paymentType === 'subscription' 
          ? { subscriptionId: paymentIntent?.id || '' }
          : { paymentIntentId: paymentIntent?.id || '' };

        try {
          await fetch(`${API_BASE_URL}/api/payments/confirm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(confirmData),
          });
        } catch (err) {
          console.error('Failed to confirm payment on backend:', err);
        }

        toast.success('Payment successful!');
        onSuccess();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Complete Payment'}
        </button>
      </div>
    </form>
  );
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [paymentType, setPaymentType] = useState<'one_time' | 'subscription'>('one_time');
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);

  useEffect(() => {
    setStripePromise(loadStripe(STRIPE_PUBLIC_KEY));
  }, []);

  const handleSelectPaymentType = async (type: 'one_time' | 'subscription') => {
    setPaymentType(type);
    setClientSecret(null);

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Please log in to continue');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/payments/intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentType: type }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to create payment');
        return;
      }

      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Unlock Downloads</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {!clientSecret ? (
          <>
            {/* Payment Type Selection */}
            <div className="space-y-4 mb-6">
              {/* One-time payment */}
              <button
                onClick={() => handleSelectPaymentType('one_time')}
                disabled={loading}
                className="w-full flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-blue-500 transition disabled:opacity-50"
                style={{
                  borderColor: paymentType === 'one_time' ? '#3b82f6' : '#e5e7eb',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentType === 'one_time'}
                  onChange={() => {}}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="ml-4 flex-1 text-left">
                  <p className="font-semibold text-gray-900">One-time Payment</p>
                  <p className="text-sm text-gray-500">Pay $1.99 per download</p>
                </div>
                <span className="text-2xl font-bold text-gray-900">$1.99</span>
              </button>

              {/* Subscription */}
              <button
                onClick={() => handleSelectPaymentType('subscription')}
                disabled={loading}
                className="w-full flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-blue-500 transition disabled:opacity-50"
                style={{
                  borderColor: paymentType === 'subscription' ? '#3b82f6' : '#e5e7eb',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentType === 'subscription'}
                  onChange={() => {}}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="ml-4 flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">Monthly Subscription</p>
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                      BEST VALUE
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Unlimited downloads for 30 days</p>
                </div>
                <span className="text-2xl font-bold text-gray-900">$3.99</span>
              </button>
            </div>

            {/* Security Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                💳 Powered by <strong>Stripe</strong> - Your payment is secure and encrypted
              </p>
            </div>
          </>
        ) : stripePromise ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
              },
            }}
          >
            <PaymentForm
              paymentType={paymentType}
              clientSecret={clientSecret}
              onSuccess={handlePaymentSuccess}
              onCancel={() => {
                setClientSecret(null);
              }}
            />
          </Elements>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500">Loading payment form...</p>
          </div>
        )}
      </div>
    </div>
  );
}
