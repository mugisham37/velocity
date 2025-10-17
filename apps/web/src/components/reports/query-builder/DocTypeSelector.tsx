'use client';

import React, { useState, useEffect } from 'react';
import { ReportField, DocTypeRelation } from '@/types/reports';
import { useDocuments } from '@/hooks/useDocuments';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  MagnifyingGlassIcon,
  ChevronDownIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline';

interface DocTypeInfo {
  name: string;
  module: string;
  description?: string;
  is_submittable?: boolean;
  is_tree?: boolean;
}

interface DocTypeSelectorProps {
  selectedDocType: string;
  onDocTypeChange: (doctype: string, fields: ReportField[], relations: DocTypeRelation[]) => void;
}

export function DocTypeSelector({ selectedDocType, onDocTypeChange }: DocTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [docTypes, setDocTypes] = useState<DocTypeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { getList } = useDocuments();
  const { showError } = useNotifications();

  // Load available DocTypes
  useEffect(() => {
    const loadDocTypes = async () => {
      setIsLoading(true);
      try {
        // Get list of DocTypes from Frappe
        const response = await getList('DocType', {
          fields: ['name', 'module', 'description', 'is_submittable', 'is_tree'],
          filters: [
            ['istable', '=', 0], // Exclude child tables
            ['issingle', '=', 0], // Exclude single DocTypes
            ['custom', '=', 0] // Include only standard DocTypes for now
          ],
          order_by: 'name asc',
          limit: 200
        });

        setDocTypes(response.data || []);
      } catch (error) {
        console.error('Failed to load DocTypes:', error);
        showError('Error', 'Failed to load available DocTypes');
      } finally {
        setIsLoading(false);
      }
    };

    loadDocTypes();
  }, [getList, showError]);

  const filteredDocTypes = docTypes.filter(doctype =>
    doctype.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctype.module.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDocTypeSelect = async (doctype: string) => {
    setIsLoading(true);
    try {
      // Get DocType meta information including fields
      const metaResponse = await fetch(`/api/method/frappe.desk.form.meta.get_meta?doctype=${doctype}`);
      const metaData = await metaResponse.json();
      
      if (metaData.message) {
        const fields: ReportField[] = metaData.message.fields
          .filter((field: any) => 
            // Include reportable fields
            !field.hidden && 
            !['Section Break', 'Column Break', 'HTML', 'Button'].includes(field.fieldtype)
          )
          .map((field: any) => ({
            fieldname: field.fieldname,
            label: field.label || field.fieldname,
            fieldtype: field.fieldtype,
            options: field.options,
            doctype: doctype,
            is_virtual: false
          }));

        // Add standard fields
        const standardFields: ReportField[] = [
          { fieldname: 'name', label: 'ID', fieldtype: 'Data', doctype },
          { fieldname: 'creation', label: 'Created On', fieldtype: 'Datetime', doctype },
          { fieldname: 'modified', label: 'Last Modified', fieldtype: 'Datetime', doctype },
          { fieldname: 'owner', label: 'Created By', fieldtype: 'Link', options: 'User', doctype },
          { fieldname: 'modified_by', label: 'Modified By', fieldtype: 'Link', options: 'User', doctype }
        ];

        const allFields = [...standardFields, ...fields];

        // Get related DocTypes (Link fields)
        const relations: DocTypeRelation[] = fields
          .filter((field: ReportField) => field.fieldtype === 'Link' && field.options)
          .map((field: ReportField) => ({
            parent: doctype,
            child: field.options!,
            fieldname: field.fieldname,
            label: field.label,
            type: 'Link' as const
          }));

        onDocTypeChange(doctype, allFields, relations);
      }
    } catch (error) {
      console.error('Failed to load DocType meta:', error);
      showError('Error', 'Failed to load DocType information');
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Selected DocType Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        disabled={isLoading}
      >
        <div className="flex items-center space-x-2">
          <DocumentTextIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900">
            {selectedDocType || 'Select DocType...'}
          </span>
        </div>
        <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search DocTypes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* DocType List */}
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Loading DocTypes...
              </div>
            ) : filteredDocTypes.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No DocTypes found
              </div>
            ) : (
              filteredDocTypes.map((doctype) => (
                <button
                  key={doctype.name}
                  onClick={() => handleDocTypeSelect(doctype.name)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {doctype.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Module: {doctype.module}
                        {doctype.is_submittable && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Submittable
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}