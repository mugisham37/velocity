'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StockEntry } from '@/components/modules/stock';
import { StockEntry as StockEntryType } from '@/types/stock';

export default function StockEntryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const entryId = params.id as string;

  const handleSave = (entry: StockEntryType) => {
    console.log('Stock Entry saved:', entry);
    // Optionally redirect to list or stay on the page
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <StockEntry
      entryName={entryId === 'new' ? undefined : entryId}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}