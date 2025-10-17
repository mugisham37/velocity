'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  PaymentEntry, 
  PaymentType, 
  PartyType
} from '@/types/accounts';
import { apiClient } from '@/lib/api/client';
import { useNotifications } from '@/hooks/useNotifications';
import { getErrorMessage } from '@/lib/utils/form-utils';
import { 
  TrashIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const paymentReferenceSchema = z.object({
  reference_doctype: z.string().min(1, 'Reference type is required'),
  reference_name: z.string().min(1, 'Reference name is required'),
  due_date: z.string().optional(),
  total_amount: z.number().min(0),
  outstanding_amount: z.number().min(0),
  allocated_amount: z.number().min(0),
  exchange_rate: z.number().min(0).default(1),
});

const paymentDeductionSchema = z.object({
  account: z.string().min(1, 'Account is required'),
  cost_center: z.string().optional(),
  amount: z.number().min(0),
});

const paymentTaxSchema = z.object({
  account_head: z.string().min(1, 'Tax account is required'),
  charge_type: z.string().min(1, 'Charge type is required'),
  rate: z.number().min(0).optional(),
  tax_amount: z.number().min(0),
  total: z.number().min(0),
  cost_center: z.string().optional(),
});

const paymentEntrySchema = z.object({
  payment_type: z.string().min(1, 'Payment type is required'),
  party_type: z.string().min(1, 'Party type is required'),
  party: z.string().min(1, 'Party is required'),
  party_name: z.string().optional(),
  posting_date: z.string().min(1, 'Posting date is required'),
  company: z.string().min(1, 'Company is required'),
  mode_of_payment: z.string().min(1, 'Mode of payment is required'),
  paid_from: z.string().optional(),
  paid_to: z.string().optional(),
  paid_from_account_currency: z.string().optional(),
  paid_to_account_currency: z.string().optional(),
  paid_amount: z.number().min(0, 'Paid amount must be positive'),
  received_amount: z.number().min(0, 'Received amount must be positive'),
  source_exchange_rate: z.number().min(0).default(1),
  target_exchange_rate: z.number().min(0).default(1),
  reference_no: z.string().optional(),
  reference_date: z.string().optional(),
  references: z.array(paymentReferenceSchema).default([]),
  deductions: z.array(paymentDeductionSchema).default([]),
  taxes: z.array(paymentTaxSchema).default([]),
});

// type PaymentEntryFormData = z.infer<typeof paymentEntrySchema>;

interface PaymentEntryFormProps {
  paymentEntry?: PaymentEntry;
  onSave: (paymentEntry: PaymentEntry) => void;
  onCancel: () => void;
}

const PAYMENT_TYPES: PaymentType[] = ['Receive', 'Pay', 'Internal Transfer'];
const PARTY_TYPES: PartyType[] = ['Customer', 'Supplier', 'Employee', 'Shareholder', 'Student'];

export function PaymentEntryForm({ paymentEntry, onSave, onCancel }: PaymentEntryFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<Array<{ name: string; company_name: string }>>([]);
  const [accounts, setAccounts] = useState<Array<{ name: string; account_name: string; account_currency: string }>>([]);
  const [modesOfPayment, setModesOfPayment] = useState<Array<{ name: string; mode_of_payment: string }>>([]);
  const [parties, setParties] = useState<Array<{ name: string; customer_name?: string; supplier_name?: string; employee_name?: string }>>([]);
  const [outstandingInvoices, setOutstandingInvoices] = useState<Array<{ name: string; outstanding_amount: number; due_date: string; total: number }>>([]);

  const { showError, showSuccess } = useNotifications();

  const methods = useForm({
    resolver: zodResolver(paymentEntrySchema),
    defaultValues: {
      payment_type: paymentEntry?.payment_type || 'Receive',
      party_type: paymentEntry?.party_type || 'Customer',
      party: paymentEntry?.party || '',
      party_name: paymentEntry?.party_name || '',
      posting_date: paymentEntry?.posting_date || new Date().toISOString().split('T')[0],
      company: paymentEntry?.company || '',
      mode_of_payment: paymentEntry?.mode_of_payment || '',
      paid_from: paymentEntry?.paid_from || '',
      paid_to: paymentEntry?.paid_to || '',
      paid_from_account_currency: paymentEntry?.paid_from_account_currency || 'USD',
      paid_to_account_currency: paymentEntry?.paid_to_account_currency || 'USD',
      paid_amount: paymentEntry?.paid_amount || 0,
      received_amount: paymentEntry?.received_amount || 0,
      source_exchange_rate: paymentEntry?.source_exchange_rate || 1,
      target_exchange_rate: paymentEntry?.target_exchange_rate || 1,
      reference_no: paymentEntry?.reference_no || '',
      reference_date: paymentEntry?.reference_date || '',
      references: paymentEntry?.references || [],
      deductions: paymentEntry?.deductions || [],
      taxes: paymentEntry?.taxes || [],
    },
  });

  const { control, handleSubmit, watch, setValue, formState: { errors } } = methods;

  const { 
    fields: referenceFields, 
    append: appendReference, 
    remove: removeReference 
  } = useFieldArray({
    control,
    name: 'references',
  });

  // Deductions field array (not used in this simplified version)
  // const { 
  //   fields: deductionFields, 
  //   append: appendDeduction, 
  //   remove: removeDeduction 
  // } = useFieldArray({
  //   control,
  //   name: 'deductions',
  // });

  const watchedPaymentType = watch('payment_type');
  const watchedPartyType = watch('party_type');
  const watchedParty = watch('party');
  const watchedCompany = watch('company');
  const watchedReferences = watch('references');
  const watchedDeductions = watch('deductions');
  const watchedPaidAmount = watch('paid_amount');
  const watchedReceivedAmount = watch('received_amount');

  // Calculate totals
  const totals = useMemo(() => {
    const totalAllocated = (watchedReferences || []).reduce((sum: number, ref: any) => sum + (ref.allocated_amount || 0), 0);
    const totalDeductions = (watchedDeductions || []).reduce((sum: number, ded: any) => sum + (ded.amount || 0), 0);
    const unallocatedAmount = watchedReceivedAmount - totalAllocated - totalDeductions;
    const differenceAmount = watchedPaidAmount - watchedReceivedAmount;
    
    return {
      totalAllocated,
      totalDeductions,
      unallocatedAmount,
      differenceAmount,
      isBalanced: Math.abs(differenceAmount) < 0.01,
    };
  }, [watchedReferences, watchedDeductions, watchedPaidAmount, watchedReceivedAmount]);

  // Load dropdown data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [companiesRes, accountsRes, modesRes] = await Promise.all([
          apiClient.getList('Company', {
            fields: ['name', 'company_name'],
            limit_page_length: 100,
          }),
          apiClient.getList('Account', {
            fields: ['name', 'account_name', 'account_currency'],
            filters: { disabled: 0, account_type: ['in', ['Bank', 'Cash']] },
            order_by: 'account_name asc',
            limit_page_length: 200,
          }),
          apiClient.getList('Mode of Payment', {
            fields: ['name', 'mode_of_payment'],
            limit_page_length: 100,
          }),
        ]);

        setCompanies(companiesRes.data as Array<{ name: string; company_name: string }>);
        setAccounts(accountsRes.data as Array<{ name: string; account_name: string; account_currency: string }>);
        setModesOfPayment(modesRes.data as Array<{ name: string; mode_of_payment: string }>);

        // Set default company if only one exists
        if (companiesRes.data.length === 1 && !paymentEntry) {
          setValue('company', (companiesRes.data[0] as { name: string }).name);
        }
      } catch (error) {
        console.error('Failed to load form data:', error);
        showError('Failed to load form data');
      }
    };

    loadData();
  }, [paymentEntry, setValue, showError]);

  // Load parties when party type changes
  useEffect(() => {
    const loadParties = async () => {
      if (!watchedPartyType) return;

      try {
        const doctype = watchedPartyType;
        const nameField = 'name';
        let displayField = 'name';

        switch (watchedPartyType) {
          case 'Customer':
            displayField = 'customer_name';
            break;
          case 'Supplier':
            displayField = 'supplier_name';
            break;
          case 'Employee':
            displayField = 'employee_name';
            break;
        }

        const response = await apiClient.getList(doctype, {
          fields: [nameField, displayField],
          filters: { disabled: 0 },
          order_by: `${displayField} asc`,
          limit_page_length: 200,
        });

        setParties(response.data as Array<{ name: string; customer_name?: string; supplier_name?: string; employee_name?: string }>);
      } catch (error) {
        console.error('Failed to load parties:', error);
      }
    };

    loadParties();
  }, [watchedPartyType]);

  // Load outstanding invoices when party changes
  useEffect(() => {
    const loadOutstandingInvoices = async () => {
      if (!watchedParty || !watchedPartyType) return;

      try {
        let doctype = '';
        switch (watchedPartyType) {
          case 'Customer':
            doctype = watchedPaymentType === 'Receive' ? 'Sales Invoice' : 'Sales Order';
            break;
          case 'Supplier':
            doctype = watchedPaymentType === 'Pay' ? 'Purchase Invoice' : 'Purchase Order';
            break;
          default:
            return;
        }

        const response = await apiClient.getList(doctype, {
          fields: ['name', 'outstanding_amount', 'due_date', 'grand_total as total'],
          filters: {
            [watchedPartyType.toLowerCase()]: watchedParty,
            docstatus: 1,
            outstanding_amount: ['>', 0],
          },
          order_by: 'due_date asc',
          limit_page_length: 50,
        });

        setOutstandingInvoices(response.data as Array<{ name: string; outstanding_amount: number; due_date: string; total: number }>);
      } catch (error) {
        console.error('Failed to load outstanding invoices:', error);
      }
    };

    loadOutstandingInvoices();
  }, [watchedParty, watchedPartyType, watchedPaymentType]);

  // Auto-set accounts based on payment type and mode of payment
  useEffect(() => {
    if (watchedPaymentType && watchedCompany) {
      // This would typically fetch default accounts based on company and payment type
      // For now, we'll just clear the fields
      setValue('paid_from', '');
      setValue('paid_to', '');
    }
  }, [watchedPaymentType, watchedCompany, setValue]);

  // Add outstanding invoice as reference
  const addInvoiceReference = useCallback((invoice: { name: string; outstanding_amount: number; due_date: string; total: number }) => {
    const doctype = watchedPartyType === 'Customer' ? 'Sales Invoice' : 'Purchase Invoice';
    appendReference({
      reference_doctype: doctype,
      reference_name: invoice.name,
      due_date: invoice.due_date,
      total_amount: invoice.total,
      outstanding_amount: invoice.outstanding_amount,
      allocated_amount: invoice.outstanding_amount,
      exchange_rate: 1,
    });
  }, [watchedPartyType, appendReference]);

  // Auto-allocate payment
  const autoAllocate = useCallback(() => {
    let remainingAmount = watchedReceivedAmount;
    const updatedReferences = [...(watchedReferences || [])];

    updatedReferences.forEach((ref, index) => {
      if (remainingAmount > 0) {
        const allocateAmount = Math.min(remainingAmount, ref.outstanding_amount);
        setValue(`references.${index}.allocated_amount`, allocateAmount);
        remainingAmount -= allocateAmount;
      } else {
        setValue(`references.${index}.allocated_amount`, 0);
      }
    });
  }, [watchedReceivedAmount, watchedReferences, setValue]);

  const onSubmit = async (data: Record<string, unknown>) => {
    if (!totals.isBalanced) {
      showError('Payment Entry is not balanced. Paid amount must equal received amount.');
      return;
    }

    setIsLoading(true);
    try {
      const paymentEntryData = {
        ...data,
        name: paymentEntry?.name,
        doctype: 'Payment Entry',
        total_allocated_amount: totals.totalAllocated,
        unallocated_amount: totals.unallocatedAmount,
        difference_amount: totals.differenceAmount,
        docstatus: 0, // Draft
      };

      const savedPaymentEntry = await apiClient.saveDoc<PaymentEntry>('Payment Entry', paymentEntryData);
      showSuccess(paymentEntry ? 'Payment Entry updated successfully' : 'Payment Entry created successfully');
      onSave(savedPaymentEntry);
    } catch (error) {
      console.error('Failed to save payment entry:', error);
      showError('Failed to save payment entry');
    } finally {
      setIsLoading(false);
    }
  };

  const getPartyDisplayName = (party: { name: string; customer_name?: string; supplier_name?: string; employee_name?: string }) => {
    switch (watchedPartyType) {
      case 'Customer':
        return party.customer_name || party.name;
      case 'Supplier':
        return party.supplier_name || party.name;
      case 'Employee':
        return party.employee_name || party.name;
      default:
        return party.name;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            {paymentEntry ? 'Edit Payment Entry' : 'New Payment Entry'}
          </h3>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
            totals.isBalanced 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {totals.isBalanced ? (
              <>
                <CheckCircleIcon className="w-4 h-4" />
                <span>Balanced</span>
              </>
            ) : (
              <>
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span>Difference: {totals.differenceAmount.toFixed(2)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Header Fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Type *
            </label>
            <Controller
              name="payment_type"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.payment_type ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  {PAYMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.payment_type && (
              <p className="mt-1 text-sm text-red-600">{getErrorMessage(errors.payment_type)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Party Type *
            </label>
            <Controller
              name="party_type"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.party_type ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  {PARTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.party_type && (
              <p className="mt-1 text-sm text-red-600">{getErrorMessage(errors.party_type)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Party *
            </label>
            <Controller
              name="party"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.party ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select {watchedPartyType}</option>
                  {parties.map((party) => (
                    <option key={party.name} value={party.name}>
                      {getPartyDisplayName(party)}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.party && (
              <p className="mt-1 text-sm text-red-600">{getErrorMessage(errors.party)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Posting Date *
            </label>
            <Controller
              name="posting_date"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="date"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.posting_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              )}
            />
            {errors.posting_date && (
              <p className="mt-1 text-sm text-red-600">{getErrorMessage(errors.posting_date)}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company *
            </label>
            <Controller
              name="company"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.company ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Company</option>
                  {companies.map((company) => (
                    <option key={company.name} value={company.name}>
                      {company.company_name}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.company && (
              <p className="mt-1 text-sm text-red-600">{getErrorMessage(errors.company)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mode of Payment *
            </label>
            <Controller
              name="mode_of_payment"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.mode_of_payment ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Mode of Payment</option>
                  {modesOfPayment.map((mode) => (
                    <option key={mode.name} value={mode.name}>
                      {mode.mode_of_payment}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.mode_of_payment && (
              <p className="mt-1 text-sm text-red-600">{getErrorMessage(errors.mode_of_payment)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference No
            </label>
            <Controller
              name="reference_no"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter reference number"
                />
              )}
            />
          </div>
        </div>

        {/* Account Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {watchedPaymentType === 'Receive' ? 'Paid To Account' : 'Paid From Account'}
            </label>
            <Controller
              name={watchedPaymentType === 'Receive' ? 'paid_to' : 'paid_from'}
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Account</option>
                  {accounts.map((account) => (
                    <option key={account.name} value={account.name}>
                      {account.account_name}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {watchedPaymentType === 'Receive' ? 'Paid From Account' : 'Paid To Account'}
            </label>
            <Controller
              name={watchedPaymentType === 'Receive' ? 'paid_from' : 'paid_to'}
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Account</option>
                  {accounts.map((account) => (
                    <option key={account.name} value={account.name}>
                      {account.account_name}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        </div>

        {/* Amount Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paid Amount *
            </label>
            <Controller
              name="paid_amount"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      field.onChange(value);
                      setValue('received_amount', value);
                    }}
                  />
                </div>
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Received Amount *
            </label>
            <Controller
              name="received_amount"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}
            />
          </div>
        </div>

        {/* Outstanding Invoices */}
        {outstandingInvoices.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">Outstanding Invoices</h4>
              <button
                type="button"
                onClick={autoAllocate}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Auto Allocate
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
              {outstandingInvoices.map((invoice) => (
                <div key={invoice.name} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{invoice.name}</div>
                    <div className="text-sm text-gray-500">
                      Due: {new Date(invoice.due_date).toLocaleDateString()} • 
                      Outstanding: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.outstanding_amount)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addInvoiceReference(invoice)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment References */}
        {referenceFields.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">Payment References</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Outstanding
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Allocated
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {referenceFields.map((field, index) => (
                    <tr key={field.id}>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {(watchedReferences || [])[index]?.reference_name}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((watchedReferences || [])[index]?.total_amount || 0)}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((watchedReferences || [])[index]?.outstanding_amount || 0)}
                      </td>
                      <td className="px-3 py-4">
                        <Controller
                          name={`references.${index}.allocated_amount`}
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="number"
                              step="0.01"
                              min="0"
                              max={(watchedReferences || [])[index]?.outstanding_amount || 0}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          )}
                        />
                      </td>
                      <td className="px-3 py-4">
                        <button
                          type="button"
                          onClick={() => removeReference(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-3 py-3 text-sm font-medium text-gray-900">
                      Total Allocated
                    </td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-900">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totals.totalAllocated)}
                    </td>
                    <td className="px-3 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Paid Amount:</span>
              <div className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(watchedPaidAmount)}</div>
            </div>
            <div>
              <span className="text-gray-500">Received Amount:</span>
              <div className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(watchedReceivedAmount)}</div>
            </div>
            <div>
              <span className="text-gray-500">Total Allocated:</span>
              <div className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totals.totalAllocated)}</div>
            </div>
            <div>
              <span className="text-gray-500">Unallocated:</span>
              <div className={`font-medium ${totals.unallocatedAmount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totals.unallocatedAmount)}
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !totals.isBalanced}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : paymentEntry ? 'Update Payment' : 'Create Payment'}
          </button>
        </div>
      </form>
    </div>
  );
}