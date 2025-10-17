'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LeadList, LeadForm, LeadConversionModal } from '@/components/modules/crm';
import { Lead, LeadFormData } from '@/types/crm';

const LeadsPage: React.FC = () => {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateNew = () => {
    setSelectedLead(null);
    setShowForm(true);
  };

  const handleEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setShowForm(true);
  };

  const handleView = (lead: Lead) => {
    router.push(`/crm/leads/${lead.name}`);
  };

  const handleConvert = (lead: Lead) => {
    setSelectedLead(lead);
    setShowConversionModal(true);
  };

  const handleSubmit = async (data: LeadFormData) => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to save lead
      console.log('Saving lead:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowForm(false);
      setSelectedLead(null);
    } catch (error) {
      console.error('Error saving lead:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversion = async (conversionData: any) => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to convert lead
      console.log('Converting lead:', conversionData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowConversionModal(false);
      setSelectedLead(null);
    } catch (error) {
      console.error('Error converting lead:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedLead(null);
  };

  const handleCloseConversion = () => {
    setShowConversionModal(false);
    setSelectedLead(null);
  };

  if (showForm) {
    return (
      <LeadForm
        lead={selectedLead || undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    );
  }

  return (
    <>
      <LeadList
        onCreateNew={handleCreateNew}
        onView={handleView}
        onEdit={handleEdit}
        onConvert={handleConvert}
      />
      
      {showConversionModal && selectedLead && (
        <LeadConversionModal
          lead={selectedLead}
          onClose={handleCloseConversion}
          onConvert={handleConversion}
          isLoading={isLoading}
        />
      )}
    </>
  );
};

export default LeadsPage;