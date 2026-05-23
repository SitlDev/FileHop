'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';

export default function SuccessPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="mb-6">
            <svg
              className="w-16 h-16 text-green-600 mx-auto animate-bounce"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>

          <p className="text-gray-600 mb-8">
            Thank you for your payment. Your download access is now active.
          </p>

          <div className="space-y-4">
            <Link
              href="/dashboard"
              className="block w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-center"
            >
              Go to Dashboard
            </Link>

            <Link
              href="/upload"
              className="block w-full px-6 py-3 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition text-center"
            >
              Upload Files
            </Link>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Need help? <a href="#" className="text-blue-600 hover:underline">Contact support</a>
          </p>
        </div>
      </div>
    </>
  );
}
