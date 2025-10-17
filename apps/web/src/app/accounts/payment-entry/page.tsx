'use client';

import React, { useState } from 'react';
import { PaymentEntryList, PaymentEntryForm } from '@/components/modules/accounts';
import { PaymentEntry } from '@/types/accounts';

type ViewMode = 'list' | 'form' | 'view';

export default function PaymentEntryPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedEntry, setSelectedEntry] = useState<PaymentEntry | undefined>();

  const handleCreateNew = () => {
    setSelectedEntry(undefined);
    setViewMode('form');
  };

  const handleEdit = (entry: PaymentEntry) => {
    setSelectedEntry(entry);
    setViewMode('form');
  };

  const handleView = (entry: PaymentEntry) => {
    setSelectedEntry(entry);
    setViewMode('view');
  };

  const handleSave = (_entry: PaymentEntry) => {
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
        <PaymentEntryForm
          paymentEntry={selectedEntry}
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
                Payment Entry: {selectedEntry.name}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">Payment Type</label>
                <p className="mt-1 text-sm text-gray-900">{selectedEntry.payment_type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Party Type</label>
                <p className="mt-1 text-sm text-gray-900">{selectedEntry.party_type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Party</label>
                <p className="mt-1 text-sm text-gray-900">{selectedEntry.party_name || selectedEntry.party}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Posting Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedEntry.posting_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">Company</label>
                <p className="mt-1 text-sm text-gray-900">{selectedEntry.company}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Mode of Payment</label>
                <p className="mt-1 text-sm text-gray-900">{selectedEntry.mode_of_payment}</p>
              </div>
              {selectedEntry.reference_no && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Reference No</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedEntry.reference_no}</p>
                  {selectedEntry.reference_date && (
                    <p className="text-sm text-gray-500">
                      Date: {new Date(selectedEntry.reference_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Account Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectedEntry.paid_from && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Paid From Account</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedEntry.paid_from}</p>
                </div>
              )}
              {selectedEntry.paid_to && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Paid To Account</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedEntry.paid_to}</p>
                </div>
              )}
            </div>

            {/* Amount Information */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">Paid Amount</label>
                <p className="mt-1 text-lg font-medium text-gray-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(selectedEntry.paid_amount)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Received Amount</label>
                <p className="mt-1 text-lg font-medium text-gray-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(selectedEntry.received_amount)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Total Allocated</label>
                <p className="mt-1 text-lg font-medium text-green-600">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(selectedEntry.total_allocated_amount)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Unallocated Amount</label>
                <p className={`mt-1 text-lg font-medium ${
                  selectedEntry.unallocated_amount > 0 ? 'text-orange-600' : 'text-gray-900'
                }`}>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(selectedEntry.unallocated_amount)}
                </p>
              </div>
            </div>

            {/* Payment References */}
            {selectedEntry.references && selectedEntry.references.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Payment References</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reference
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Outstanding
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Allocated
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedEntry.references.map((ref, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {ref.reference_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                            }).format(ref.total_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                            }).format(ref.outstanding_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                            }).format(ref.allocated_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {ref.due_date ? new Date(ref.due_date).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Deductions */}
            {selectedEntry.deductions && selectedEntry.deductions.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Deductions</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Account
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost Center
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedEntry.deductions.map((deduction, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {deduction.account}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {deduction.cost_center || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                            }).format(deduction.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
            <h1 className="text-2xl font-semibold text-gray-900">Payment Entries</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage payments, receipts, and internal transfers
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <PaymentEntryList
          onCreateNew={handleCreateNew}
          onEdit={handleEdit}
          onView={handleView}
        />
      </div>
    </div>
  );
}