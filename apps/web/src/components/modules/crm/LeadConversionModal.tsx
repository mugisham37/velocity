'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Lead, OpportunityFormData, CustomerFormData } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { X, User, Target, Building } from 'lucide-react';

interface LeadConversionModalProps {
  lead: Lead;
  onClose: () => void;
  onConvert: (data: {
    createCustomer: boolean;
    createOpportunity: boolean;
    customerData?: CustomerFormData;
    opportunityData?: OpportunityFormData;
  }) => void;
  isLoading?: boolean;
}

const LeadConversionModal: React.FC<LeadConversionModalProps> = ({
  lead,
  onClose,
  onConvert,
  isLoading = false
}) => {
  const [createCustomer, setCreateCustomer] = useState(true);
  const [createOpportunity, setCreateOpportunity] = useState(true);

  const customerForm = useForm<CustomerFormData>({
    defaultValues: {
      customer_name: lead.lead_name,
      customer_type: lead.organization_lead ? 'Company' : 'Individual',
      customer_group: 'All Customer Groups',
      territory: lead.territory || 'All Territories',
      email_id: lead.email_id,
      phone_no: lead.phone,
      mobile_no: lead.mobile_no,
      website: lead.website,
      default_currency: 'USD'
    }
  });

  const opportunityForm = useForm<OpportunityFormData>({
    defaultValues: {
      opportunity_from: 'Lead',
      party_name: lead.name,
      customer_name: lead.lead_name,
      opportunity_type: 'Sales',
      source: lead.source,
      status: 'Open',
      territory: lead.territory,
      currency: 'USD',
      probability: 50
    }
  });

  const handleConvert = () => {
    const customerData = createCustomer ? customerForm.getValues() : undefined;
    const opportunityData = createOpportunity ? opportunityForm.getValues() : undefined;

    onConvert({
      createCustomer,
      createOpportunity,
      customerData,
      opportunityData
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Convert Lead</h2>
            <p className="text-gray-600">Convert {lead.lead_name} to Customer and/or Opportunity</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Lead Information Summary */}
          <Card className="p-4 mb-6 bg-gray-50">
            <h3 className="font-medium text-gray-900 mb-3">Lead Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <p className="font-medium">{lead.lead_name}</p>
              </div>
              {lead.company_name && (
                <div>
                  <span className="text-gray-500">Company:</span>
                  <p className="font-medium">{lead.company_name}</p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Status:</span>
                <Badge variant="outline">{lead.status}</Badge>
              </div>
              <div>
                <span className="text-gray-500">Source:</span>
                <p className="font-medium">{lead.source}</p>
              </div>
              {lead.email_id && (
                <div>
                  <span className="text-gray-500">Email:</span>
                  <p className="font-medium">{lead.email_id}</p>
                </div>
              )}
              {lead.mobile_no && (
                <div>
                  <span className="text-gray-500">Mobile:</span>
                  <p className="font-medium">{lead.mobile_no}</p>
                </div>
              )}
              {lead.territory && (
                <div>
                  <span className="text-gray-500">Territory:</span>
                  <p className="font-medium">{lead.territory}</p>
                </div>
              )}
              {lead.lead_owner && (
                <div>
                  <span className="text-gray-500">Owner:</span>
                  <p className="font-medium">{lead.lead_owner}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Conversion Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className={`p-4 cursor-pointer border-2 ${createCustomer ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3" onClick={() => setCreateCustomer(!createCustomer)}>
                <div className={`p-2 rounded-lg ${createCustomer ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium">Create Customer</h4>
                  <p className="text-sm text-gray-600">Convert lead to a customer record</p>
                </div>
                <input
                  type="checkbox"
                  checked={createCustomer}
                  onChange={(e) => setCreateCustomer(e.target.checked)}
                  className="ml-auto"
                />
              </div>
            </Card>

            <Card className={`p-4 cursor-pointer border-2 ${createOpportunity ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3" onClick={() => setCreateOpportunity(!createOpportunity)}>
                <div className={`p-2 rounded-lg ${createOpportunity ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium">Create Opportunity</h4>
                  <p className="text-sm text-gray-600">Create a sales opportunity</p>
                </div>
                <input
                  type="checkbox"
                  checked={createOpportunity}
                  onChange={(e) => setCreateOpportunity(e.target.checked)}
                  className="ml-auto"
                />
              </div>
            </Card>
          </div>

          {/* Forms */}
          {(createCustomer || createOpportunity) && (
            <Tabs defaultValue={createCustomer ? "customer" : "opportunity"} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                {createCustomer && (
                  <TabsTrigger value="customer" disabled={!createCustomer}>
                    Customer Details
                  </TabsTrigger>
                )}
                {createOpportunity && (
                  <TabsTrigger value="opportunity" disabled={!createOpportunity}>
                    Opportunity Details
                  </TabsTrigger>
                )}
              </TabsList>

              {createCustomer && (
                <TabsContent value="customer" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer Name *
                      </label>
                      <input
                        {...customerForm.register('customer_name', { required: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer Type *
                      </label>
                      <select
                        {...customerForm.register('customer_type', { required: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Individual">Individual</option>
                        <option value="Company">Company</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer Group *
                      </label>
                      <input
                        {...customerForm.register('customer_group', { required: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Territory *
                      </label>
                      <input
                        {...customerForm.register('territory', { required: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email ID
                      </label>
                      <input
                        type="email"
                        {...customerForm.register('email_id')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mobile No
                      </label>
                      <input
                        {...customerForm.register('mobile_no')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </TabsContent>
              )}

              {createOpportunity && (
                <TabsContent value="opportunity" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Opportunity Type
                      </label>
                      <input
                        {...opportunityForm.register('opportunity_type')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Opportunity Type *
                      </label>
                      <select
                        {...opportunityForm.register('opportunity_type', { required: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Sales">Sales</option>
                        <option value="Support">Support</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Opportunity Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...opportunityForm.register('opportunity_amount')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Probability (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        {...opportunityForm.register('probability')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expected Closing Date
                      </label>
                      <input
                        type="date"
                        {...opportunityForm.register('expected_closing')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Currency
                      </label>
                      <input
                        {...opportunityForm.register('currency')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConvert}
            disabled={isLoading || (!createCustomer && !createOpportunity)}
          >
            {isLoading ? 'Converting...' : 'Convert Lead'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default LeadConversionModal;