'use client';

import React from 'react';
import { Dashboard } from '@/components/Dashboard';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Navigation />
      <Dashboard />
    </>
  );
}
