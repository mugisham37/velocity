'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ItemMaster } from '@/components/modules/stock';
import { Item } from '@/types/stock';

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;

  const handleSave = (item: Item) => {
    console.log('Item saved:', item);
    // Optionally redirect to list or stay on the page
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ItemMaster
      itemName={itemId === 'new' ? undefined : itemId}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}