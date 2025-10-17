'use client';

import React from 'react';
import { CustomerPortal } from '@/components/modules/crm';

const CustomerPortalPage: React.FC = () => {
  // In a real implementation, this would come from authentication context
  const customerId = 'CUST-001';
  const customerName = 'Acme Corporation';

  return (
    <CustomerPortal
      customerId={customerId}
      customerName={customerName}
    />
  );
};

export default CustomerPortalPage;