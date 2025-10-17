'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Account, AccountType, RootType, ReportType } from '@/types/accounts';
import { apiClient } from '@/lib/api/client';
import { useNotifications } from '@/hooks/useNotifications';
import { getErrorMessage } from '@/lib/utils/form-utils';

const accountSchema = z.object({
  account_name: z.string().min(1, 'Account name is required'),
  account_number: z.string().optional(),
  account_type: z.string().min(1, 'Account type is required'),
  root_type: z.string().min(1, 'Root type is required'),
  parent_account: z.string().optional(),
  is_group: z.boolean().default(false),
  company: z.string().min(1, 'Company is required'),
  account_currency: z.string().optional(),
  freeze_account: z.boolean().default(false),
  disabled: z.boolean().default(false),
  report_type: z.string().optional(),
  include_in_gross: z.boolean().default(false),
  tax_rate: z.number().optional(),
  inter_company_account: z.string().optional(),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface AccountFormProps {
  account?: Account;
  parentAccount?: string;
  onSave: (account: Account) => void;
  onCancel: () => void;
}

const ACCOUNT_TYPES: AccountType[] = [
  'Accumulated Depreciation',
  'Asset Received But Not Billed',
  'Bank',
  'Cash',
  'Chargeable',
  'Cost of Goods Sold',
  'Depreciation',
  'Equity',
  'Expense Account',
  'Expenses Included In Asset Valuation',
  'Expenses Included In Valuation',
  'Fixed Asset',
  'Income Account',
  'Payable',
  'Receivable',
  'Round Off',
  'Stock',
  'Stock Adjustment',
  'Stock Received But Not Billed',
  'Service Received But Not Billed',
  'Tax',
  'Temporary',
];

const ROOT_TYPES: RootType[] = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];

const REPORT_TYPES: ReportType[] = ['Balance Sheet', 'Profit and Loss'];

export function AccountForm({ account, parentAccount, onSave, onCancel }: AccountFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<Array<{ name: string; company_name: string }>>([]);
  const [currencies, setCurrencies] = useState<Array<{ name: string }>>([]);
  const [parentAccounts, setParentAccounts] = useState<Array<{ name: string; account_name: string }>>([]);

  const { showError, showSuccess } = useNotifications();

  const methods = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      account_name: account?.account_name || '',
      account_number: account?.account_number || '',
      account_type: account?.account_type || '',
      root_type: account?.root_type || '',
      parent_account: account?.parent_account || parentAccount || '',
      is_group: account?.is_group || false,
      company: account?.company || '',
      account_currency: account?.account_currency || '',
      freeze_account: account?.freeze_account || false,
      disabled: account?.disabled || false,
      report_type: account?.report_type || '',
      include_in_gross: account?.include_in_gross || false,
      tax_rate: account?.tax_rate || undefined,
      inter_company_account: account?.inter_company_account || '',
    },
  });

  const { control, handleSubmit, watch, setValue, formState: { errors, isDirty } } = methods;

  const watchedRootType = watch('root_type');
  const watchedAccountType = watch('account_type');
  const watchedCompany = watch('company');

  // Load dropdown data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [companiesRes, currenciesRes] = await Promise.all([
          apiClient.getList('Company', {
            fields: ['name', 'company_name'],
            limit_page_length: 100,
          }),
          apiClient.getList('Currency', {
            fields: ['name'],
            limit_page_length: 100,
          }),
        ]);

        setCompanies(companiesRes.data as Array<{ name: string; company_name: string }>);
        setCurrencies(currenciesRes.data as Array<{ name: string }>);

        // Set default company if only one exists
        if (companiesRes.data.length === 1 && !account) {
          setValue('company', (companiesRes.data[0] as { name: string }).name);
        }
      } catch (error) {
        console.error('Failed to load form data:', error);
        showError('Failed to load form data');
      }
    };

    loadData();
  }, [account, setValue, showError]);

  // Load parent accounts when company changes
  useEffect(() => {
    const loadParentAccounts = async () => {
      if (!watchedCompany) return;

      try {
        const response = await apiClient.getList('Account', {
          fields: ['name', 'account_name'],
          filters: {
            company: watchedCompany,
            is_group: 1,
          },
          order_by: 'account_name asc',
          limit_page_length: 500,
        });

        setParentAccounts(response.data as Array<{ name: string; account_name: string }>);
      } catch (error) {
        console.error('Failed to load parent accounts:', error);
      }
    };

    loadParentAccounts();
  }, [watchedCompany]);

  // Auto-set report type based on root type
  useEffect(() => {
    if (watchedRootType) {
      const reportType = ['Asset', 'Liability', 'Equity'].includes(watchedRootType)
        ? 'Balance Sheet'
        : 'Profit and Loss';
      setValue('report_type', reportType);
    }
  }, [watchedRootType, setValue]);

  // Filter account types based on root type
  const getFilteredAccountTypes = (): AccountType[] => {
    if (!watchedRootType) return ACCOUNT_TYPES;

    const typeMapping: Record<RootType, AccountType[]> = {
      Asset: [
        'Accumulated Depreciation',
        'Asset Received But Not Billed',
        'Bank',
        'Cash',
        'Fixed Asset',
        'Receivable',
        'Stock',
        'Stock Adjustment',
        'Stock Received But Not Billed',
        'Temporary',
      ],
      Liability: [
        'Chargeable',
        'Payable',
        'Service Received But Not Billed',
        'Tax',
      ],
      Equity: ['Equity'],
      Income: ['Income Account'],
      Expense: [
        'Cost of Goods Sold',
        'Depreciation',
        'Expense Account',
        'Expenses Included In Asset Valuation',
        'Expenses Included In Valuation',
        'Round Off',
      ],
    };

    return typeMapping[watchedRootType as RootType] || ACCOUNT_TYPES;
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const accountData = {
        ...data,
        name: account?.name,
        doctype: 'Account',
      };

      const savedAccount = await apiClient.saveDoc<Account>('Account', accountData);
      showSuccess(account ? 'Account updated successfully' : 'Account created successfully');
      onSave(savedAccount);
    } catch (error) {
      console.error('Failed to save account:', error);
      showError('Failed to save account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {account ? 'Edit Account' : 'New Account'}
        </h3>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Name *
            </label>
            <Controller
              name="account_name"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.account_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter account name"
                />
              )}
            />
            {errors.account_name && (
              <p className="mt-1 text-sm text-red-600">{getErrorMessage(errors.account_name)}</p>
            )}
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Number
            </label>
            <Controller
              name="account_number"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter account number"
                />
              )}
            />
          </div>

          {/* Company */}
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

          {/* Parent Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parent Account
            </label>
            <Controller
              name="parent_account"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={!watchedCompany}
                >
                  <option value="">Select Parent Account</option>
                  {parentAccounts.map((parent) => (
                    <option key={parent.name} value={parent.name}>
                      {parent.account_name}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>

          {/* Root Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Root Type *
            </label>
            <Controller
              name="root_type"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.root_type ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Root Type</option>
                  {ROOT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.root_type && (
              <p className="mt-1 text-sm text-red-600">{getErrorMessage(errors.root_type)}</p>
            )}
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type *
            </label>
            <Controller
              name="account_type"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.account_type ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Account Type</option>
                  {getFilteredAccountTypes().map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.account_type && (
              <p className="mt-1 text-sm text-red-600">{getErrorMessage(errors.account_type)}</p>
            )}
          </div>

          {/* Account Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Currency
            </label>
            <Controller
              name="account_currency"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Currency</option>
                  {currencies.map((currency) => (
                    <option key={currency.name} value={currency.name}>
                      {currency.name}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>

          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <Controller
              name="report_type"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled
                >
                  <option value="">Auto-selected</option>
                  {REPORT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>

          {/* Tax Rate */}
          {watchedAccountType === 'Tax' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Rate (%)
              </label>
              <Controller
                name="tax_rate"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter tax rate"
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                )}
              />
            </div>
          )}
        </div>

        {/* Checkboxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Controller
              name="is_group"
              control={control}
              render={({ field }) => (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Is Group</span>
                </label>
              )}
            />

            <Controller
              name="freeze_account"
              control={control}
              render={({ field }) => (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Freeze Account</span>
                </label>
              )}
            />
          </div>

          <div className="space-y-4">
            <Controller
              name="disabled"
              control={control}
              render={({ field }) => (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Disabled</span>
                </label>
              )}
            />

            <Controller
              name="include_in_gross"
              control={control}
              render={({ field }) => (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include in Gross</span>
                </label>
              )}
            />
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
            disabled={isLoading || !isDirty}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : account ? 'Update Account' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );
}