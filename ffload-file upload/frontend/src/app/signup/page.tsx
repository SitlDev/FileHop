'use client';

import React from 'react';
import { SignupForm } from '@/components/AuthForms';
import { Navigation } from '@/components/Navigation';

export default function SignupPage() {
  return (
    <>
      <Navigation />
      <SignupForm />
    </>
  );
}
