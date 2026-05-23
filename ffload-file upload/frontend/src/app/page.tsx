'use client';

import React from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Hero section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Share Large Files <span className="text-blue-600">Securely</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Upload up to 2GB of files. Auto-delete after 15 days. Share via link or QR code.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/upload"
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Start Uploading
              </Link>
              {!isAuthenticated && (
                <Link
                  href="/signup"
                  className="px-8 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition"
                >
                  Create Free Account
                </Link>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">2GB</div>
              <p className="text-gray-600">Free Storage Per User</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">15 Days</div>
              <p className="text-gray-600">Automatic Expiration</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">256-bit</div>
              <p className="text-gray-600">AES Encryption</p>
            </div>
          </div>
        </div>

        {/* Features section */}
        <div id="features" className="bg-white py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-gray-900 text-center mb-16">
              Why Choose FileHop?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: '🚀',
                  title: 'Lightning Fast',
                  description: 'Direct S3 upload. No server bottlenecks. Upload speeds up to 100MB/s.',
                },
                {
                  icon: '🔐',
                  title: 'Secure & Private',
                  description: 'AES-256 encryption, signed URLs, and HTTPS. Your files are protected.',
                },
                {
                  icon: '📱',
                  title: 'Easy Sharing',
                  description: 'Share via QR code, email, or shareable link. Track downloads in real-time.',
                },
                {
                  icon: '💰',
                  title: 'Flexible Pricing',
                  description: '$1.99 per download or $3.99/month unlimited. No hidden fees.',
                },
                {
                  icon: '⏱️',
                  title: 'Auto Expiration',
                  description: 'Files automatically delete after 15 days. No manual cleanup needed.',
                },
                {
                  icon: '📊',
                  title: 'Analytics',
                  description: 'See who downloaded your files and when. Track engagement metrics.',
                },
              ].map((feature, i) => (
                <div key={i} className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing section */}
        <div id="pricing" className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-gray-900 text-center mb-16">
              Simple, Transparent Pricing
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Pay Per Download</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-blue-600">$1.99</span>
                  <span className="text-gray-600">/download</span>
                </div>
                <ul className="space-y-3 text-gray-600 mb-8">
                  <li>✓ 2GB free storage</li>
                  <li>✓ 15-day file retention</li>
                  <li>✓ Shareable links & QR codes</li>
                  <li>✓ Download tracking</li>
                </ul>
                <button className="w-full px-4 py-2 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50">
                  Get Started
                </button>
              </div>

              <div className="bg-blue-600 text-white rounded-lg shadow-lg p-8 transform scale-105">
                <div className="absolute top-0 right-0 bg-orange-500 text-white px-4 py-2 rounded-bl-lg rounded-tr-lg text-sm font-bold">
                  POPULAR
                </div>
                <h3 className="text-2xl font-bold mb-4">Pro Subscription</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold">$3.99</span>
                  <span className="text-blue-200">/month</span>
                </div>
                <ul className="space-y-3 text-blue-100 mb-8">
                  <li>✓ All Free features</li>
                  <li>✓ Unlimited downloads</li>
                  <li>✓ Priority support</li>
                  <li>✓ Advanced analytics</li>
                </ul>
                <button className="w-full px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50">
                  Subscribe Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA section */}
        <div className="bg-blue-600 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Share your first file today. No credit card required.
            </p>
            <Link
              href="/upload"
              className="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50"
            >
              Upload Now
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
