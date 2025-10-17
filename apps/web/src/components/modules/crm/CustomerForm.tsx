'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { DynamicForm } from '@/components/forms';
import { Customer, CustomerFormData } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: CustomerFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  customer,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const form = useForm<CustomerFormData>({
    defaultValues: customer ? {
      customer_name: customer.customer_name,
      customer_type: customer.customer_type,
      customer_group: customer.customer_group,
      territory: customer.territory,
      email_id: customer.email_id,
      phone_no: customer.phone_no,
      mobile_no: customer.mobile_no,
      website: customer.website,
      customer_primary_address: customer.customer_primary_address,
      primary_address: customer.primary_address,
      customer_primary_contact: customer.customer_primary_contact,
      default_currency: customer.default_currency,
      default_price_list: customer.default_price_list,
      credit_limit: customer.credit_limit,
      payment_terms: customer.payment_terms,
      tax_id: customer.tax_id,
      tax_category: customer.tax_category,
      tax_withholding_category: customer.tax_withholding_category,
      so_required: customer.so_required,
      dn_required: customer.dn_required,
      is_internal_customer: customer.is_internal_customer,
      represents_company: customer.represents_company,
      market_segment: customer.market_segment,
      industry: customer.industry,
      annual_revenue: customer.annual_revenue,
      disabled: customer.disabled
    } : {
      customer_type: 'Company',
      customer_group: 'All Customer Groups',
      territory: 'All Territories',
      default_currency: 'USD',
      so_required: false,
      dn_required: false,
      is_internal_customer: false,
      disabled: false
    }
  });

  const customerFormSchema = {
    name: 'Customer',
    fields: [
      // Basic Information Section
      {
        fieldname: 'customer_name',
        fieldtype: 'Data',
        label: 'Customer Name',
        reqd: 1,
        section_break: 1,
        section_label: 'Basic Information'
      },
      {
        fieldname: 'customer_type',
        fieldtype: 'Select',
        label: 'Customer Type',
        options: 'Company\nIndividual',
        reqd: 1
      },
      {
        fieldname: 'customer_group',
        fieldtype: 'Link',
        label: 'Customer Group',
        options: 'Customer Group',
        reqd: 1
      },
      {
        fieldname: 'territory',
        fieldtype: 'Link',
        label: 'Territory',
        options: 'Territory',
        reqd: 1
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
        fieldname: 'phone_no',
        fieldtype: 'Data',
        label: 'Phone No'
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
        fieldname: 'customer_primary_address',
        fieldtype: 'Link',
        label: 'Primary Address',
        options: 'Address',
        section_break: 1,
        section_label: 'Address Information'
      },
      {
        fieldname: 'primary_address',
        fieldtype: 'Text',
        label: 'Primary Address Display',
        read_only: 1
      },
      {
        fieldname: 'customer_primary_contact',
        fieldtype: 'Link',
        label: 'Primary Contact',
        options: 'Contact'
      },
      
      // Financial Information Section
      {
        fieldname: 'default_currency',
        fieldtype: 'Link',
        label: 'Default Currency',
        options: 'Currency',
        reqd: 1,
        section_break: 1,
        section_label: 'Financial Information'
      },
      {
        fieldname: 'default_price_list',
        fieldtype: 'Link',
        label: 'Default Price List',
        options: 'Price List'
      },
      {
        fieldname: 'credit_limit',
        fieldtype: 'Currency',
        label: 'Credit Limit'
      },
      {
        fieldname: 'payment_terms',
        fieldtype: 'Link',
        label: 'Payment Terms',
        options: 'Payment Terms Template'
      },
      
      // Tax Information Section
      {
        fieldname: 'tax_id',
        fieldtype: 'Data',
        label: 'Tax ID',
        section_break: 1,
        section_label: 'Tax Information'
      },
      {
        fieldname: 'tax_category',
        fieldtype: 'Link',
        label: 'Tax Category',
        options: 'Tax Category'
      },
      {
        fieldname: 'tax_withholding_category',
        fieldtype: 'Link',
        label: 'Tax Withholding Category',
        options: 'Tax Withholding Category'
      },
      
      // Settings Section
      {
        fieldname: 'so_required',
        fieldtype: 'Check',
        label: 'Sales Order Required',
        section_break: 1,
        section_label: 'Settings'
      },
      {
        fieldname: 'dn_required',
        fieldtype: 'Check',
        label: 'Delivery Note Required'
      },
      {
        fieldname: 'is_internal_customer',
        fieldtype: 'Check',
        label: 'Is Internal Customer'
      },
      {
        fieldname: 'represents_company',
        fieldtype: 'Link',
        label: 'Represents Company',
        options: 'Company',
        depends_on: 'is_internal_customer'
      },
      
      // Additional Information Section
      {
        fieldname: 'market_segment',
        fieldtype: 'Link',
        label: 'Market Segment',
        options: 'Market Segment',
        section_break: 1,
        section_label: 'Additional Information'
      },
      {
        fieldname: 'industry',
        fieldtype: 'Link',
        label: 'Industry',
        options: 'Industry Type'
      },
      {
        fieldname: 'annual_revenue',
        fieldtype: 'Currency',
        label: 'Annual Revenue'
      },
      {
        fieldname: 'disabled',
        fieldtype: 'Check',
        label: 'Disabled'
      }
    ]
  };

  const handleSubmit = (data: CustomerFormData) => {
    onSubmit(data);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          {customer ? `Edit Customer: ${customer.customer_name}` : 'New Customer'}
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
            form="customer-form"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : customer ? 'Update Customer' : 'Create Customer'}
          </Button>
        </div>
      </div>

      <DynamicForm
        id="customer-form"
        schema={customerFormSchema}
        form={form}
        onSubmit={handleSubmit}
        className="space-y-6"
      />
    </Card>
  );
};

export default CustomerForm;