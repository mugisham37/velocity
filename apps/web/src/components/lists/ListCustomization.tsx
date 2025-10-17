'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { DocField } from '@/types';
import { ListViewColumn } from './ListView';
import styles from './ListCustomization.module.css';

export interface ListCustomizationSettings {
  visibleColumns: string[];
  columnWidths: Record<string, number>;
  columnOrder: string[];
  groupBy?: string;
  sortPreferences: Array<{ fieldname: string; direction: 'asc' | 'desc' }>;
}

export interface ListCustomizationProps {
  doctype: string;
  fields: DocField[];
  currentSettings: ListCustomizationSettings;
  onSettingsChange: (settings: ListCustomizationSettings) => void;
  onSaveSettings?: (name: string, settings: ListCustomizationSettings) => void;
  onLoadSettings?: (settings: ListCustomizationSettings) => void;
  savedSettings?: Array<{ name: string; settings: ListCustomizationSettings; isDefault?: boolean }>;
}

export function ListCustomization({
  doctype,
  fields,
  currentSettings,
  onSettingsChange,
  onSaveSettings,
  onLoadSettings,
  savedSettings = [],
}: ListCustomizationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'columns' | 'grouping' | 'sorting'>('columns');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveSettingsName, setSaveSettingsName] = useState('');

  // Get available fields for customization
  const availableFields = useMemo(() => {
    return fields.filter(field => 
      !['Table', 'Text Editor', 'Attach'].includes(field.fieldtype) &&
      !field.hidden
    );
  }, [fields]);

  // Handle column visibility toggle
  const handleColumnToggle = useCallback((fieldname: string, visible: boolean) => {
    const newVisibleColumns = visible
      ? [...currentSettings.visibleColumns, fieldname]
      : currentSettings.visibleColumns.filter(col => col !== fieldname);

    onSettingsChange({
      ...currentSettings,
      visibleColumns: newVisibleColumns,
    });
  }, [currentSettings, onSettingsChange]);

  // Handle column reordering
  const handleColumnReorder = useCallback((dragIndex: number, hoverIndex: number) => {
    const newOrder = [...currentSettings.columnOrder];
    const draggedItem = newOrder[dragIndex];
    newOrder.splice(dragIndex, 1);
    newOrder.splice(hoverIndex, 0, draggedItem);

    onSettingsChange({
      ...currentSettings,
      columnOrder: newOrder,
    });
  }, [currentSettings, onSettingsChange]);

  // Handle column width change
  const handleColumnWidthChange = useCallback((fieldname: string, width: number) => {
    onSettingsChange({
      ...currentSettings,
      columnWidths: {
        ...currentSettings.columnWidths,
        [fieldname]: width,
      },
    });
  }, [currentSettings, onSettingsChange]);

  // Handle grouping change
  const handleGroupByChange = useCallback((fieldname: string) => {
    onSettingsChange({
      ...currentSettings,
      groupBy: fieldname === currentSettings.groupBy ? undefined : fieldname,
    });
  }, [currentSettings, onSettingsChange]);

  // Handle sort preference change
  const handleSortPreferenceChange = useCallback((fieldname: string, direction: 'asc' | 'desc') => {
    const newSortPreferences = currentSettings.sortPreferences.filter(s => s.fieldname !== fieldname);
    newSortPreferences.push({ fieldname, direction });

    onSettingsChange({
      ...currentSettings,
      sortPreferences: newSortPreferences,
    });
  }, [currentSettings, onSettingsChange]);

  // Save current settings
  const handleSaveSettings = useCallback(() => {
    if (!saveSettingsName.trim() || !onSaveSettings) return;
    
    onSaveSettings(saveSettingsName.trim(), currentSettings);
    setSaveSettingsName('');
    setSaveDialogOpen(false);
  }, [saveSettingsName, currentSettings, onSaveSettings]);

  // Load saved settings
  const handleLoadSettings = useCallback((settings: ListCustomizationSettings) => {
    if (onLoadSettings) {
      onLoadSettings(settings);
    } else {
      onSettingsChange(settings);
    }
  }, [onLoadSettings, onSettingsChange]);

  // Reset to defaults
  const handleResetToDefaults = useCallback(() => {
    const defaultSettings: ListCustomizationSettings = {
      visibleColumns: ['name'],
      columnWidths: {},
      columnOrder: availableFields.map(f => f.fieldname),
      sortPreferences: [],
    };
    onSettingsChange(defaultSettings);
  }, [availableFields, onSettingsChange]);

  if (!isOpen) {
    return (
      <button
        className={styles.customizeBtn}
        onClick={() => setIsOpen(true)}
        title="Customize List"
      >
        ⚙️ Customize
      </button>
    );
  }

  return (
    <div className={styles.listCustomizationOverlay}>
      <div className={styles.customizationDialog}>
        <div className={styles.dialogHeader}>
          <h3>Customize {doctype} List</h3>
          <button
            className={styles.closeBtn}
            onClick={() => setIsOpen(false)}
          >
            ×
          </button>
        </div>

        <div className={styles.dialogContent}>
          {/* Tabs */}
          <div className={styles.customizationTabs}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'columns' ? styles.active : ''}`}
              onClick={() => setActiveTab('columns')}
            >
              Columns
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'grouping' ? styles.active : ''}`}
              onClick={() => setActiveTab('grouping')}
            >
              Grouping
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'sorting' ? styles.active : ''}`}
              onClick={() => setActiveTab('sorting')}
            >
              Sorting
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'columns' && (
              <div className="columns-tab">
                <div className="section">
                  <h4>Visible Columns</h4>
                  <div className="column-list">
                    {availableFields.map(field => (
                      <div key={field.fieldname} className="column-item">
                        <label className="column-checkbox">
                          <input
                            type="checkbox"
                            checked={currentSettings.visibleColumns.includes(field.fieldname)}
                            onChange={(e) => handleColumnToggle(field.fieldname, e.target.checked)}
                          />
                          <span>{field.label}</span>
                        </label>
                        
                        {currentSettings.visibleColumns.includes(field.fieldname) && (
                          <div className="column-width">
                            <label>Width:</label>
                            <input
                              type="number"
                              min="50"
                              max="500"
                              value={currentSettings.columnWidths[field.fieldname] || ''}
                              onChange={(e) => handleColumnWidthChange(field.fieldname, parseInt(e.target.value) || 0)}
                              placeholder="Auto"
                              className="width-input"
                            />
                            <span>px</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="section">
                  <h4>Column Order</h4>
                  <div className="column-order">
                    {currentSettings.visibleColumns.map((fieldname, index) => {
                      const field = availableFields.find(f => f.fieldname === fieldname);
                      if (!field) return null;
                      
                      return (
                        <div key={fieldname} className="order-item">
                          <span className="order-number">{index + 1}</span>
                          <span className="field-label">{field.label}</span>
                          <div className="order-controls">
                            <button
                              onClick={() => handleColumnReorder(index, index - 1)}
                              disabled={index === 0}
                              className="order-btn"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => handleColumnReorder(index, index + 1)}
                              disabled={index === currentSettings.visibleColumns.length - 1}
                              className="order-btn"
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'grouping' && (
              <div className="grouping-tab">
                <div className="section">
                  <h4>Group By Field</h4>
                  <select
                    value={currentSettings.groupBy || ''}
                    onChange={(e) => handleGroupByChange(e.target.value)}
                    className="group-select"
                  >
                    <option value="">No Grouping</option>
                    {availableFields
                      .filter(field => ['Select', 'Link', 'Check', 'Date'].includes(field.fieldtype))
                      .map(field => (
                        <option key={field.fieldname} value={field.fieldname}>
                          {field.label}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'sorting' && (
              <div className="sorting-tab">
                <div className="section">
                  <h4>Default Sort Order</h4>
                  <div className="sort-list">
                    {currentSettings.sortPreferences.map((sort, index) => {
                      const field = availableFields.find(f => f.fieldname === sort.fieldname);
                      return (
                        <div key={`${sort.fieldname}-${index}`} className="sort-item">
                          <span>{field?.label || sort.fieldname}</span>
                          <select
                            value={sort.direction}
                            onChange={(e) => handleSortPreferenceChange(sort.fieldname, e.target.value as 'asc' | 'desc')}
                            className="sort-direction"
                          >
                            <option value="asc">Ascending</option>
                            <option value="desc">Descending</option>
                          </select>
                          <button
                            onClick={() => {
                              const newPreferences = currentSettings.sortPreferences.filter(s => s.fieldname !== sort.fieldname);
                              onSettingsChange({ ...currentSettings, sortPreferences: newPreferences });
                            }}
                            className="remove-sort"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="add-sort">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleSortPreferenceChange(e.target.value, 'asc');
                          e.target.value = '';
                        }
                      }}
                      className="add-sort-select"
                    >
                      <option value="">Add Sort Field...</option>
                      {availableFields
                        .filter(field => !currentSettings.sortPreferences.some(s => s.fieldname === field.fieldname))
                        .map(field => (
                          <option key={field.fieldname} value={field.fieldname}>
                            {field.label}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="dialog-footer">
          <div className="footer-left">
            {savedSettings.length > 0 && (
              <select
                onChange={(e) => {
                  const setting = savedSettings.find(s => s.name === e.target.value);
                  if (setting) handleLoadSettings(setting.settings);
                }}
                className="load-settings-select"
                value=""
              >
                <option value="">Load Saved Settings...</option>
                {savedSettings.map(setting => (
                  <option key={setting.name} value={setting.name}>
                    {setting.name} {setting.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          <div className="footer-right">
            <button
              className="btn btn-ghost"
              onClick={handleResetToDefaults}
            >
              Reset to Defaults
            </button>
            
            {onSaveSettings && (
              <button
                className="btn btn-secondary"
                onClick={() => setSaveDialogOpen(true)}
              >
                Save Settings
              </button>
            )}
            
            <button
              className="btn btn-primary"
              onClick={() => setIsOpen(false)}
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      {saveDialogOpen && (
        <div className="save-dialog-overlay">
          <div className="save-dialog">
            <h4>Save List Settings</h4>
            <input
              type="text"
              value={saveSettingsName}
              onChange={(e) => setSaveSettingsName(e.target.value)}
              placeholder="Enter settings name"
              className="save-name-input"
            />
            <div className="save-dialog-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setSaveDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveSettings}
                disabled={!saveSettingsName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}