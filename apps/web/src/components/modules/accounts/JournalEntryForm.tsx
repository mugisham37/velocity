'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  JournalEntry, 
  JournalEntryAccount, 
  JournalEntryType 
} from '@/types/accounts';
import { apiClient } from '@/lib/api/client';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  PlusIcon, 
  TrashIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

const journalEntryAccountSchema = z.object({
  account: z.string().min(1, 'Account is required'),
  party_type: z.string().optional(),
  party: z.string().optional(),
  debit: z.number().min(0, 'Debit must be positive').default(0),
  credit: z.number().min(0, 'Credit must be positive').default(0),
  debit_in_account_currency: z.number().min(0).default(0),
  credit_in_account_currency: z.number().min(0).default(0),
  account_currency: z.string().default('USD'),
  exchange_rate: z.number().min(0).default(1),
  cost_center: z.string().optional(),
  project: z.string().optional(),
  reference_type: z.string().optional(),
  reference_name: z.string().optional(),
  against_account: z.string().optional(),
  user_remark: z.string().optional(),
});

const journalEntrySchema = z.object({
  title: z.string().optional(),
  voucher_type: z.string().min(1, 'Voucher type is required'),
  posting_date: z.string().min(1, 'Posting date is required'),
  company: z.string().min(1, 'Company is required'),
  accounts: z.array(journalEntryAccountSchema).min(2, 'At least 2 accounts are required'),
  user_remark: z.string().optional(),
  cheque_no: z.string().optional(),
  cheque_date: z.string().optional(),
  reference_number: z.string().optional(),
  reference_date: z.string().optional(),
  pay_to_recd_from: z.string().optional(),
  multi_currency: z.boolean().default(false),
});

type JournalEntryFormData = z.infer<typeof journalEntrySchema>;

interface JournalEntryFormProps {
  journalEntry?: JournalEntry;
  onSave: (journalEntry: JournalEntry) => void;
  onCancel: () => void;
}

const VOUCHER_TYPES: JournalEntryType[] = [
  'Journal Entry',
  'Inter Company Journal Entry',
  'Bank Entry',
  'Cash Entry',
  'Credit Card Entry',
  'Debit Note',
  'Credit Note',
  'Contra Entry',
  'Excise Entry',
  'Write Off Entry',
  'Opening Entry',
  'Depreciation Entry',
  'Exchange Rate Revaluation',
  'Deferred Revenue',
  'Deferred Expense',
];

const PARTY_TYPES = ['Customer', 'Supplier', 'Employee', 'Shareholder', 'Student'];

export function JournalEntryForm({ journalEntry, onSave, onCancel }: JournalEntryFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<Array<{ name: string; company_name: string }>>([]);
  const [accounts, setAccounts] = useState<Array<{ name: string; account_name: string; account_currency: string }>>([]);
  const [costCenters, setCostCenters] = useState<Array<{ name: string; cost_center_name: string }>>([]);
  const [projects, setProjects] = useState<Array<{ name: string; project_name: string }>>([]);

  const { showError, showSuccess } = useNotifications();

  const methods = useForm({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      title: journalEntry?.title || '',
      voucher_type: journalEntry?.voucher_type || 'Journal Entry',
      posting_date: journalEntry?.posting_date || new Date().toISOString().split('T')[0],
      company: journalEntry?.company || '',
      accounts: journalEntry?.accounts || [
        {
          account: '',
          party_type: '',
          party: '',
          debit: 0,
          credit: 0,
          debit_in_account_currency: 0,
          credit_in_account_currency: 0,
          account_currency: 'USD',
          exchange_rate: 1,
          cost_center: '',
          project: '',
          reference_type: '',
          reference_name: '',
          against_account: '',
          user_remark: '',
        },
        {
          account: '',
          party_type: '',
          party: '',
          debit: 0,
          credit: 0,
          debit_in_account_currency: 0,
          credit_in_account_currency: 0,
          account_currency: 'USD',
          exchange_rate: 1,
          cost_center: '',
          project: '',
          reference_type: '',
          reference_name: '',
          against_account: '',
          user_remark: '',
        },
      ],
      user_remark: journalEntry?.user_remark || '',
      cheque_no: journalEntry?.cheque_no || '',
      cheque_date: journalEntry?.cheque_date || '',
      reference_number: journalEntry?.reference_number || '',
      reference_date: journalEntry?.reference_date || '',
      pay_to_recd_from: journalEntry?.pay_to_recd_from || '',
      multi_currency: journalEntry?.multi_currency || false,
    },
  });

  const { control, handleSubmit, watch, setValue, formState: { errors } } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'accounts',
  });

  const watchedAccounts = watch('accounts');
  const watchedCompany = watch('company');

  // Calculate totals
  const totals = useMemo(() => {
    const totalDebit = watchedAccounts.reduce((sum, acc) => sum + (acc.debit || 0), 0);
    const totalCredit = watchedAccounts.reduce((sum, acc) => sum + (acc.credit || 0), 0);
    const difference = totalDebit - totalCredit;
    
    return {
      totalDebit,
      totalCredit,
      difference,
      isBalanced: Math.abs(difference) < 0.01, // Allow for small rounding differences
    };
  }, [watchedAccounts]);

  // Load dropdown data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [companiesRes, accountsRes, costCentersRes, projectsRes] = await Promise.all([
          apiClient.getList('Company', {
            fields: ['name', 'company_name'],
            limit_page_length: 100,
          }),
          apiClient.getList('Account', {
            fields: ['name', 'account_name', 'account_currency'],
            filters: { disabled: 0 },
            order_by: 'account_name asc',
            limit_page_length: 500,
          }),
          apiClient.getList('Cost Center', {
            fields: ['name', 'cost_center_name'],
            filters: { disabled: 0 },
            limit_page_length: 200,
          }),
          apiClient.getList('Project', {
            fields: ['name', 'project_name'],
            filters: { status: 'Open' },
            limit_page_length: 200,
          }),
        ]);

        setCompanies(companiesRes.data as Array<{ name: string; company_name: string }>);
        setAccounts(accountsRes.data as Array<{ name: string; account_name: string; account_currency: string }>);
        setCostCenters(costCentersRes.data as Array<{ name: string; cost_center_name: string }>);
        setProjects(projectsRes.data as Array<{ name: string; project_name: string }>);

        // Set default company if only one exists
        if (companiesRes.data.length === 1 && !journalEntry) {
          setValue('company', (companiesRes.data[0] as { name: string }).name);
        }
      } catch (error) {
        console.error('Failed to load form data:', error);
        showError('Failed to load form data');
      }
    };

    loadData();
  }, [journalEntry, setValue, showError]);

  // Auto-balance entries
  const autoBalance = useCallback(() => {
    const accounts = watchedAccounts;
    if (accounts.length < 2) return;

    const totalDebit = accounts.reduce((sum, acc, index) => 
      index < accounts.length - 1 ? sum + (acc.debit || 0) : sum, 0
    );
    const totalCredit = accounts.reduce((sum, acc, index) => 
      index < accounts.length - 1 ? sum + (acc.credit || 0) : sum, 0
    );

    const lastIndex = accounts.length - 1;
    const difference = totalDebit - totalCredit;

    if (difference > 0) {
      // Need more credit
      setValue(`accounts.${lastIndex}.credit`, difference);
      setValue(`accounts.${lastIndex}.debit`, 0);
    } else if (difference < 0) {
      // Need more debit
      setValue(`accounts.${lastIndex}.debit`, Math.abs(difference));
      setValue(`accounts.${lastIndex}.credit`, 0);
    }
  }, [watchedAccounts, setValue]);

  // Add new account row
  const addAccountRow = useCallback(() => {
    append({
      account: '',
      party_type: '',
      party: '',
      debit: 0,
      credit: 0,
      debit_in_account_currency: 0,
      credit_in_account_currency: 0,
      account_currency: 'USD',
      exchange_rate: 1,
      cost_center: '',
      project: '',
      reference_type: '',
      reference_name: '',
      against_account: '',
      user_remark: '',
    });
  }, [append]);

  // Remove account row
  const removeAccountRow = useCallback((index: number) => {
    if (fields.length > 2) {
      remove(index);
    }
  }, [fields.length, remove]);

  // Handle account selection
  const handleAccountChange = useCallback((index: number, accountName: string) => {
    const selectedAccount = accounts.find(acc => acc.name === accountName);
    if (selectedAccount) {
      setValue(`accounts.${index}.account`, accountName);
      setValue(`accounts.${index}.account_currency`, selectedAccount.account_currency);
      
      // Reset currency amounts if currency changed
      if (selectedAccount.account_currency !== watchedAccounts[index]?.account_currency) {
        setValue(`accounts.${index}.debit_in_account_currency`, watchedAccounts[index]?.debit || 0);
        setValue(`accounts.${index}.credit_in_account_currency`, watchedAccounts[index]?.credit || 0);
      }
    }
  }, [accounts, setValue, watchedAccounts]);

  const onSubmit = async (data: any) => {
    if (!totals.isBalanced) {
      showError('Journal Entry is not balanced. Total Debit must equal Total Credit.');
      return;
    }

    setIsLoading(true);
    try {
      const journalEntryData = {
        ...data,
        name: journalEntry?.name,
        doctype: 'Journal Entry',
        total_debit: totals.totalDebit,
        total_credit: totals.totalCredit,
        difference: totals.difference,
        docstatus: 0, // Draft
      };

      const savedJournalEntry = await apiClient.saveDoc<JournalEntry>('Journal Entry', journalEntryData);
      showSuccess(journalEntry ? 'Journal Entry updated successfully' : 'Journal Entry created successfully');
      onSave(savedJournalEntry);
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      showError('Failed to save journal entry');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            {journalEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
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
                <span>Difference: {totals.difference.toFixed(2)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Header Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voucher Type *
            </label>
            <Controller
              name="voucher_type"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.voucher_type ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  {VOUCHER_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.voucher_type && (
              <p className="mt-1 text-sm text-red-600">{errors.voucher_type.message}</p>
            )}
          </div>

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
              <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
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
              <p className="mt-1 text-sm text-red-600">{errors.posting_date.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter journal entry title"
                />
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pay To / Received From
            </label>
            <Controller
              name="pay_to_recd_from"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter party name"
                />
              )}
            />
          </div>
        </div>

        {/* Accounts Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">Accounting Entries</h4>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={autoBalance}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Auto Balance
              </button>
              <button
                type="button"
                onClick={addAccountRow}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Row
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account *
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Debit
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost Center
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fields.map((field, index) => (
                  <tr key={field.id}>
                    <td className="px-3 py-4">
                      <Controller
                        name={`accounts.${index}.account`}
                        control={control}
                        render={({ field }) => (
                          <select
                            {...field}
                            onChange={(e) => handleAccountChange(index, e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
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
                    </td>
                    <td className="px-3 py-4">
                      <Controller
                        name={`accounts.${index}.debit`}
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              field.onChange(value);
                              if (value > 0) {
                                setValue(`accounts.${index}.credit`, 0);
                              }
                            }}
                          />
                        )}
                      />
                    </td>
                    <td className="px-3 py-4">
                      <Controller
                        name={`accounts.${index}.credit`}
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              field.onChange(value);
                              if (value > 0) {
                                setValue(`accounts.${index}.debit`, 0);
                              }
                            }}
                          />
                        )}
                      />
                    </td>
                    <td className="px-3 py-4">
                      <Controller
                        name={`accounts.${index}.cost_center`}
                        control={control}
                        render={({ field }) => (
                          <select
                            {...field}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select Cost Center</option>
                            {costCenters.map((cc) => (
                              <option key={cc.name} value={cc.name}>
                                {cc.cost_center_name}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                    </td>
                    <td className="px-3 py-4">
                      <Controller
                        name={`accounts.${index}.project`}
                        control={control}
                        render={({ field }) => (
                          <select
                            {...field}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select Project</option>
                            {projects.map((project) => (
                              <option key={project.name} value={project.name}>
                                {project.project_name}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                    </td>
                    <td className="px-3 py-4">
                      {fields.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeAccountRow(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-3 py-3 text-sm font-medium text-gray-900">
                    Total
                  </td>
                  <td className="px-3 py-3 text-sm font-medium text-gray-900">
                    {totals.totalDebit.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-sm font-medium text-gray-900">
                    {totals.totalCredit.toFixed(2)}
                  </td>
                  <td colSpan={3} className="px-3 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Additional Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Remark
            </label>
            <Controller
              name="user_remark"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter remarks"
                />
              )}
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number
              </label>
              <Controller
                name="reference_number"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Date
              </label>
              <Controller
                name="reference_date"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              />
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
            {isLoading ? 'Saving...' : journalEntry ? 'Update Entry' : 'Create Entry'}
          </button>
        </div>
      </form>
    </div>
  );
}