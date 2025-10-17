'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Printer, 
  Download, 
  Mail, 
  ArrowLeft, 
  Check,
  ShoppingBag
} from 'lucide-react';
import { usePOSStore } from '@/stores/pos';
import { POSTransaction } from '@/types/pos';

export function ReceiptInterface() {
  const { 
    currentTransaction, 
    currentProfile, 
    selectedCustomer,
    clearCart,
    printReceipt 
  } = usePOSStore();

  const receiptRef = useRef<HTMLDivElement>(null);

  if (!currentTransaction) return null;

  const handlePrint = async () => {
    try {
      await printReceipt(currentTransaction);
      // For now, use browser print
      window.print();
    } catch (error) {
      console.error('Print failed:', error);
    }
  };

  const handleNewSale = () => {
    clearCart();
    usePOSStore.setState({ 
      currentView: 'products',
      currentTransaction: null 
    });
  };

  const handleEmailReceipt = () => {
    // TODO: Implement email receipt functionality
    console.log('Email receipt');
  };

  const handleDownloadReceipt = () => {
    // TODO: Implement PDF download
    console.log('Download receipt');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Payment Successful</h2>
              <p className="text-sm text-gray-600">Transaction completed successfully</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleEmailReceipt}>
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
            <Button variant="outline" onClick={handleDownloadReceipt}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Receipt Preview */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-md mx-auto">
            <ReceiptPreview 
              ref={receiptRef}
              transaction={currentTransaction}
              profile={currentProfile}
              customer={selectedCustomer}
            />
          </div>
        </div>

        {/* Actions Panel */}
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Transaction Complete</h3>
              <p className="text-sm text-gray-600 mt-1">
                Invoice #{currentTransaction.name || 'DRAFT'}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-semibold">₹{currentTransaction.grand_total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paid Amount:</span>
                <span className="font-semibold">₹{currentTransaction.paid_amount.toFixed(2)}</span>
              </div>
              {currentTransaction.change_amount > 0 && (
                <div className="flex justify-between text-blue-600 border-t pt-2">
                  <span>Change Given:</span>
                  <span className="font-semibold">₹{currentTransaction.change_amount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Button onClick={handlePrint} className="w-full">
                <Printer className="w-4 h-4 mr-2" />
                Print Receipt
              </Button>
              
              <Button variant="outline" onClick={handleEmailReceipt} className="w-full">
                <Mail className="w-4 h-4 mr-2" />
                Email to Customer
              </Button>
              
              <Button variant="outline" onClick={handleDownloadReceipt} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>

            <div className="border-t pt-4">
              <Button onClick={handleNewSale} className="w-full" variant="default">
                <ShoppingBag className="w-4 h-4 mr-2" />
                New Sale
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ReceiptPreviewProps {
  transaction: POSTransaction;
  profile: any;
  customer: any;
}

const ReceiptPreview = React.forwardRef<HTMLDivElement, ReceiptPreviewProps>(
  ({ transaction, profile, customer }, ref) => {
    const currentDate = new Date();
    
    return (
      <div 
        ref={ref} 
        className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm print:shadow-none print:border-none"
        style={{ width: '80mm', fontSize: '12px' }}
      >
        {/* Header */}
        <div className="text-center border-b border-gray-200 pb-4 mb-4">
          <h1 className="text-lg font-bold">{profile?.company || 'Company Name'}</h1>
          <p className="text-xs text-gray-600 mt-1">
            {profile?.warehouse || 'Main Warehouse'}
          </p>
          <p className="text-xs text-gray-600">
            GST: {profile?.tax_id || 'XXXXXXXXXXXXXXXXX'}
          </p>
        </div>

        {/* Transaction Info */}
        <div className="space-y-1 text-xs mb-4">
          <div className="flex justify-between">
            <span>Invoice #:</span>
            <span className="font-medium">{transaction.name || 'DRAFT'}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{currentDate.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Time:</span>
            <span>{currentDate.toLocaleTimeString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Customer:</span>
            <span>{customer?.customer_name || 'Walk-In Customer'}</span>
          </div>
        </div>

        {/* Items */}
        <div className="border-t border-b border-gray-200 py-2 mb-4">
          <div className="text-xs font-semibold mb-2">ITEMS</div>
          {transaction.items.map((item, index) => (
            <div key={index} className="mb-2">
              <div className="flex justify-between">
                <span className="text-xs">{item.item_name}</span>
                <span className="text-xs">₹{(item.rate * item.qty).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span className="text-xs">{item.qty} x ₹{item.rate.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-1 text-xs mb-4">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{transaction.net_total.toFixed(2)}</span>
          </div>
          {transaction.discount_amount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount:</span>
              <span>-₹{transaction.discount_amount.toFixed(2)}</span>
            </div>
          )}
          {transaction.total_taxes_and_charges > 0 && (
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>₹{transaction.total_taxes_and_charges.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold border-t pt-1">
            <span>TOTAL:</span>
            <span>₹{transaction.grand_total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="border-t border-gray-200 pt-2 mb-4">
          <div className="text-xs font-semibold mb-2">PAYMENT</div>
          {transaction.payments.map((payment, index) => (
            <div key={index} className="flex justify-between text-xs">
              <span>{payment.mode_of_payment}:</span>
              <span>₹{payment.amount.toFixed(2)}</span>
            </div>
          ))}
          {transaction.change_amount > 0 && (
            <div className="flex justify-between text-xs font-semibold mt-1 pt-1 border-t">
              <span>Change:</span>
              <span>₹{transaction.change_amount.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-600 border-t pt-2">
          <p>Thank you for your business!</p>
          <p className="mt-1">Visit us again</p>
        </div>
      </div>
    );
  }
);

ReceiptPreview.displayName = 'ReceiptPreview';