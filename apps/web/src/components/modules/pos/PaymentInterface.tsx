'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Calculator,
  ArrowLeft,
  Check,
  X,
  Plus,
  Minus
} from 'lucide-react';
import { usePOSStore } from '@/stores/pos';
import { POSPayment, POSPaymentMethod } from '@/types/pos';

export function PaymentInterface() {
  const { 
    cartTotal, 
    paymentMethods, 
    processPayment, 
    currentView,
    cartItems,
    selectedCustomer 
  } = usePOSStore();

  const [payments, setPayments] = useState<POSPayment[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<POSPaymentMethod | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showNumpad, setShowNumpad] = useState(false);

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = cartTotal - totalPaid;
  const changeAmount = Math.max(0, totalPaid - cartTotal);

  useEffect(() => {
    // Auto-select first payment method
    if (paymentMethods.length > 0 && !selectedMethod) {
      setSelectedMethod(paymentMethods[0]);
    }
  }, [paymentMethods, selectedMethod]);

  const handleAddPayment = () => {
    if (!selectedMethod || !paymentAmount || parseFloat(paymentAmount) <= 0) return;

    const amount = parseFloat(paymentAmount);
    const newPayment: POSPayment = {
      mode_of_payment: selectedMethod.mode_of_payment,
      account: selectedMethod.account,
      amount: Math.min(amount, remainingAmount),
      type: selectedMethod.type,
    };

    setPayments([...payments, newPayment]);
    setPaymentAmount('');
  };

  const handleRemovePayment = (index: number) => {
    const updatedPayments = payments.filter((_, i) => i !== index);
    setPayments(updatedPayments);
  };

  const handleQuickAmount = (amount: number) => {
    setPaymentAmount(amount.toString());
  };

  const handleNumpadInput = (value: string) => {
    if (value === 'clear') {
      setPaymentAmount('');
    } else if (value === 'backspace') {
      setPaymentAmount(prev => prev.slice(0, -1));
    } else {
      setPaymentAmount(prev => prev + value);
    }
  };

  const handleCompletePayment = async () => {
    if (remainingAmount > 0.01) return; // Allow small rounding differences

    setIsProcessing(true);
    try {
      await processPayment(payments);
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExactAmount = () => {
    setPaymentAmount(remainingAmount.toFixed(2));
  };

  if (currentView !== 'payment') return null;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => usePOSStore.setState({ currentView: 'products' })}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cart
            </Button>
            <h2 className="text-xl font-semibold text-gray-900">Payment</h2>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Customer</div>
            <div className="font-medium">{(selectedCustomer as any)?.customer_name || 'Walk-In Customer'}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Payment Methods and Amount */}
        <div className="flex-1 p-6 space-y-6">
          {/* Payment Summary */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-lg">
                <span>Total Amount:</span>
                <span className="font-semibold">₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Paid Amount:</span>
                <span className="font-semibold">₹{totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Remaining:</span>
                <span className="font-semibold">₹{remainingAmount.toFixed(2)}</span>
              </div>
              {changeAmount > 0 && (
                <div className="flex justify-between text-blue-600 border-t pt-2">
                  <span>Change:</span>
                  <span className="font-semibold">₹{changeAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <PaymentMethodCard
                  key={(method as any).mode_of_payment}
                  method={method}
                  isSelected={(selectedMethod as any)?.mode_of_payment === (method as any).mode_of_payment}
                  onSelect={() => setSelectedMethod(method)}
                />
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Enter Amount</h3>
            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="pl-8 text-xl py-3"
                  step="0.01"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  onClick={handleExactAmount}
                  disabled={remainingAmount <= 0}
                >
                  Exact
                </Button>
                <Button variant="outline" onClick={() => handleQuickAmount(100)}>
                  ₹100
                </Button>
                <Button variant="outline" onClick={() => handleQuickAmount(500)}>
                  ₹500
                </Button>
                <Button variant="outline" onClick={() => handleQuickAmount(1000)}>
                  ₹1000
                </Button>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleAddPayment}
                  disabled={!selectedMethod || !paymentAmount || parseFloat(paymentAmount) <= 0}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNumpad(!showNumpad)}
                >
                  <Calculator className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Numpad */}
          {showNumpad && (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <NumericKeypad onInput={handleNumpadInput} />
            </div>
          )}
        </div>

        {/* Right Panel - Payment List and Complete */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          {/* Payment List */}
          <div className="flex-1 p-6">
            <h3 className="text-lg font-semibold mb-4">Payments Added</h3>
            {payments.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No payments added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment, index) => (
                  <PaymentItem
                    key={index}
                    payment={payment}
                    onRemove={() => handleRemovePayment(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Complete Payment Button */}
          <div className="border-t border-gray-200 p-6">
            <Button
              onClick={handleCompletePayment}
              disabled={remainingAmount > 0.01 || isProcessing || payments.length === 0}
              className="w-full py-4 text-lg font-semibold"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Complete Payment
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PaymentMethodCardProps {
  method: POSPaymentMethod;
  isSelected: boolean;
  onSelect: () => void;
}

function PaymentMethodCard({ method, isSelected, onSelect }: PaymentMethodCardProps) {
  const getIcon = () => {
    switch (method.type) {
      case 'Cash':
        return <Banknote className="w-6 h-6" />;
      case 'Bank':
        return <CreditCard className="w-6 h-6" />;
      default:
        return <Smartphone className="w-6 h-6" />;
    }
  };

  return (
    <button
      onClick={onSelect}
      className={`p-4 rounded-lg border-2 transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-50 text-blue-700'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex flex-col items-center space-y-2">
        {getIcon()}
        <span className="font-medium text-sm">{method.mode_of_payment}</span>
      </div>
    </button>
  );
}

interface PaymentItemProps {
  payment: POSPayment;
  onRemove: () => void;
}

function PaymentItem({ payment, onRemove }: PaymentItemProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <div className="font-medium">{payment.mode_of_payment}</div>
        <div className="text-sm text-gray-600">₹{payment.amount.toFixed(2)}</div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-red-600 hover:text-red-700"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

interface NumericKeypadProps {
  onInput: (value: string) => void;
}

function NumericKeypad({ onInput }: NumericKeypadProps) {
  const keys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['0', '.', 'backspace'],
  ];

  return (
    <div className="space-y-2">
      {keys.map((row, rowIndex) => (
        <div key={rowIndex} className="flex space-x-2">
          {row.map((key) => (
            <Button
              key={key}
              variant="outline"
              onClick={() => onInput(key)}
              className="flex-1 h-12 text-lg font-semibold"
            >
              {key === 'backspace' ? <Minus className="w-4 h-4" /> : key}
            </Button>
          ))}
        </div>
      ))}
      <Button
        variant="outline"
        onClick={() => onInput('clear')}
        className="w-full h-12 text-lg font-semibold"
      >
        Clear
      </Button>
    </div>
  );
}