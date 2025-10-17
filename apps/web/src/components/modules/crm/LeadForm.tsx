'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { DynamicForm } from '@/components/forms';
import { Lead, LeadFormData } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface LeadFormProps {
  lead?: Lead;
  onSubmit: (data: LeadFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const LeadForm: React.FC<LeadFormProps> = ({
  lead,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const form = useForm<LeadFormData>({
    defaultValues: lead ? {
      lead_name: lead.lead_name,
      organization_lead: lead.organization_lead,
      company_name: lead.company_name,
      email_id: lead.email_id,
      phone: lead.phone,
      mobile_no: lead.mobile_no,
      website: lead.website,
      address_line1: lead.address_line1,
      address_line2: lead.address_line2,
      city: lead.city,
      state: lead.state,
      country: lead.country,
      pincode: lead.pincode,
      status: lead.status,
      source: lead.source,
      lead_type: lead.lead_type,
      market_segment: lead.market_segment,
      industry: lead.industry,
      qualification_status: lead.qualification_status,
      lead_owner: lead.lead_owner,
      territory: lead.territory,
      annual_revenue: lead.annual_revenue,
      no_of_employees: lead.no_of_employees,
      request_type: lead.request_type,
      notes: lead.notes
    } : {
      status: 'Open',
      lead_type: 'Client',
      organization_lead: false
    }
  });

  const leadFormSchema = {
    name: 'Lead',
    fields: [
      // Basic Information Section
      {
        fieldname: 'lead_name',
        fieldtype: 'Data',
        label: 'Lead Name',
        reqd: 1,
        section_break: 1,
        section_label: 'Basic Information'
      },
      {
        fieldname: 'organization_lead',
        fieldtype: 'Check',
        label: 'Organization Lead',
        description: 'Check if this is an organization/company lead'
      },
      {
        fieldname: 'company_name',
        fieldtype: 'Data',
        label: 'Company Name',
        depends_on: 'organization_lead'
      },
      
      // Contact Information Section
      {
        fieldname: 'email_id',
        fieldtype: 'Data',
        label: 'Email ID',
        section_break: 1,
        section_label: 'Contact Information'
      },
      {
        fieldname: 'phone',
        fieldtype: 'Data',
        label: 'Phone'
      },
      {
        fieldname: 'mobile_no',
        fieldtype: 'Data',
        label: 'Mobile No'
      },
      {
        fieldname: 'website',
        fieldtype: 'Data',
        label: 'Website'
      },
      
      // Address Information Section
      {
        fieldname: 'address_line1',
        fieldtype: 'Data',
        label: 'Address Line 1',
        section_break: 1,
        section_label: 'Address Information'
      },
      {
        fieldname: 'address_line2',
        fieldtype: 'Data',
        label: 'Address Line 2'
      },
      {
        fieldname: 'city',
        fieldtype: 'Data',
        label: 'City'
      },
      {
        fieldname: 'state',
        fieldtype: 'Data',
        label: 'State'
      },
      {
        fieldname: 'country',
        fieldtype: 'Link',
        label: 'Country',
        options: 'Country'
      },
      {
        fieldname: 'pincode',
        fieldtype: 'Data',
        label: 'Pincode'
      },
      
      // Lead Details Section
      {
        fieldname: 'status',
        fieldtype: 'Select',
        label: 'Status',
        options: 'Open\nReplied\nOpportunity\nQuotation\nLost Quotation\nInterested\nConverted\nDo Not Contact',
        reqd: 1,
        section_break: 1,
        section_label: 'Lead Details'
      },
      {
        fieldname: 'source',
        fieldtype: 'Link',
        label: 'Source',
        options: 'Lead Source',
        reqd: 1
      },
      {
        fieldname: 'lead_type',
        fieldtype: 'Select',
        label: 'Lead Type',
        options: 'Client\nChannel Partner\nConsultant',
        reqd: 1
      },
      {
        fieldname: 'market_segment',
        fieldtype: 'Link',
        label: 'Market Segment',
        options: 'Market Segment'
      },
      {
        fieldname: 'industry',
        fieldtype: 'Link',
        label: 'Industry',
        options: 'Industry Type'
      },
      
      // Qualification Section
      {
        fieldname: 'qualification_status',
        fieldtype: 'Select',
        label: 'Qualification Status',
        options: 'Unqualified\nIn Process\nQualified',
        section_break: 1,
        section_label: 'Qualification'
      },
      {
        fieldname: 'lead_owner',
        fieldtype: 'Link',
        label: 'Lead Owner',
        options: 'User'
      },
      {
        fieldname: 'territory',
        fieldtype: 'Link',
        label: 'Territory',
        options: 'Territory'
      },
      
      // Additional Information Section
      {
        fieldname: 'annual_revenue',
        fieldtype: 'Currency',
        label: 'Annual Revenue',
        section_break: 1,
        section_label: 'Additional Information'
      },
      {
        fieldname: 'no_of_employees',
        fieldtype: 'Int',
        label: 'No of Employees'
      },
      {
        fieldname: 'request_type',
        fieldtype: 'Data',
        label: 'Request Type'
      },
      {
        fieldname: 'notes',
        fieldtype: 'Text Editor',
        label: 'Notes'
      }
    ]
  };

  const handleSubmit = (data: LeadFormData) => {
    onSubmit(data);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          {lead ? `Edit Lead: ${lead.lead_name}` : 'New Lead'}
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
            form="lead-form"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : lead ? 'Update Lead' : 'Create Lead'}
          </Button>
        </div>
      </div>

      <DynamicForm
        id="lead-form"
        schema={leadFormSchema}
        form={form}
        onSubmit={handleSubmit}
        className="space-y-6"
      />
    </Card>
  );
};

export default LeadForm;