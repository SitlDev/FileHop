'use client';

import React from 'react';
import { LoginForm } from '@/components/AuthForms';
import { Navigation } from '@/components/Navigation';

export default function LoginPage() {
  return (
    <>
      <Navigation />
      <LoginForm />
    </>
  );
}
