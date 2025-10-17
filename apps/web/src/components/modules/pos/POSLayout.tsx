'use client';

import React from 'react';

interface POSLayoutProps {
  children: React.ReactNode;
}

export function POSLayout({ children }: POSLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {children}
    </div>
  );
}