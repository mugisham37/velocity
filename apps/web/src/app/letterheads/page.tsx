'use client';

import React from 'react';
import { LetterheadManager } from '@/components/print';

export default function LetterheadsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <LetterheadManager mode="list" />
    </div>
  );
}