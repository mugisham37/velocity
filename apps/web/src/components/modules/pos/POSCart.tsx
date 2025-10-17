'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Calculator,
  Percent,
  Tag
} from 'lucide-react';
import { usePOSStore } from '@/stores/pos';
import { POSCartItem } from '@/types/pos';

export function POSCart() {
  const { 
    cartItems, 
    cartTotal, 
    cartTax, 
    cartDiscount,
    selectedCustomer,
    updateCartItemQuantity, 
    removeCartItem, 
    applyDiscount,
    proceedToPayment,
    clearCart 
  } = usePOSStore();

  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [discountValue, setDiscountValue] = useState('');

  const handleQuantityChange = (itemCode: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeCartItem(itemCode);
    } else {
      updateCartItemQuantity(itemCode, newQuantity);
    }
  };

  const handleApplyDiscount = () => {
    const value = parseFloat(discountValue);
    if (!isNaN(value) && value > 0) {
      applyDiscount(value, discountType);
      setDiscountValue('');
    }
  };

  const handleProceedToPayment = () => {
    if (cartItems.length > 0) {
      proceedToPayment();
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.rate * item.qty), 0);
  const finalTotal = subtotal - cartDiscount + cartTax;

  return (
    <div className="flex flex-col h-full">
      {/* Cart Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Cart</h3>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {cartItems.length}
            </span>
          </div>
          {cartItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-auto">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
            <ShoppingCart className="w-12 h-12 mb-3" />
            <p className="text-center">Your cart is empty</p>
            <p className="text-sm text-center">Scan or select items to add them to cart</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {cartItems.map((item) => (
              <CartItemRow
                key={item.item_code}
                item={item}
                onQuantityChange={(qty) => handleQuantityChange(item.item_code, qty)}
                onRemove={() => removeCartItem(item.item_code)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cart Summary */}
      {cartItems.length > 0 && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Discount Section */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Discount</span>
            </div>
            <div className="flex space-x-2">
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'amount')}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              >
                <option value="percentage">%</option>
                <option value="amount">₹</option>
              </select>
              <Input
                type="number"
                placeholder="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="flex-1 text-sm"
              />
              <Button
                size="sm"
                onClick={handleApplyDiscount}
                disabled={!discountValue || parseFloat(discountValue) <= 0}
              >
                Apply
              </Button>
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            
            {cartDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-₹{cartDiscount.toFixed(2)}</span>
              </div>
            )}
            
            {cartTax > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span>₹{cartTax.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
              <span>Total:</span>
              <span>₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Button */}
          <Button
            onClick={handleProceedToPayment}
            className="w-full py-3 text-lg font-semibold"
            disabled={cartItems.length === 0}
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Pay ₹{finalTotal.toFixed(2)}
          </Button>
        </div>
      )}
    </div>
  );
}

interface CartItemRowProps {
  item: POSCartItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

function CartItemRow({ item, onQuantityChange, onRemove }: CartItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editQuantity, setEditQuantity] = useState(item.qty.toString());

  const handleQuantityEdit = () => {
    const newQty = parseFloat(editQuantity);
    if (!isNaN(newQty) && newQty > 0) {
      onQuantityChange(newQty);
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuantityEdit();
    } else if (e.key === 'Escape') {
      setEditQuantity(item.qty.toString());
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
      {/* Item Info */}
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm truncate">
            {item.item_name}
          </h4>
          <p className="text-xs text-gray-500">{item.item_code}</p>
          <p className="text-xs text-gray-600">₹{item.rate.toFixed(2)} each</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-red-600 hover:text-red-700 p-1"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuantityChange(item.qty - 1)}
            className="w-8 h-8 p-0"
          >
            <Minus className="w-3 h-3" />
          </Button>
          
          {isEditing ? (
            <Input
              type="number"
              value={editQuantity}
              onChange={(e) => setEditQuantity(e.target.value)}
              onBlur={handleQuantityEdit}
              onKeyPress={handleKeyPress}
              className="w-16 h-8 text-center text-sm"
              autoFocus
            />
          ) : (
            <button
              onClick={() => {
                setIsEditing(true);
                setEditQuantity(item.qty.toString());
              }}
              className="w-16 h-8 text-center text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {item.qty}
            </button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuantityChange(item.qty + 1)}
            className="w-8 h-8 p-0"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        {/* Item Total */}
        <div className="font-semibold text-blue-600">
          ₹{(item.rate * item.qty).toFixed(2)}
        </div>
      </div>
    </div>
  );
}