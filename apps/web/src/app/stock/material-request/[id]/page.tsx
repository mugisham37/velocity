'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MaterialRequest } from '@/components/modules/stock';
import { MaterialRequest as MaterialRequestType } from '@/types/stock';

export default function MaterialRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const handleSave = (request: MaterialRequestType) => {
    console.log('Material Request saved:', request);
    // Optionally redirect to list or stay on the page
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <MaterialRequest
      requestName={requestId === 'new' ? undefined : requestId}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}