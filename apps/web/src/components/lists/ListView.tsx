'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { FilterCondition, SortCondition, DocumentListItem, ListViewState } from '@/types';
import styles from './ListView.module.css';

export interface ListViewColumn {
  fieldname: string;
  label: string;
  fieldtype: string;
  width?: number;
  sortable?: boolean;
  hidden?: boolean;
}

export interface ListViewProps {
  doctype: string;
  data: DocumentListItem[];
  columns: ListViewColumn[];
  totalCount: number;
  isLoading?: boolean;
  filters?: FilterCondition[];
  sort?: SortCondition[];
  selection?: string[];
  viewMode?: 'list' | 'report' | 'image';
  onSort?: (sort: SortCondition[]) => void;
  onFilter?: (filters: FilterCondition[]) => void;
  onSelect?: (selection: string[]) => void;
  onRowClick?: (doc: DocumentListItem) => void;
  onBulkAction?: (action: string, selection: string[]) => void;
}

export function ListView({
  doctype,
  data,
  columns,
  totalCount,
  isLoading = false,
  filters = [],
  sort = [],
  selection = [],
  viewMode = 'list',
  onSort,
  onFilter,
  onSelect,
  onRowClick,
  onBulkAction,
}: ListViewProps) {
  const [selectAll, setSelectAll] = useState(false);

  // Handle column sorting
  const handleSort = useCallback((fieldname: string) => {
    if (!onSort) return;

    const existingSort = sort.find(s => s.fieldname === fieldname);
    let newSort: SortCondition[];

    if (existingSort) {
      if (existingSort.direction === 'asc') {
        // Change to desc
        newSort = sort.map(s => 
          s.fieldname === fieldname 
            ? { ...s, direction: 'desc' as const }
            : s
        );
      } else {
        // Remove sort
        newSort = sort.filter(s => s.fieldname !== fieldname);
      }
    } else {
      // Add new sort
      newSort = [...sort, { fieldname, direction: 'asc' }];
    }

    onSort(newSort);
  }, [sort, onSort]);

  // Handle row selection
  const handleRowSelect = useCallback((docName: string, checked: boolean) => {
    if (!onSelect) return;

    let newSelection: string[];
    if (checked) {
      newSelection = [...selection, docName];
    } else {
      newSelection = selection.filter(name => name !== docName);
      setSelectAll(false);
    }

    onSelect(newSelection);
  }, [selection, onSelect]);

  // Handle select all
  const handleSelectAll = useCallback((checked: boolean) => {
    if (!onSelect) return;

    setSelectAll(checked);
    if (checked) {
      const allNames = data.map(doc => doc.name);
      onSelect(allNames);
    } else {
      onSelect([]);
    }
  }, [data, onSelect]);

  // Get sort indicator for column
  const getSortIndicator = useCallback((fieldname: string) => {
    const sortCondition = sort.find(s => s.fieldname === fieldname);
    if (!sortCondition) return null;
    
    return sortCondition.direction === 'asc' ? '↑' : '↓';
  }, [sort]);

  // Format cell value based on field type
  const formatCellValue = useCallback((value: unknown, fieldtype: string) => {
    if (value === null || value === undefined) return '';
    
    switch (fieldtype) {
      case 'Date':
        return new Date(value as string).toLocaleDateString();
      case 'Datetime':
        return new Date(value as string).toLocaleString();
      case 'Currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value as number);
      case 'Float':
        return Number(value).toFixed(2);
      case 'Int':
        return Number(value).toLocaleString();
      case 'Check':
        return value ? '✓' : '';
      default:
        return String(value);
    }
  }, []);

  // Visible columns (not hidden)
  const visibleColumns = useMemo(() => 
    columns.filter(col => !col.hidden), 
    [columns]
  );

  if (isLoading) {
    return (
      <div className={`${styles.listView} ${styles.loading}`}>
        <div className={styles.listViewHeader}>
          <div className={styles.listViewTitle}>Loading {doctype}...</div>
        </div>
        <div className={styles.listViewContent}>
          <div className={styles.loadingSkeleton}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.skeletonRow}>
                <div className={styles.skeletonCell}></div>
                <div className={styles.skeletonCell}></div>
                <div className={styles.skeletonCell}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.listView}>
      {/* List Header */}
      <div className={styles.listViewHeader}>
        <div className={styles.listViewTitle}>
          {doctype} ({totalCount})
        </div>
        <div className={styles.listViewActions}>
          {selection.length > 0 && (
            <div className={styles.bulkActions}>
              <span className={styles.selectionCount}>{selection.length} selected</span>
              <button
                className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                onClick={() => onBulkAction?.('delete', selection)}
              >
                Delete
              </button>
              <button
                className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                onClick={() => onBulkAction?.('export', selection)}
              >
                Export
              </button>
            </div>
          )}
        </div>
      </div>

      {/* List Content */}
      <div className={styles.listViewContent}>
        <div className={styles.listTableWrapper}>
          <table className={styles.listTable}>
            <thead>
              <tr>
                <th className={styles.selectColumn}>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className={styles.listCheckbox}
                  />
                </th>
                {visibleColumns.map((column) => (
                  <th
                    key={column.fieldname}
                    className={`${styles.listColumn} ${column.sortable !== false ? styles.sortable : ''}`}
                    style={{ width: column.width ? `${column.width}px` : undefined }}
                    onClick={() => column.sortable !== false && handleSort(column.fieldname)}
                  >
                    <div className={styles.columnHeader}>
                      <span className={styles.columnLabel}>{column.label}</span>
                      {column.sortable !== false && (
                        <span className={styles.sortIndicator}>
                          {getSortIndicator(column.fieldname)}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className={styles.emptyState}>
                    No {doctype} found
                  </td>
                </tr>
              ) : (
                data.map((doc) => (
                  <tr
                    key={doc.name}
                    className={`${styles.listRow} ${selection.includes(doc.name) ? styles.selected : ''}`}
                    onClick={() => onRowClick?.(doc)}
                  >
                    <td className={styles.selectColumn}>
                      <input
                        type="checkbox"
                        checked={selection.includes(doc.name)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleRowSelect(doc.name, e.target.checked);
                        }}
                        className={styles.listCheckbox}
                      />
                    </td>
                    {visibleColumns.map((column) => (
                      <td key={column.fieldname} className={styles.listCell}>
                        <div className={styles.cellContent}>
                          {formatCellValue(doc[column.fieldname], column.fieldtype)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}