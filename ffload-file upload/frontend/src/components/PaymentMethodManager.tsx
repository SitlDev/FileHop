'use client';

import React, { useEffect, useState } from 'react';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLIC_KEY, API_BASE_URL } from '@/lib/constants';
import toast from 'react-hot-toast';

interface PaymentMethodFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentMethodForm({ onSuccess, onCancel }: PaymentMethodFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [intent, setIntent] = useState<{ clientSecret: string; setupIntentId: string } | null>(null);

  // Create SetupIntent on mount
  useEffect(() => {
    const createSetupIntent = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          toast.error('Please log in to update payment method');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/payments/payment-method/intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to create setup intent');
        }

        const data = await response.json();
        setIntent(data);
      } catch (error) {
        console.error('Failed to create setup intent:', error);
        toast.error('Failed to prepare payment method update');
      }
    };

    createSetupIntent();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !intent) {
      toast.error('Payment service unavailable');
      return;
    }

    setLoading(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment method from card element
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        toast.error(error.message || 'Failed to create payment method');
        setLoading(false);
        return;
      }

      if (!paymentMethod) {
        toast.error('Failed to create payment method');
        setLoading(false);
        return;
      }

      // Confirm the payment method
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication lost');
        setLoading(false);
        return;
      }

      const confirmResponse = await fetch(`${API_BASE_URL}/api/payments/payment-method/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          setupIntentId: intent.setupIntentId,
          paymentMethodId: paymentMethod.id,
        }),
      });

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json();
        throw new Error(errorData.message || 'Failed to confirm payment method');
      }

      toast.success('Payment method updated successfully!');
      cardElement.clear();
      onSuccess();
    } catch (error) {
      console.error('Payment method update error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update payment method');
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <CardElement options={cardElementOptions} />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Updating...' : 'Update Payment Method'}
        </button>
      </div>
    </form>
  );
}

interface PaymentMethodManagerProps {
  onSuccess?: () => void;
}

export function PaymentMethodManager({ onSuccess }: PaymentMethodManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stripePromise, setStripePromise] = useState<any>(null);

  useEffect(() => {
    setStripePromise(loadStripe(STRIPE_PUBLIC_KEY));
  }, []);

  const handleSuccess = () => {
    setIsOpen(false);
    onSuccess?.();
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
        <p className="text-sm text-gray-600 mt-1">Update your credit card</p>
      </div>

      {/* Content */}
      <div className="p-6">
        {!isOpen ? (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Keep your payment method up to date for uninterrupted service.
            </p>
            <button
              onClick={() => setIsOpen(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Add or Update Payment Method
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Enter your card details to update your payment method.
            </p>
            {stripePromise && (
              <Elements stripe={stripePromise}>
                <PaymentMethodForm
                  onSuccess={handleSuccess}
                  onCancel={() => setIsOpen(false)}
                />
              </Elements>
            )}
          </>
        )}
      </div>
    </div>
  );
}
