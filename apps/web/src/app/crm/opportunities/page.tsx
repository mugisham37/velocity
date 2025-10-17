'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OpportunityList, OpportunityForm } from '@/components/modules/crm';
import { Opportunity, OpportunityFormData } from '@/types/crm';

const OpportunitiesPage: React.FC = () => {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateNew = () => {
    setSelectedOpportunity(null);
    setShowForm(true);
  };

  const handleEdit = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowForm(true);
  };

  const handleView = (opportunity: Opportunity) => {
    router.push(`/crm/opportunities/${opportunity.name}`);
  };

  const handleConvert = (opportunity: Opportunity) => {
    // TODO: Implement conversion to quotation
    console.log('Converting opportunity to quotation:', opportunity);
  };

  const handleSubmit = async (data: OpportunityFormData) => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to save opportunity
      console.log('Saving opportunity:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowForm(false);
      setSelectedOpportunity(null);
    } catch (error) {
      console.error('Error saving opportunity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedOpportunity(null);
  };

  if (showForm) {
    return (
      <OpportunityForm
        opportunity={selectedOpportunity || undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    );
  }

  return (
    <OpportunityList
      onCreateNew={handleCreateNew}
      onView={handleView}
      onEdit={handleEdit}
      onConvert={handleConvert}
    />
  );
};

export default OpportunitiesPage;