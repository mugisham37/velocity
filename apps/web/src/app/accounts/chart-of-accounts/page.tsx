'use client';

import React, { useState } from 'react';
import { ChartOfAccounts, AccountForm } from '@/components/modules/accounts';
import { Account } from '@/types/accounts';

export default function ChartOfAccountsPage() {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>();
  const [parentAccount, setParentAccount] = useState<string | undefined>();

  const handleAccountSelect = (account: Account) => {
    setSelectedAccount(account);
  };

  const handleCreateAccount = (parent?: string) => {
    setParentAccount(parent);
    setEditingAccount(undefined);
    setShowAccountForm(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setParentAccount(undefined);
    setShowAccountForm(true);
  };

  const handleAccountSave = (_account: Account) => {
    setShowAccountForm(false);
    setEditingAccount(undefined);
    setParentAccount(undefined);
    // Refresh the chart of accounts
    window.location.reload();
  };

  const handleAccountFormCancel = () => {
    setShowAccountForm(false);
    setEditingAccount(undefined);
    setParentAccount(undefined);
  };

  if (showAccountForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <AccountForm
          account={editingAccount}
          parentAccount={parentAccount}
          onSave={handleAccountSave}
          onCancel={handleAccountFormCancel}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Chart of Accounts</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your company&apos;s chart of accounts and account hierarchy
            </p>
          </div>
          <button
            onClick={() => handleCreateAccount()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            New Account
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Chart of Accounts */}
        <div className="flex-1 border-r border-gray-200">
          <ChartOfAccounts
            onAccountSelect={handleAccountSelect}
          />
        </div>

        {/* Account Details Panel */}
        {selectedAccount && (
          <div className="w-96 bg-white border-l border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Account Details</h3>
              <button
                onClick={() => handleEditAccount(selectedAccount)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Account Name</label>
                <p className="mt-1 text-sm text-gray-900">{selectedAccount.account_name}</p>
              </div>

              {selectedAccount.account_number && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Account Number</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedAccount.account_number}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-500">Account Type</label>
                <p className="mt-1 text-sm text-gray-900">{selectedAccount.account_type}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Root Type</label>
                <p className="mt-1 text-sm text-gray-900">{selectedAccount.root_type}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Company</label>
                <p className="mt-1 text-sm text-gray-900">{selectedAccount.company}</p>
              </div>

              {selectedAccount.parent_account && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Parent Account</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedAccount.parent_account}</p>
                </div>
              )}

              {selectedAccount.account_currency && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Currency</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedAccount.account_currency}</p>
                </div>
              )}

              {selectedAccount.balance !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Balance</label>
                  <p className={`mt-1 text-sm font-medium ${
                    selectedAccount.balance > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: selectedAccount.account_currency || 'USD',
                    }).format(Math.abs(selectedAccount.balance))} {selectedAccount.balance > 0 ? 'Dr' : 'Cr'}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {selectedAccount.is_group && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Group Account
                  </span>
                )}
                {selectedAccount.disabled && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Disabled
                  </span>
                )}
                {selectedAccount.freeze_account && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Frozen
                  </span>
                )}
              </div>

              {selectedAccount.is_group && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleCreateAccount(selectedAccount.name)}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add Child Account
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}