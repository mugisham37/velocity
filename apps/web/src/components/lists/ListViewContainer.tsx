'use client';

import React, { useCallback, useMemo } from 'react';
import { ListView, ListViewColumn } from './ListView';
import { ListFilters } from './ListFilters';
import { ListPagination } from './ListPagination';
import { VirtualizedList } from './VirtualizedList';
import { ListCustomization } from './ListCustomization';
import { useListView } from '@/hooks/useListView';
import { useListCustomization } from '@/hooks/useListCustomization';
import { useDocumentMeta } from '@/hooks/useDocuments';
import { FilterCondition, SortCondition, DocumentListItem, DocField } from '@/types';
import styles from './ListViewContainer.module.css';

export interface ListViewContainerProps {
  doctype: string;
  fields?: string[];
  initialFilters?: FilterCondition[];
  initialSort?: SortCondition[];
  pageSize?: number;
  useVirtualization?: boolean;
  virtualizationThreshold?: number;
  onRowClick?: (doc: DocumentListItem) => void;
  onBulkAction?: (action: string, selection: string[]) => void;
}

export function ListViewContainer({
  doctype,
  fields,
  initialFilters,
  initialSort,
  pageSize = 20,
  useVirtualization = false,
  virtualizationThreshold = 100,
  onRowClick,
  onBulkAction,
}: ListViewContainerProps) {
  // Get document metadata to build columns
  const { meta, isLoading: isMetaLoading } = useDocumentMeta(doctype);
  
  // Use customization hook
  const {
    settings: customizationSettings,
    updateSettings: updateCustomizationSettings,
    saveSettings: saveCustomizationSettings,
    loadSettings: loadCustomizationSettings,
    savedSettings: savedCustomizationSettings,
  } = useListCustomization({
    doctype,
    defaultSettings: {
      visibleColumns: fields || ['name'],
    },
  });
  
  // Use list view hook for data and state management
  const {
    data,
    totalCount,
    isLoading,
    filters,
    sort,
    pagination,
    selection,
    setFilters,
    setSort,
    setPage,
    setPageSize,
    setSelection,
  } = useListView({
    doctype,
    initialFilters,
    initialSort,
    initialPageSize: pageSize,
    fields: customizationSettings.visibleColumns,
  });

  // Build columns from metadata and customization settings
  const columns = useMemo((): ListViewColumn[] => {
    if (!meta || !meta.fields) return [];
    
    // Use customization settings for visible columns
    const visibleFields = customizationSettings.visibleColumns;
    const metaFields = (meta.fields as DocField[]) || [];
    
    // Order columns according to customization settings
    const orderedFields = customizationSettings.columnOrder.length > 0
      ? customizationSettings.columnOrder.filter(fieldname => visibleFields.includes(fieldname))
      : visibleFields;
    
    return orderedFields.map(fieldname => {
      const field = metaFields.find((f: DocField) => f.fieldname === fieldname);
      if (!field) {
        // Fallback for 'name' field or other standard fields
        return {
          fieldname,
          label: fieldname === 'name' ? 'Name' : fieldname,
          fieldtype: 'Data',
          sortable: true,
          width: customizationSettings.columnWidths[fieldname],
        };
      }
      
      return {
        fieldname: field.fieldname,
        label: field.label,
        fieldtype: field.fieldtype,
        sortable: !['Text Editor', 'Attach', 'Table'].includes(field.fieldtype),
        width: customizationSettings.columnWidths[fieldname] || getColumnWidth(field.fieldtype),
      };
    });
  }, [meta, customizationSettings]);

  // Handle sorting
  const handleSort = useCallback((newSort: SortCondition[]) => {
    setSort(newSort);
  }, [setSort]);

  // Handle filtering
  const handleFilter = useCallback((newFilters: FilterCondition[]) => {
    setFilters(newFilters);
  }, [setFilters]);

  // Handle selection
  const handleSelect = useCallback((newSelection: string[]) => {
    setSelection(newSelection);
  }, [setSelection]);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    setPage(page);
  }, [setPage]);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
  }, [setPageSize]);

  // Handle bulk actions
  const handleBulkAction = useCallback((action: string, selectedItems: string[]) => {
    if (onBulkAction) {
      onBulkAction(action, selectedItems);
    } else {
      // Default bulk actions
      switch (action) {
        case 'delete':
          console.log('Delete selected items:', selectedItems);
          break;
        case 'export':
          console.log('Export selected items:', selectedItems);
          break;
        default:
          console.log('Unknown bulk action:', action, selectedItems);
      }
    }
  }, [onBulkAction]);

  // Determine if we should use virtualization
  const shouldUseVirtualization = useVirtualization || totalCount > virtualizationThreshold;

  if (isMetaLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading {doctype} metadata...</div>
      </div>
    );
  }

  return (
    <div className={styles.listViewContainer}>
      <div className={styles.listHeaderControls}>
        <ListFilters
          fields={(meta?.fields as DocField[]) || []}
          filters={filters}
          onFiltersChange={handleFilter}
        />
        
        <ListCustomization
          doctype={doctype}
          fields={(meta?.fields as DocField[]) || []}
          currentSettings={customizationSettings}
          onSettingsChange={updateCustomizationSettings}
          onSaveSettings={saveCustomizationSettings}
          onLoadSettings={loadCustomizationSettings}
          savedSettings={savedCustomizationSettings}
        />
      </div>
      
      {shouldUseVirtualization ? (
        <VirtualizedList
          data={data}
          columns={columns}
          selection={selection}
          onRowClick={onRowClick}
          onSelect={handleSelect}
        />
      ) : (
        <ListView
          doctype={doctype}
          data={data}
          columns={columns}
          totalCount={totalCount}
          isLoading={isLoading}
          filters={filters}
          sort={sort}
          selection={selection}
          onSort={handleSort}
          onFilter={handleFilter}
          onSelect={handleSelect}
          onRowClick={onRowClick}
          onBulkAction={handleBulkAction}
        />
      )}
      
      <ListPagination
        pagination={pagination}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}

// Helper function to determine column width based on field type
function getColumnWidth(fieldtype: string): number | undefined {
  switch (fieldtype) {
    case 'Check':
      return 60;
    case 'Date':
      return 120;
    case 'Datetime':
      return 160;
    case 'Currency':
    case 'Float':
    case 'Int':
      return 100;
    case 'Link':
      return 150;
    case 'Select':
      return 120;
    default:
      return undefined; // Auto width
  }
}