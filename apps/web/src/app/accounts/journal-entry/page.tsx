'use client';

import React, { useState } from 'react';
import { JournalEntryList, JournalEntryForm } from '@/components/modules/accounts';
import { JournalEntry } from '@/types/accounts';

type ViewMode = 'list' | 'form' | 'view';

export default function JournalEntryPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | undefined>();

  const handleCreateNew = () => {
    setSelectedEntry(undefined);
    setViewMode('form');
  };

  const handleEdit = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setViewMode('form');
  };

  const handleView = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setViewMode('view');
  };

  const handleSave = (_entry: JournalEntry) => {
    setViewMode('list');
    setSelectedEntry(undefined);
    // In a real app, you might want to refresh the list or show a success message
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedEntry(undefined);
  };

  if (viewMode === 'form') {
    return (
      <div className="container mx-auto px-4 py-8">
        <JournalEntryForm
          journalEntry={selectedEntry}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  if (viewMode === 'view' && selectedEntry) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Journal Entry: {selectedEntry.title || selectedEntry.name}
              </h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleEdit(selectedEntry)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={handleCancel}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Back to List
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Header Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">Voucher Type</label>
                <p className="mt-1 text-sm text-gray-900">{selectedEntry.voucher_type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Company</label>
                <p className="mt-1 text-sm text-gray-900">{selectedEntry.company}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Posting Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedEntry.posting_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            {selectedEntry.pay_to_recd_from && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Pay To / Received From</label>
                <p className="mt-1 text-sm text-gray-900">{selectedEntry.pay_to_recd_from}</p>
              </div>
            )}

            {/* Accounts Table */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Accounting Entries</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Account
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Debit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Credit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost Center
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedEntry.accounts.map((account, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {account.account}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {account.debit > 0 ? new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          }).format(account.debit) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {account.credit > 0 ? new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          }).format(account.credit) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {account.cost_center || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {account.project || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        Total
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(selectedEntry.total_debit)}
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(selectedEntry.total_credit)}
                      </td>
                      <td colSpan={2} className="px-6 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Additional Information */}
            {(selectedEntry.user_remark || selectedEntry.reference_number) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedEntry.user_remark && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">User Remark</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedEntry.user_remark}</p>
                  </div>
                )}
                {selectedEntry.reference_number && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Reference Number</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedEntry.reference_number}</p>
                    {selectedEntry.reference_date && (
                      <p className="text-sm text-gray-500">
                        Date: {new Date(selectedEntry.reference_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">
                {selectedEntry.docstatus === 0 && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Draft</span>
                )}
                {selectedEntry.docstatus === 1 && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Submitted</span>
                )}
                {selectedEntry.docstatus === 2 && (
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Cancelled</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Journal Entries</h1>
            <p className="mt-1 text-sm text-gray-600">
              Create and manage journal entries for accounting transactions
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <JournalEntryList
          onCreateNew={handleCreateNew}
          onEdit={handleEdit}
          onView={handleView}
        />
      </div>
    </div>
  );
}