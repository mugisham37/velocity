'use client';

import React from 'react';
import { ReportBuilder } from '@/components/reports/ReportBuilder';
import { ReportDefinition } from '@/types/reports';
import { useNotifications } from '@/hooks/useNotifications';
import { useRouter } from 'next/navigation';

export default function ReportsPage() {
  const { showNotification } = useNotifications();
  const router = useRouter();

  const handleSave = (report: ReportDefinition) => {
    // In a real implementation, this would save to the backend
    console.log('Saving report:', report);
    
    showNotification(`Report "${report.title}" has been saved successfully`, 'success');

    // Navigate back to reports list (when implemented)
    // router.push('/reports/list');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="h-screen">
      <ReportBuilder
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}