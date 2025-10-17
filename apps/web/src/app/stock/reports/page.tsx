'use client';

import React from 'react';
import { StockReports } from '@/components/modules/stock';

export default function StockReportsPage() {
  const handleReportSelect = (reportType: string, data: unknown) => {
    console.log('Report selected:', reportType, data);
    // Handle report selection, e.g., export, print, etc.
  };

  return (
    <StockReports onReportSelect={handleReportSelect} />
  );
}