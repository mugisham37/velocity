'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CustomerList, CustomerForm } from '@/components/modules/crm';
import { Customer, CustomerFormData } from '@/types/crm';

const CustomersPage: React.FC = () => {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateNew = () => {
    setSelectedCustomer(null);
    setShowForm(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowForm(true);
  };

  const handleView = (customer: Customer) => {
    router.push(`/crm/customers/${customer.name}`);
  };

  const handleSubmit = async (data: CustomerFormData) => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to save customer
      console.log('Saving customer:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowForm(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Error saving customer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedCustomer(null);
  };

  if (showForm) {
    return (
      <CustomerForm
        customer={selectedCustomer || undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    );
  }

  return (
    <CustomerList
      onCreateNew={handleCreateNew}
      onView={handleView}
      onEdit={handleEdit}
    />
  );
};

export default CustomersPage;