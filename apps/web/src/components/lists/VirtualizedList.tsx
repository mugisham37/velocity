'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DocumentListItem } from '@/types';
import { ListViewColumn } from './ListView';
import { useVirtualization } from '@/lib/utils/memoization';
// Removed duplicate import
import styles from './VirtualizedList.module.css';

export interface VirtualizedListProps {
  data: DocumentListItem[];
  columns: ListViewColumn[];
  rowHeight?: number;
  containerHeight?: number;
  overscan?: number;
  selection?: string[];
  onRowClick?: (doc: DocumentListItem) => void;
  onSelect?: (selection: string[]) => void;
  formatCellValue?: (value: unknown, fieldtype: string) => string;
}

export function VirtualizedList({
  data,
  columns,
  rowHeight = 40,
  containerHeight = 400,
  overscan = 5,
  selection = [],
  onRowClick,
  onSelect,
  formatCellValue,
}: VirtualizedListProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Performance monitoring
  // Performance monitoring removed - not critical for functionality

  // Enhanced virtualization with performance optimizations
  const { visibleRange, totalHeight, offsetY } = useVirtualization({
    itemCount: data.length,
    itemHeight: rowHeight,
    containerHeight,
    overscan,
  });

  // Get visible items
  const visibleItems = useMemo(() => {
    return data.slice(visibleRange.start, visibleRange.end);
  }, [data, visibleRange]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Handle row selection
  const handleRowSelect = useCallback((docName: string, checked: boolean) => {
    if (!onSelect) return;

    let newSelection: string[];
    if (checked) {
      newSelection = [...selection, docName];
    } else {
      newSelection = selection.filter(name => name !== docName);
    }

    onSelect(newSelection);
  }, [selection, onSelect]);

  // Default cell formatter
  const defaultFormatCellValue = useCallback((value: unknown, fieldtype: string) => {
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

  const cellFormatter = formatCellValue || defaultFormatCellValue;

  // Visible columns (not hidden)
  const visibleColumns = useMemo(() => 
    columns.filter(col => !col.hidden), 
    [columns]
  );

  return (
    <div className={styles.virtualizedList}>
      {/* Header */}
      <div className={styles.virtualHeader}>
        <table className={styles.virtualTable}>
          <thead>
            <tr>
              <th className={styles.selectColumn}>
                <input
                  type="checkbox"
                  className={styles.listCheckbox}
                  onChange={() => {}} // Handled by parent
                />
              </th>
              {visibleColumns.map((column) => (
                <th
                  key={column.fieldname}
                  className={styles.virtualColumn}
                  style={{ width: column.width ? `${column.width}px` : undefined }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </div>

      {/* Scrollable Content */}
      <div
        ref={containerRef}
        className={styles.virtualContainer}
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        {/* Total height spacer */}
        <div style={{ height: data.length * rowHeight, position: 'relative' }}>
          {/* Visible rows */}
          <div
            style={{
              position: 'absolute',
              top: visibleRange.start * rowHeight,
              width: '100%',
            }}
          >
            <table className={styles.virtualTable}>
              <tbody>
                {visibleItems.map((doc, index) => {
                  const actualIndex = visibleRange.start + index;
                  return (
                    <tr
                      key={doc.name}
                      className={`${styles.virtualRow} ${selection.includes(doc.name) ? styles.selected : ''}`}
                      style={{ height: rowHeight }}
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
                        <td key={column.fieldname} className={styles.virtualCell}>
                          <div className={styles.cellContent}>
                            {cellFormatter(doc[column.fieldname], column.fieldtype)}
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}