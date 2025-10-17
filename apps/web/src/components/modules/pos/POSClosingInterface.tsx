'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  Users, 
  ShoppingBag,
  FileText,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { usePOSStore } from '@/stores/pos';
import { POSClosingEntry, POSClosingPayment } from '@/types/pos';

interface POSClosingInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

export function POSClosingInterface({ isOpen, onClose }: POSClosingInterfaceProps) {
  const { currentProfile, paymentMethods } = usePOSStore() as {
    currentProfile: import('@/types/pos').POSProfile | null;
    paymentMethods: import('@/types/pos').POSPaymentMethod[];
  };
  const [closingData, setClosingData] = useState<Partial<POSClosingEntry>>({});
  const [paymentReconciliation, setPaymentReconciliation] = useState<POSClosingPayment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [salesSummary, setSalesSummary] = useState({
    totalTransactions: 0,
    totalQuantity: 0,
    netTotal: 0,
    totalTaxes: 0,
    grandTotal: 0,
    totalDiscount: 0
  });

  useEffect(() => {
    if (isOpen && currentProfile) {
      initializeClosing();
    }
  }, [isOpen, currentProfile]);

  const initializeClosing = async () => {
    if (!currentProfile) return;

    // Initialize payment reconciliation with payment methods
    const initialPayments: POSClosingPayment[] = paymentMethods.map(method => ({
      mode_of_payment: method.mode_of_payment,
      opening_amount: 0,
      expected_amount: 0,
      difference: 0
    }));

    setPaymentReconciliation(initialPayments);

    // TODO: Fetch actual sales data for the day
    // For now, using mock data
    setSalesSummary({
      totalTransactions: 25,
      totalQuantity: 87,
      netTotal: 15420.50,
      totalTaxes: 2313.08,
      grandTotal: 17733.58,
      totalDiscount: 245.00
    });

    setClosingData({
      posting_date: new Date().toISOString().split('T')[0],
      posting_time: new Date().toTimeString().split(' ')[0],
      pos_profile: currentProfile.name,
      company: currentProfile.company,
      period_start_date: new Date().toISOString().split('T')[0],
      period_end_date: new Date().toISOString().split('T')[0],
      docstatus: 0,
      status: 'Draft'
    });
  };

  const updatePaymentAmount = (index: number, field: 'opening_amount' | 'expected_amount', value: number) => {
    const updated = [...paymentReconciliation];
    updated[index] = {
      ...updated[index],
      [field]: value,
      difference: field === 'expected_amount' 
        ? value - updated[index].opening_amount
        : updated[index].expected_amount - value
    };
    setPaymentReconciliation(updated);
  };

  const handleSubmitClosing = async () => {
    if (!currentProfile) return;

    setIsSubmitting(true);
    try {
      const closingEntry: POSClosingEntry = {
        ...closingData,
        user: 'Administrator', // TODO: Get current user
        total_quantity: salesSummary.totalQuantity,
        net_total: salesSummary.netTotal,
        total_taxes_and_charges: salesSummary.totalTaxes,
        grand_total: salesSummary.grandTotal,
        payment_reconciliation: paymentReconciliation,
        docstatus: 1,
        status: 'Submitted'
      } as POSClosingEntry;

      // TODO: Save closing entry to server
      console.log('Submitting POS closing:', closingEntry);
      
      // Close the interface
      onClose();
    } catch (error) {
      console.error('Failed to submit POS closing:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTotalDifference = () => {
    return paymentReconciliation.reduce((sum, payment) => sum + payment.difference, 0);
  };

  const hasDiscrepancies = () => {
    return paymentReconciliation.some(payment => Math.abs(payment.difference) > 0.01);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">POS Closing Entry</h2>
              <p className="text-sm text-gray-600 mt-1">
                {currentProfile?.pos_profile_name} - {new Date().toLocaleDateString()}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Summary */}
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Sales Summary
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <ShoppingBag className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Transactions</span>
                    </div>
                    <div className="text-xl font-semibold text-gray-900 mt-1">
                      {salesSummary.totalTransactions}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Items Sold</span>
                    </div>
                    <div className="text-xl font-semibold text-gray-900 mt-1">
                      {salesSummary.totalQuantity}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Net Total:</span>
                    <span className="font-medium">₹{salesSummary.netTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Taxes:</span>
                    <span className="font-medium">₹{salesSummary.totalTaxes.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Discount:</span>
                    <span className="font-medium text-green-600">-₹{salesSummary.totalDiscount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Grand Total:</span>
                    <span className="font-semibold text-lg">₹{salesSummary.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Reconciliation */}
            <div className="space-y-6">
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-4 flex items-center">
                  <Calculator className="w-5 h-5 mr-2" />
                  Payment Reconciliation
                </h3>
                
                <div className="space-y-4">
                  {paymentReconciliation.map((payment, index) => (
                    <PaymentReconciliationRow
                      key={payment.mode_of_payment}
                      payment={payment}
                      onUpdateAmount={(field, value) => updatePaymentAmount(index, field, value)}
                    />
                  ))}
                </div>

                {/* Total Difference */}
                <div className="mt-4 pt-4 border-t border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-900">Total Difference:</span>
                    <span className={`font-semibold text-lg ${
                      Math.abs(getTotalDifference()) < 0.01 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      ₹{getTotalDifference().toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Discrepancy Warning */}
                {hasDiscrepancies() && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-700">
                        Payment discrepancies detected. Please verify amounts.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Closing Date: {new Date().toLocaleDateString()} | 
              Profile: {currentProfile?.pos_profile_name}
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitClosing}
                disabled={isSubmitting}
                className="flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Submit Closing</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PaymentReconciliationRowProps {
  payment: POSClosingPayment;
  onUpdateAmount: (field: 'opening_amount' | 'expected_amount', value: number) => void;
}

function PaymentReconciliationRow({ payment, onUpdateAmount }: PaymentReconciliationRowProps) {
  return (
    <div className="bg-white rounded-lg p-3 border border-green-200">
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-gray-900">{payment.mode_of_payment}</span>
        <span className={`text-sm font-medium ${
          Math.abs(payment.difference) < 0.01 
            ? 'text-green-600' 
            : 'text-red-600'
        }`}>
          {payment.difference >= 0 ? '+' : ''}₹{payment.difference.toFixed(2)}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Opening Amount</label>
          <Input
            type="number"
            step="0.01"
            value={payment.opening_amount}
            onChange={(e) => onUpdateAmount('opening_amount', parseFloat(e.target.value) || 0)}
            className="text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Expected Amount</label>
          <Input
            type="number"
            step="0.01"
            value={payment.expected_amount}
            onChange={(e) => onUpdateAmount('expected_amount', parseFloat(e.target.value) || 0)}
            className="text-sm"
          />
        </div>
      </div>
    </div>
  );
}