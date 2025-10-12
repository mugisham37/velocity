'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  CreditCard,
  Gift,
  Minus,
  Plus,
  Printer,
  Scan,
  ShoppingCart,
  Trash2,
  User,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Separator } from '@/components/ui/separator';

interface POSItem {
  id: string;
  itemCode: string;
  itemName: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  lineTotal: number;
  serialNumbers?: string[];
}

interface PaymentMethod {
  type: 'CASH' | 'CARD' | 'MOBILE_PAYMENT' | 'GIFT_CARD';
  amount: number;
  reference?: string;
  cardType?: string;
  cardLast4?: string;
}

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  loyaltyPoints?: number;
}

export default function POSPage() {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(true);
  const [cart, setCart] = useState<POSItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [barcode, setBarcode] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState(0);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalDiscount = cart.reduce((sum, item) => sum + item.discountAmount, 0);
  const totalTax = cart.reduce((sum, item) => sum + item.taxAmount, 0);
  const grandTotal = subtotal - totalDiscount + totalTax;
  const totalPaid = paymentMethods.reduce((sum, pm) => sum + pm.amount, 0);
  const changeAmount = Math.max(0, totalPaid - grandTotal);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Barcode scanning simulation
  const handleBarcodeSearch = async () => {
    if (!barcode.trim()) return;

    try {
      // Mock item lookup - in real app, this would call the GraphQL API
      const mockItem: POSItem = {
        id: `item-${Date.now()}`,
        itemCode: 'ITEM001',
        itemName: 'Sample Product',
        barcode: barcode,
        quantity: 1,
        unitPrice: 19.99,
        discountPercent: 0,
        discountAmount: 0,
        taxPercent: 8.25,
        taxAmount: 1.65,
        lineTotal: 21.64,
      };

      addToCart(mockItem);
      setBarcode('');

      toast({
        title: 'Item Added',
        description: `${mockItem.itemName} added to cart`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Item not found',
        variant: 'destructive',
      });
    }
  };

  const addToCart = (item: POSItem) => {
    const existingItem = cart.find(cartItem => cartItem.itemCode === item.itemCode);

    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      setCart([...cart, item]);
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(cart.map(item => {
      if (item.id === itemId) {
        const lineTotal = newQuantity * item.unitPrice - item.discountAmount + item.taxAmount;
        return { ...item, quantity: newQuantity, lineTotal };
      }
      return item;
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const addPaymentMethod = (method: PaymentMethod) => {
    setPaymentMethods([...paymentMethods, method]);
  };

  const removePaymentMethod = (index: number) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
  };

  const processSale = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Error',
        description: 'Cart is empty',
        variant: 'destructive',
      });
      return;
    }

    if (Math.abs(totalPaid - grandTotal) > 0.01) {
      toast({
        title: 'Error',
        description: 'Payment amount does not match total',
        variant: 'destructive',
      });
      return;
    }

    // Mock sale processing - in real app, this would call the GraphQL API
    const saleData = {
      posProfileId: 'default-profile',
      customerId: customer?.id,
      customerName: customer?.name,
      customerPhone: customer?.phone,
      customerEmail: customer?.email,
      items: cart,
      paymentMethods,
      loyaltyPointsRedeemed: loyaltyPointsToRedeem,
      isOffline: !isOnline,
    };

    try {

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Clear cart and reset
      setCart([]);
      setCustomer(null);
      setPaymentMethods([]);
      setShowPayment(false);
      setLoyaltyPointsToRedeem(0);

      toast({
        title: 'Sale Completed',
        description: `Invoice processed successfully. Change: $${changeAmount.toFixed(2)}`,
      });

      // Print receipt if configured
      printReceipt();
    } catch (error) {
      if (!isOnline) {
        // Store offline transaction
        storeOfflineTransaction(saleData);
        toast({
          title: 'Offline Sale Stored',
          description: 'Sale will be synced when online',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to process sale',
          variant: 'destructive',
        });
      }
    }
  };

  const storeOfflineTransaction = (saleData: any) => {
    // Store in localStorage for offline sync
    const offlineTransactions = JSON.parse(
      localStorage.getItem('offlineTransactions') || '[]'
    );

    offlineTransactions.push({
      localId: `offline-${Date.now()}`,
      saleData,
      timestamp: new Date().toISOString(),
      deviceId: navigator.userAgent,
    });

    localStorage.setItem('offlineTransactions', JSON.stringify(offlineTransactions));
  };

  const printReceipt = () => {
    // Mock receipt printing
    toast({
      title: 'Receipt Printed',
      description: 'Receipt sent to printer',
    });
  };

  const syncOfflineTransactions = async () => {
    const offlineTransactions = JSON.parse(
      localStorage.getItem('offlineTransactions') || '[]'
    );

    if (offlineTransactions.length === 0) {
      toast({
        title: 'No Offline Transactions',
        description: 'All transactions are synced',
      });
      return;
    }

    try {
      // Mock sync - in real app, this would call the GraphQL API
      await new Promise(resolve => setTimeout(resolve, 2000));

      localStorage.removeItem('offlineTransactions');

      toast({
        title: 'Sync Complete',
        description: `${offlineTransactions.length} transactions synced`,
      });
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync offline transactions',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold">Point of Sale</h1>
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? <Wifi className="w-4 h-4 mr-1" /> : <WifiOff className="w-4 h-4 mr-1" />}
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={syncOfflineTransactions}>
              Sync Offline
            </Button>
            <Button variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Print Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Product Search & Cart */}
          <div className="lg:col-span-2 space-y-6">
            {/* Barcode Scanner */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Scan className="w-5 h-5 mr-2" />
                  Product Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Scan barcode or enter item code"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleBarcodeSearch}>
                    <Scan className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Shopping Cart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Shopping Cart ({cart.length} items)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Cart is empty. Scan items to add them.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.itemName}</h4>
                          <p className="text-sm text-gray-500">{item.itemCode}</p>
                          <p className="text-sm font-medium">${item.unitPrice.toFixed(2)} each</p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>

                          <span className="w-12 text-center font-medium">{item.quantity}</span>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="text-right ml-4">
                          <p className="font-medium">${item.lineTotal.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Customer & Payment */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customer ? (
                  <div className="space-y-2">
                    <p className="font-medium">{customer.name}</p>
                    {customer.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
                    {customer.loyaltyPoints && (
                      <Badge variant="secondary">
                        <Gift className="w-3 h-3 mr-1" />
                        {customer.loyaltyPoints} points
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCustomer(null)}
                    >
                      Clear Customer
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input placeholder="Search customer..." />
                    <Button size="sm" variant="outline" className="w-full">
                      Add Walk-in Customer
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-${totalDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${totalTax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>

                {loyaltyPointsToRedeem > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Loyalty Discount:</span>
                    <span>-${(loyaltyPointsToRedeem * 0.01).toFixed(2)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment */}
            {showPayment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => addPaymentMethod({ type: 'CASH', amount: grandTotal })}
                    >
                      Cash
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => addPaymentMethod({ type: 'CARD', amount: grandTotal })}
                    >
                      Card
                    </Button>
                  </div>

                  {paymentMethods.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Payment Methods:</h4>
                      {paymentMethods.map((pm, index) => (
                        <div key={index} className="flex justify-between items-center p-2 border rounded">
                          <span>{pm.type}: ${pm.amount.toFixed(2)}</span>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removePaymentMethod(index)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}

                      <div className="flex justify-between font-medium">
                        <span>Paid:</span>
                        <span>${totalPaid.toFixed(2)}</span>
                      </div>

                      {changeAmount > 0 && (
                        <div className="flex justify-between font-bold text-green-600">
                          <span>Change:</span>
                          <span>${changeAmount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              {!showPayment ? (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setShowPayment(true)}
                  disabled={cart.length === 0}
                >
                  Proceed to Payment
                </Button>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={processSale}
                  disabled={Math.abs(totalPaid - grandTotal) > 0.01}
                >
                  Complete Sale
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setCart([]);
                  setShowPayment(false);
                  setPaymentMethods([]);
                }}
                disabled={cart.length === 0}
              >
                Clear Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
