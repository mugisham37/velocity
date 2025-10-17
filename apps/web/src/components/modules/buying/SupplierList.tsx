'use client';

import React from 'react';
import { Supplier } from '@/types/buying';
import { useDocumentList } from '@/hooks/useDocuments';

interface SupplierListProps {
  onEdit?: (supplier: Supplier) => void;
  onView?: (supplier: Supplier) => void;
}

export default function SupplierList({ onEdit, onView }: SupplierListProps) {
  const { data: suppliers, isLoading } = useDocumentList('Supplier');

  if (isLoading) {
    return <div>Loading suppliers...</div>;
  }

  // Type guard to check if supplier data has required properties
  const isValidSupplier = (supplier: any): supplier is Supplier => {
    return supplier && 
           typeof supplier.name === 'string' &&
           typeof supplier.supplier_name === 'string';
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Suppliers</h2>
      <div className="grid gap-4">
        {suppliers.map((supplierData) => {
          // Convert to proper Supplier type with validation
          const supplier: Supplier = {
            name: supplierData.name as string,
            supplier_name: (supplierData as any).supplier_name || 'Unknown Supplier',
            supplier_type: (supplierData as any).supplier_type || 'Company',
            supplier_group: (supplierData as any).supplier_group || 'Default',
            country: (supplierData as any).country || 'India',
            default_currency: (supplierData as any).default_currency || 'INR',
            default_price_list: (supplierData as any).default_price_list || 'Standard Buying',
            payment_terms: (supplierData as any).payment_terms,
            is_frozen: (supplierData as any).is_frozen || false,
            disabled: (supplierData as any).disabled || false,
            email_id: (supplierData as any).email_id,
            mobile_no: (supplierData as any).mobile_no,
            phone: (supplierData as any).phone,
            website: (supplierData as any).website,
            supplier_primary_address: (supplierData as any).supplier_primary_address,
            primary_address: (supplierData as any).primary_address,
            supplier_primary_contact: (supplierData as any).supplier_primary_contact,
            tax_id: (supplierData as any).tax_id,
            tax_category: (supplierData as any).tax_category,
            tax_withholding_category: (supplierData as any).tax_withholding_category,
            is_internal_supplier: (supplierData as any).is_internal_supplier || false,
            represents_company: (supplierData as any).represents_company,
            default_buying_cost_center: (supplierData as any).default_buying_cost_center,
            prevent_pos: (supplierData as any).prevent_pos || false,
            hold_type: (supplierData as any).hold_type || 'None',
            release_date: (supplierData as any).release_date,
          };

          return (
            <div key={supplier.name} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{supplier.supplier_name}</h3>
                  <p className="text-sm text-gray-600">Type: {supplier.supplier_type}</p>
                  <p className="text-sm text-gray-600">Email: {supplier.email_id || 'N/A'}</p>
                </div>
                <div className="flex space-x-2">
                  {onView && (
                    <button
                      onClick={() => onView(supplier)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded"
                    >
                      View
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(supplier)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}