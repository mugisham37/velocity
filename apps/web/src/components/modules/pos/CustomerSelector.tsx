'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, User, Plus, X } from 'lucide-react';
import { usePOSStore } from '@/stores/pos';
import { Customer } from '@/types/crm';

export function CustomerSelector() {
  const { 
    selectedCustomer, 
    searchCustomers, 
    selectCustomer, 
    clearCustomer,
    createQuickCustomer 
  } = usePOSStore();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerMobile, setNewCustomerMobile] = useState('');

  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowNewCustomerForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length >= 2) {
      setIsLoading(true);
      try {
        const results = await searchCustomers(term);
        setCustomers(results);
      } catch (error) {
        console.error('Customer search failed:', error);
        setCustomers([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setCustomers([]);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    selectCustomer(customer);
    setIsOpen(false);
    setSearchTerm('');
    setCustomers([]);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) return;

    try {
      const customer = await createQuickCustomer({
        customer_name: newCustomerName.trim(),
        mobile_no: newCustomerMobile.trim() || undefined
      });
      handleSelectCustomer(customer);
      setNewCustomerName('');
      setNewCustomerMobile('');
      setShowNewCustomerForm(false);
    } catch (error) {
      console.error('Failed to create customer:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Customer Display */}
      {selectedCustomer ? (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{(selectedCustomer as any)?.customer_name}</h4>
              {(selectedCustomer as any)?.mobile_no && (
                <p className="text-sm text-gray-600">{(selectedCustomer as any)?.mobile_no}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCustomer}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        /* Customer Search Input */
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              ref={searchRef}
              type="text"
              placeholder="Search customer or walk-in customer"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setIsOpen(true)}
              className="pl-10 pr-4 py-3 text-base"
            />
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              {/* Walk-in Customer Option */}
              <button
                onClick={() => handleSelectCustomer({
                  name: 'walk-in-customer',
                  customer_name: 'Walk-In Customer',
                  customer_type: 'Individual'
                } as Customer)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 flex items-center space-x-3"
              >
                <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Walk-In Customer</div>
                  <div className="text-sm text-gray-500">No customer details required</div>
                </div>
              </button>

              {/* Search Results */}
              {isLoading ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Searching customers...
                </div>
              ) : customers.length > 0 ? (
                customers.map((customer) => (
                  <button
                    key={customer.name}
                    onClick={() => handleSelectCustomer(customer)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 flex items-center space-x-3"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{customer.customer_name}</div>
                      {customer.mobile_no && (
                        <div className="text-sm text-gray-500">{customer.mobile_no}</div>
                      )}
                    </div>
                  </button>
                ))
              ) : searchTerm.length >= 2 ? (
                <div className="px-4 py-3 text-gray-500 text-center">
                  No customers found
                </div>
              ) : null}

              {/* Create New Customer */}
              {searchTerm.length >= 2 && !showNewCustomerForm && (
                <button
                  onClick={() => setShowNewCustomerForm(true)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-t border-gray-200 flex items-center space-x-3 text-blue-600"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create new customer "{searchTerm}"</span>
                </button>
              )}

              {/* New Customer Form */}
              {showNewCustomerForm && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-3">Create New Customer</h4>
                  <div className="space-y-3">
                    <Input
                      type="text"
                      placeholder="Customer Name"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="w-full"
                    />
                    <Input
                      type="text"
                      placeholder="Mobile Number (Optional)"
                      value={newCustomerMobile}
                      onChange={(e) => setNewCustomerMobile(e.target.value)}
                      className="w-full"
                    />
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleCreateCustomer}
                        disabled={!newCustomerName.trim()}
                        className="flex-1"
                      >
                        Create
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowNewCustomerForm(false);
                          setNewCustomerName('');
                          setNewCustomerMobile('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}