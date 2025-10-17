'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { DynamicForm } from '@/components/forms';
import { Opportunity, OpportunityFormData } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface OpportunityFormProps {
  opportunity?: Opportunity;
  onSubmit: (data: OpportunityFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  leadName?: string; // For conversion from lead
}

const OpportunityForm: React.FC<OpportunityFormProps> = ({
  opportunity,
  onSubmit,
  onCancel,
  isLoading = false,
  leadName
}) => {
  const form = useForm<OpportunityFormData>({
    defaultValues: opportunity ? {
      opportunity_from: opportunity.opportunity_from,
      party_name: opportunity.party_name,
      customer_name: opportunity.customer_name,
      opportunity_type: opportunity.opportunity_type,
      source: opportunity.source,
      status: opportunity.status,
      sales_stage: opportunity.sales_stage,
      opportunity_amount: opportunity.opportunity_amount,
      probability: opportunity.probability,
      currency: opportunity.currency,
      expected_closing: opportunity.expected_closing,
      contact_person: opportunity.contact_person,
      contact_email: opportunity.contact_email,
      contact_mobile: opportunity.contact_mobile,
      territory: opportunity.territory,
      notes: opportunity.notes,
      next_contact_by: opportunity.next_contact_by,
      next_contact_date: opportunity.next_contact_date
    } : {
      opportunity_from: leadName ? 'Lead' : 'Customer',
      party_name: leadName || '',
      opportunity_type: 'Sales',
      status: 'Open',
      currency: 'USD',
      probability: 50
    }
  });

  const opportunityFormSchema = {
    name: 'Opportunity',
    fields: [
      // Basic Information Section
      {
        fieldname: 'title',
        fieldtype: 'Data',
        label: 'Title',
        section_break: 1,
        section_label: 'Basic Information'
      },
      {
        fieldname: 'opportunity_from',
        fieldtype: 'Select',
        label: 'Opportunity From',
        options: 'Lead\nCustomer\nProspect',
        reqd: 1
      },
      {
        fieldname: 'party_name',
        fieldtype: 'Dynamic Link',
        label: 'Party Name',
        options: 'opportunity_from',
        reqd: 1
      },
      {
        fieldname: 'customer_name',
        fieldtype: 'Data',
        label: 'Customer Name',
        read_only: 1,
        depends_on: 'party_name'
      },
      
      // Opportunity Details Section
      {
        fieldname: 'opportunity_type',
        fieldtype: 'Select',
        label: 'Opportunity Type',
        options: 'Sales\nSupport\nMaintenance',
        reqd: 1,
        section_break: 1,
        section_label: 'Opportunity Details'
      },
      {
        fieldname: 'source',
        fieldtype: 'Link',
        label: 'Source',
        options: 'Lead Source'
      },
      {
        fieldname: 'status',
        fieldtype: 'Select',
        label: 'Status',
        options: 'Open\nQuotation\nReply\nClosed\nLost\nConverted',
        reqd: 1
      },
      {
        fieldname: 'sales_stage',
        fieldtype: 'Link',
        label: 'Sales Stage',
        options: 'Sales Stage'
      },
      
      // Financial Information Section
      {
        fieldname: 'opportunity_amount',
        fieldtype: 'Currency',
        label: 'Opportunity Amount',
        section_break: 1,
        section_label: 'Financial Information'
      },
      {
        fieldname: 'probability',
        fieldtype: 'Percent',
        label: 'Probability (%)',
        description: 'Probability of closing this opportunity'
      },
      {
        fieldname: 'currency',
        fieldtype: 'Link',
        label: 'Currency',
        options: 'Currency',
        reqd: 1
      },
      
      // Dates Section
      {
        fieldname: 'transaction_date',
        fieldtype: 'Date',
        label: 'Transaction Date',
        reqd: 1,
        section_break: 1,
        section_label: 'Dates'
      },
      {
        fieldname: 'expected_closing',
        fieldtype: 'Date',
        label: 'Expected Closing Date'
      },
      
      // Contact Information Section
      {
        fieldname: 'contact_person',
        fieldtype: 'Link',
        label: 'Contact Person',
        options: 'Contact',
        section_break: 1,
        section_label: 'Contact Information'
      },
      {
        fieldname: 'contact_email',
        fieldtype: 'Data',
        label: 'Contact Email'
      },
      {
        fieldname: 'contact_mobile',
        fieldtype: 'Data',
        label: 'Contact Mobile'
      },
      {
        fieldname: 'territory',
        fieldtype: 'Link',
        label: 'Territory',
        options: 'Territory'
      },
      
      // Company Information Section
      {
        fieldname: 'company',
        fieldtype: 'Link',
        label: 'Company',
        options: 'Company',
        reqd: 1,
        section_break: 1,
        section_label: 'Company Information'
      },
      
      // Follow-up Section
      {
        fieldname: 'next_contact_by',
        fieldtype: 'Link',
        label: 'Next Contact By',
        options: 'User',
        section_break: 1,
        section_label: 'Follow-up'
      },
      {
        fieldname: 'next_contact_date',
        fieldtype: 'Date',
        label: 'Next Contact Date'
      },
      
      // Additional Information Section
      {
        fieldname: 'notes',
        fieldtype: 'Text Editor',
        label: 'Notes',
        section_break: 1,
        section_label: 'Additional Information'
      }
    ]
  };

  const handleSubmit = (data: OpportunityFormData) => {
    onSubmit(data);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          {opportunity ? `Edit Opportunity: ${opportunity.name}` : 'New Opportunity'}
        </h2>
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            form="opportunity-form"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : opportunity ? 'Update Opportunity' : 'Create Opportunity'}
          </Button>
        </div>
      </div>

      <DynamicForm
        id="opportunity-form"
        schema={opportunityFormSchema}
        form={form}
        onSubmit={handleSubmit}
        className="space-y-6"
      />
    </Card>
  );
};

export default OpportunityForm;