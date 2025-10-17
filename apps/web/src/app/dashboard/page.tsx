'use client';

import React from 'react';
import { Dashboard } from '@/components/dashboard';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Dashboard dashboardName="default" />
    </div>
  );
}