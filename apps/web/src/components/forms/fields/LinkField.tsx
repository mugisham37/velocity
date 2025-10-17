'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { DocField } from '@/types';
import { cn } from '@/lib/utils';
import { SearchIcon, ExternalLinkIcon, XIcon } from 'lucide-react';

interface LinkFieldProps {
  field: DocField;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
}

interface LinkOption {
  name: string;
  title?: string;
  description?: string;
}

export function LinkField({ field, error, required, readOnly }: LinkFieldProps) {
  const { register, setValue, watch } = useFormContext();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<LinkOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const value = watch(field.fieldname);
  const linkedDoctype = field.options; // The linked DocType

  // Mock data for demonstration - in real implementation, this would fetch from API
  const mockOptions: LinkOption[] = [
    { name: 'CUST-001', title: 'John Doe', description: 'Individual Customer' },
    { name: 'CUST-002', title: 'ABC Corp', description: 'Corporate Customer' },
    { name: 'CUST-003', title: 'XYZ Ltd', description: 'Limited Company' },
  ];

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Simulate API call to fetch options
  const fetchOptions = async (search: string) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // In real implementation, this would be an API call to Frappe
    const filtered = mockOptions.filter(option =>
      option.name.toLowerCase().includes(search.toLowerCase()) ||
      option.title?.toLowerCase().includes(search.toLowerCase())
    );
    
    setOptions(filtered);
    setIsLoading(false);
  };

  // Handle search input changes
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    
    if (newSearchTerm.length >= 2) {
      fetchOptions(newSearchTerm);
      setIsOpen(true);
    } else {
      setOptions([]);
      setIsOpen(false);
    }
  };

  // Handle option selection
  const handleOptionSelect = (option: LinkOption) => {
    setValue(field.fieldname, option.name, { shouldDirty: true });
    setSearchTerm(option.title || option.name);
    setIsOpen(false);
  };

  // Handle clear selection
  const handleClear = () => {
    setValue(field.fieldname, '', { shouldDirty: true });
    setSearchTerm('');
    setOptions([]);
    setIsOpen(false);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update search term when value changes externally
  useEffect(() => {
    if (value && !searchTerm) {
      // Find the option that matches the current value
      const matchedOption = mockOptions.find(opt => opt.name === value);
      if (matchedOption) {
        setSearchTerm(matchedOption.title || matchedOption.name);
      } else {
        setSearchTerm(value);
      }
    }
  }, [value, searchTerm]);

  return (
    <div className="space-y-1">
      <label
        htmlFor={field.fieldname}
        className={cn(
          'block text-sm font-medium text-gray-700',
          required && 'after:content-["*"] after:text-red-500 after:ml-1'
        )}
      >
        {field.label}
      </label>
      
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={`Search ${linkedDoctype || 'records'}...`}
            readOnly={readOnly}
            className={cn(
              'block w-full rounded-md border-gray-300 shadow-sm',
              'focus:border-blue-500 focus:ring-blue-500',
              'disabled:bg-gray-50 disabled:text-gray-500',
              readOnly && 'bg-gray-50 text-gray-500 cursor-not-allowed',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
              'text-sm pl-10 pr-20 py-2 border'
            )}
          />
          
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon className="h-4 w-4 text-gray-400" />
          </div>
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                title="Clear selection"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              title="Open in modal"
            >
              <ExternalLinkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {isLoading ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                Searching...
              </div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.name}
                  type="button"
                  onClick={() => handleOptionSelect(option)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                >
                  <div className="text-sm font-medium text-gray-900">
                    {option.name}
                  </div>
                  {option.title && (
                    <div className="text-sm text-gray-600">
                      {option.title}
                    </div>
                  )}
                  {option.description && (
                    <div className="text-xs text-gray-500">
                      {option.description}
                    </div>
                  )}
                </button>
              ))
            ) : searchTerm.length >= 2 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No results found
              </div>
            ) : null}
          </div>
        )}
      </div>
      
      {/* Hidden input for form registration */}
      <input
        type="hidden"
        {...register(field.fieldname)}
      />
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {/* Modal for advanced selection (placeholder) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Select {linkedDoctype}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Advanced selection modal would be implemented here with full list view functionality.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}