'use client';

import { useState, useCallback, useEffect } from 'react';
import { ListCustomizationSettings } from '@/components/lists/ListCustomization';

export interface UseListCustomizationOptions {
  doctype: string;
  defaultSettings?: Partial<ListCustomizationSettings>;
  persistSettings?: boolean;
}

export interface UseListCustomizationReturn {
  settings: ListCustomizationSettings;
  updateSettings: (settings: ListCustomizationSettings) => void;
  saveSettings: (name: string, settings: ListCustomizationSettings) => void;
  loadSettings: (settings: ListCustomizationSettings) => void;
  savedSettings: Array<{ name: string; settings: ListCustomizationSettings; isDefault?: boolean }>;
  resetToDefaults: () => void;
}

const DEFAULT_SETTINGS: ListCustomizationSettings = {
  visibleColumns: ['name'],
  columnWidths: {},
  columnOrder: [],
  sortPreferences: [],
};

export function useListCustomization({
  doctype,
  defaultSettings = {},
  persistSettings = true,
}: UseListCustomizationOptions): UseListCustomizationReturn {
  const [settings, setSettings] = useState<ListCustomizationSettings>(() => {
    const merged = { ...DEFAULT_SETTINGS, ...defaultSettings };
    
    if (persistSettings && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`list_settings_${doctype}`);
      if (saved) {
        try {
          return { ...merged, ...JSON.parse(saved) };
        } catch {
          // Ignore invalid JSON
        }
      }
    }
    
    return merged;
  });

  const [savedSettings, setSavedSettings] = useState<Array<{ 
    name: string; 
    settings: ListCustomizationSettings; 
    isDefault?: boolean 
  }>>(() => {
    if (persistSettings && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`saved_list_settings_${doctype}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  // Persist settings when they change
  useEffect(() => {
    if (persistSettings && typeof window !== 'undefined') {
      localStorage.setItem(`list_settings_${doctype}`, JSON.stringify(settings));
    }
  }, [settings, doctype, persistSettings]);

  // Persist saved settings when they change
  useEffect(() => {
    if (persistSettings && typeof window !== 'undefined') {
      localStorage.setItem(`saved_list_settings_${doctype}`, JSON.stringify(savedSettings));
    }
  }, [savedSettings, doctype, persistSettings]);

  const updateSettings = useCallback((newSettings: ListCustomizationSettings) => {
    setSettings(newSettings);
  }, []);

  const saveSettings = useCallback((name: string, settingsToSave: ListCustomizationSettings) => {
    setSavedSettings(prev => {
      // Remove existing setting with same name
      const filtered = prev.filter(s => s.name !== name);
      return [...filtered, { name, settings: settingsToSave }];
    });
  }, []);

  const loadSettings = useCallback((settingsToLoad: ListCustomizationSettings) => {
    setSettings(settingsToLoad);
  }, []);

  const resetToDefaults = useCallback(() => {
    const defaults = { ...DEFAULT_SETTINGS, ...defaultSettings };
    setSettings(defaults);
  }, [defaultSettings]);

  return {
    settings,
    updateSettings,
    saveSettings,
    loadSettings,
    savedSettings,
    resetToDefaults,
  };
}