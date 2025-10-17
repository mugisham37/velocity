'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { FilterCondition, FilterOperator, DocField } from '@/types';
import styles from './ListFilters.module.css';

export interface FilterOption {
  fieldname: string;
  label: string;
  fieldtype: string;
  options?: string[];
}

export interface SavedFilter {
  name: string;
  filters: FilterCondition[];
  isDefault?: boolean;
  isShared?: boolean;
}

export interface ListFiltersProps {
  doctype: string;
  fields: DocField[];
  filters: FilterCondition[];
  savedFilters?: SavedFilter[];
  onFiltersChange: (filters: FilterCondition[]) => void;
  onSaveFilter?: (name: string, filters: FilterCondition[]) => void;
  onDeleteFilter?: (filterName: string) => void;
  onLoadFilter?: (filter: SavedFilter) => void;
}

const FILTER_OPERATORS: Record<string, FilterOperator[]> = {
  'Data': ['=', '!=', 'like', 'not like'],
  'Text': ['like', 'not like'],
  'Select': ['=', '!=', 'in', 'not in'],
  'Link': ['=', '!=', 'like', 'not like'],
  'Date': ['=', '!=', '>', '<', '>=', '<='],
  'Datetime': ['=', '!=', '>', '<', '>=', '<='],
  'Check': ['=', '!='],
  'Currency': ['=', '!=', '>', '<', '>=', '<='],
  'Float': ['=', '!=', '>', '<', '>=', '<='],
  'Int': ['=', '!=', '>', '<', '>=', '<='],
};

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  '=': 'equals',
  '!=': 'not equals',
  '>': 'greater than',
  '<': 'less than',
  '>=': 'greater than or equal',
  '<=': 'less than or equal',
  'like': 'contains',
  'not like': 'does not contain',
  'in': 'is one of',
  'not in': 'is not one of',
  'is': 'is',
  'is not': 'is not',
};

export function ListFilters({
  doctype,
  fields,
  filters,
  savedFilters = [],
  onFiltersChange,
  onSaveFilter,
  onDeleteFilter,
  onLoadFilter,
}: ListFiltersProps) {
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [newFilter, setNewFilter] = useState<Partial<FilterCondition>>({});

  // Get filterable fields
  const filterableFields = useMemo(() => {
    return fields.filter(field => 
      !['Table', 'Text Editor', 'Attach'].includes(field.fieldtype) &&
      !field.hidden
    );
  }, [fields]);

  // Add new filter
  const handleAddFilter = useCallback(() => {
    if (!newFilter.fieldname || !newFilter.operator || newFilter.value === undefined) {
      return;
    }

    const filter: FilterCondition = {
      fieldname: newFilter.fieldname,
      operator: newFilter.operator,
      value: newFilter.value,
    };

    // Remove existing filter for the same field
    const updatedFilters = filters.filter(f => f.fieldname !== filter.fieldname);
    onFiltersChange([...updatedFilters, filter]);

    // Reset form
    setNewFilter({});
    setShowAddFilter(false);
  }, [newFilter, filters, onFiltersChange]);

  // Remove filter
  const handleRemoveFilter = useCallback((fieldname: string) => {
    const updatedFilters = filters.filter(f => f.fieldname !== fieldname);
    onFiltersChange(updatedFilters);
  }, [filters, onFiltersChange]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    onFiltersChange([]);
  }, [onFiltersChange]);

  // Save current filters
  const handleSaveFilter = useCallback(() => {
    if (!saveFilterName.trim() || !onSaveFilter) return;
    
    onSaveFilter(saveFilterName.trim(), filters);
    setSaveFilterName('');
    setShowSaveDialog(false);
  }, [saveFilterName, filters, onSaveFilter]);

  // Load saved filter
  const handleLoadFilter = useCallback((filter: SavedFilter) => {
    if (onLoadFilter) {
      onLoadFilter(filter);
    } else {
      onFiltersChange(filter.filters);
    }
  }, [onLoadFilter, onFiltersChange]);

  // Get field by name
  const getField = useCallback((fieldname: string) => {
    return fields.find(f => f.fieldname === fieldname);
  }, [fields]);

  // Get operators for field type
  const getOperatorsForField = useCallback((fieldtype: string) => {
    return FILTER_OPERATORS[fieldtype] || ['=', '!='];
  }, []);

  // Format filter value for display
  const formatFilterValue = useCallback((filter: FilterCondition) => {
    const field = getField(filter.fieldname);
    if (!field) return String(filter.value);

    switch (field.fieldtype) {
      case 'Date':
        return new Date(filter.value as string).toLocaleDateString();
      case 'Datetime':
        return new Date(filter.value as string).toLocaleString();
      case 'Check':
        return filter.value ? 'Yes' : 'No';
      case 'Currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(filter.value as number);
      default:
        return String(filter.value);
    }
  }, [getField]);

  // Render filter input based on field type
  const renderFilterInput = useCallback((field: DocField, value: unknown, onChange: (value: unknown) => void) => {
    switch (field.fieldtype) {
      case 'Check':
        return (
          <select
            value={value as string}
            onChange={(e) => onChange(e.target.value === 'true')}
            className={styles.filterInput}
          >
            <option value="">Select...</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );

      case 'Select':
        const options = field.options?.split('\n') || [];
        return (
          <select
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className={styles.filterInput}
          >
            <option value="">Select...</option>
            {options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'Date':
        return (
          <input
            type="date"
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className={styles.filterInput}
          />
        );

      case 'Datetime':
        return (
          <input
            type="datetime-local"
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className={styles.filterInput}
          />
        );

      case 'Currency':
      case 'Float':
        return (
          <input
            type="number"
            step="0.01"
            value={value as string}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className={styles.filterInput}
            placeholder="Enter amount"
          />
        );

      case 'Int':
        return (
          <input
            type="number"
            value={value as string}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            className={styles.filterInput}
            placeholder="Enter number"
          />
        );

      default:
        return (
          <input
            type="text"
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className={styles.filterInput}
            placeholder="Enter value"
          />
        );
    }
  }, []);

  return (
    <div className={styles.listFilters}>
      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterControls}>
          <button
            className={`${styles.btn} ${styles.btnSm} ${styles.btnSecondary}`}
            onClick={() => setShowAddFilter(true)}
          >
            + Add Filter
          </button>
          
          {filters.length > 0 && (
            <button
              className={`${styles.btn} ${styles.btnSm} ${styles.btnGhost}`}
              onClick={handleClearFilters}
            >
              Clear All
            </button>
          )}

          {filters.length > 0 && onSaveFilter && (
            <button
              className={`${styles.btn} ${styles.btnSm} ${styles.btnGhost}`}
              onClick={() => setShowSaveDialog(true)}
            >
              Save Filter
            </button>
          )}
        </div>

        {/* Saved Filters */}
        {savedFilters.length > 0 && (
          <div className={styles.savedFilters}>
            <select
              onChange={(e) => {
                const filter = savedFilters.find(f => f.name === e.target.value);
                if (filter) handleLoadFilter(filter);
              }}
              className={styles.savedFilterSelect}
              value=""
            >
              <option value="">Load Saved Filter...</option>
              {savedFilters.map(filter => (
                <option key={filter.name} value={filter.name}>
                  {filter.name} {filter.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Active Filters */}
      {filters.length > 0 && (
        <div className={styles.activeFilters}>
          <div className={styles.filterChips}>
            {filters.map((filter, index) => {
              const field = getField(filter.fieldname);
              return (
                <div key={`${filter.fieldname}-${index}`} className={styles.filterChip}>
                  <span className={styles.filterField}>{field?.label || filter.fieldname}</span>
                  <span className={styles.filterOperator}>{OPERATOR_LABELS[filter.operator]}</span>
                  <span className={styles.filterValue}>{formatFilterValue(filter)}</span>
                  <button
                    className={styles.filterRemove}
                    onClick={() => handleRemoveFilter(filter.fieldname)}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Filter Dialog */}
      {showAddFilter && (
        <div className={styles.filterDialog}>
          <div className={styles.filterDialogContent}>
            <h3>Add Filter</h3>
            
            <div className={styles.filterForm}>
              <div className={styles.formGroup}>
                <label>Field</label>
                <select
                  value={newFilter.fieldname || ''}
                  onChange={(e) => setNewFilter(prev => ({ 
                    ...prev, 
                    fieldname: e.target.value,
                    operator: undefined,
                    value: undefined 
                  }))}
                  className={styles.filterInput}
                >
                  <option value="">Select Field...</option>
                  {filterableFields.map(field => (
                    <option key={field.fieldname} value={field.fieldname}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>

              {newFilter.fieldname && (
                <div className={styles.formGroup}>
                  <label>Operator</label>
                  <select
                    value={newFilter.operator || ''}
                    onChange={(e) => setNewFilter(prev => ({ 
                      ...prev, 
                      operator: e.target.value as FilterOperator,
                      value: undefined 
                    }))}
                    className={styles.filterInput}
                  >
                    <option value="">Select Operator...</option>
                    {getOperatorsForField(getField(newFilter.fieldname)?.fieldtype || 'Data').map(op => (
                      <option key={op} value={op}>
                        {OPERATOR_LABELS[op]}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {newFilter.fieldname && newFilter.operator && (
                <div className={styles.formGroup}>
                  <label>Value</label>
                  {renderFilterInput(
                    getField(newFilter.fieldname)!,
                    newFilter.value,
                    (value) => setNewFilter(prev => ({ ...prev, value: value as string | number | boolean | string[] }))
                  )}
                </div>
              )}
            </div>

            <div className={styles.filterDialogActions}>
              <button
                className={`${styles.btn} ${styles.btnSm} ${styles.btnSecondary}`}
                onClick={() => setShowAddFilter(false)}
              >
                Cancel
              </button>
              <button
                className={`${styles.btn} ${styles.btnSm} ${styles.btnPrimary}`}
                onClick={handleAddFilter}
                disabled={!newFilter.fieldname || !newFilter.operator || newFilter.value === undefined}
              >
                Add Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <div className={styles.filterDialog}>
          <div className={styles.filterDialogContent}>
            <h3>Save Filter</h3>
            
            <div className={styles.formGroup}>
              <label>Filter Name</label>
              <input
                type="text"
                value={saveFilterName}
                onChange={(e) => setSaveFilterName(e.target.value)}
                className={styles.filterInput}
                placeholder="Enter filter name"
              />
            </div>

            <div className={styles.filterDialogActions}>
              <button
                className={`${styles.btn} ${styles.btnSm} ${styles.btnSecondary}`}
                onClick={() => setShowSaveDialog(false)}
              >
                Cancel
              </button>
              <button
                className={`${styles.btn} ${styles.btnSm} ${styles.btnPrimary}`}
                onClick={handleSaveFilter}
                disabled={!saveFilterName.trim()}
              >
                Save Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}