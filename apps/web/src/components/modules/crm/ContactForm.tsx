'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { DynamicForm } from '@/components/forms';
import { Contact, ContactFormData } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ContactFormProps {
  contact?: Contact;
  onSubmit: (data: ContactFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const ContactForm: React.FC<ContactFormProps> = ({
  contact,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const form = useForm<ContactFormData>({
    defaultValues: contact ? {
      first_name: contact.first_name,
      last_name: contact.last_name,
      full_name: contact.full_name,
      email_id: contact.email_id,
      phone: contact.phone,
      mobile_no: contact.mobile_no,
      address: contact.address,
      designation: contact.designation,
      department: contact.department,
      company_name: contact.company_name,
      status: contact.status,
      unsubscribed: contact.unsubscribed
    } : {
      status: 'Open',
      unsubscribed: false
    }
  });

  const contactFormSchema = {
    name: 'Contact',
    fields: [
      // Basic Information Section
      {
        fieldname: 'first_name',
        fieldtype: 'Data',
        label: 'First Name',
        reqd: 1,
        section_break: 1,
        section_label: 'Basic Information'
      },
      {
        fieldname: 'last_name',
        fieldtype: 'Data',
        label: 'Last Name'
      },
      {
        fieldname: 'full_name',
        fieldtype: 'Data',
        label: 'Full Name',
        read_only: 1,
        description: 'Auto-generated from first and last name'
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
        fieldname: 'address',
        fieldtype: 'Link',
        label: 'Address',
        options: 'Address'
      },
      
      // Professional Information Section
      {
        fieldname: 'designation',
        fieldtype: 'Data',
        label: 'Designation',
        section_break: 1,
        section_label: 'Professional Information'
      },
      {
        fieldname: 'department',
        fieldtype: 'Data',
        label: 'Department'
      },
      {
        fieldname: 'company_name',
        fieldtype: 'Data',
        label: 'Company Name'
      },
      
      // Status Section
      {
        fieldname: 'status',
        fieldtype: 'Select',
        label: 'Status',
        options: 'Passive\nOpen\nReplied',
        reqd: 1,
        section_break: 1,
        section_label: 'Status'
      },
      {
        fieldname: 'unsubscribed',
        fieldtype: 'Check',
        label: 'Unsubscribed',
        description: 'Contact has unsubscribed from communications'
      }
    ]
  };

  const handleSubmit = (data: ContactFormData) => {
    // Auto-generate full name if not provided
    if (!data.full_name && (data.first_name || data.last_name)) {
      data.full_name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
    }
    
    onSubmit(data);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          {contact ? `Edit Contact: ${contact.full_name || contact.first_name}` : 'New Contact'}
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
            form="contact-form"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : contact ? 'Update Contact' : 'Create Contact'}
          </Button>
        </div>
      </div>

      <DynamicForm
        id="contact-form"
        schema={contactFormSchema}
        form={form}
        onSubmit={handleSubmit}
        className="space-y-6"
      />
    </Card>
  );
};

export default ContactForm;