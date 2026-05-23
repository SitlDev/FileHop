'use client';

import React from 'react';
import { UploadPage } from '@/components/UploadPage';
import { Navigation } from '@/components/Navigation';
import { useRouter } from 'next/navigation';

export default function Upload() {
  const router = useRouter();

  const handleUploadSuccess = (uploadId: string) => {
    router.push(`/download/${uploadId}`);
  };

  return (
    <>
      <Navigation />
      <UploadPage onSuccess={handleUploadSuccess} />
    </>
  );
}
