// Dynamic import utilities for code splitting and lazy loading

import dynamic from 'next/dynamic';
import React, { ComponentType } from 'react';

// Loading component for lazy-loaded components
export const LoadingSpinner = () => 
  React.createElement('div', { className: "flex items-center justify-center p-8" },
    React.createElement('div', { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" })
  );

// Error boundary for lazy-loaded components
export const LazyLoadError = ({ error, retry }: { error: Error; retry: () => void }) => 
  React.createElement('div', { className: "flex flex-col items-center justify-center p-8 text-center" },
    React.createElement('div', { className: "text-red-600 mb-4" },
      React.createElement('svg', { 
        className: "w-12 h-12 mx-auto mb-2", 
        fill: "none", 
        stroke: "currentColor", 
        viewBox: "0 0 24 24" 
      },
        React.createElement('path', { 
          strokeLinecap: "round", 
          strokeLinejoin: "round", 
          strokeWidth: 2, 
          d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
        })
      ),
      "Failed to load component"
    ),
    React.createElement('p', { className: "text-gray-600 mb-4 text-sm" }, error.message),
    React.createElement('button', {
      onClick: retry,
      className: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
    }, "Try Again")
  );

// Generic dynamic import wrapper with error handling
export function createDynamicComponent<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options?: {
    loading?: ComponentType;
    ssr?: boolean;
  }
) {
  return dynamic(importFn, {
    loading: options?.loading as any,
    ssr: options?.ssr ?? true,
  });
}

// Route-based dynamic imports (placeholder structure)
export const DynamicRoutes = {
  // Dashboard components (to be implemented)
  Dashboard: null,
  DashboardSettings: null,
  
  // Form components (to be implemented)
  DynamicForm: null,
  
  // List components (to be implemented)
  ListView: null,
  VirtualizedList: null,
  
  // Module-specific components (to be implemented)
  Accounts: {
    ChartOfAccounts: null,
    JournalEntry: null,
    PaymentEntry: null,
  },
  
  Stock: {
    ItemMaster: null,
    StockEntry: null,
    MaterialRequest: null,
  },
  
  Sales: {
    SalesOrder: null,
  },
  
  Buying: {
    PurchaseOrder: null,
  },
  
  Manufacturing: {
    BOM: null,
    WorkOrder: null,
    JobCard: null,
  },
  
  CRM: {
    Lead: null,
    Opportunity: null,
    Customer: null,
    Contact: null,
    Project: null,
  },
  
  // Specialized interfaces (to be implemented)
  POS: null,
  ReportBuilder: null,
  PrintDesigner: null,
  
  // Customization tools (to be implemented)
  CustomFieldManager: null,
  WorkflowDesigner: null,
  PermissionManager: null,
};

// Heavy component dynamic imports (to be implemented)
export const HeavyComponents = {
  ChartWidget: null,
  PDFViewer: null,
  CodeEditor: null,
  FileUploader: null,
};

// Preloading strategies for critical components (placeholder)
export const preloadCriticalComponents = () => {
  // TODO: Implement component preloading when components are available
  console.log('Preloading critical components (placeholder)');
};

// Module-based preloading (placeholder)
export const preloadModuleComponents = (module: string) => {
  // TODO: Implement module-based preloading when components are available
  console.log(`Preloading module components for: ${module} (placeholder)`);
};

// Bundle splitting configuration
export const bundleConfig = {
  // Vendor chunks
  vendors: [
    'react',
    'react-dom',
    'next',
    '@tanstack/react-query',
    'zustand',
    'framer-motion',
  ],
  
  // Chart libraries (heavy)
  charts: [
    'chart.js',
    'react-chartjs-2',
    'chartjs-adapter-date-fns',
  ],
  
  // Form libraries
  forms: [
    'react-hook-form',
    '@hookform/resolvers',
    'zod',
  ],
  
  // UI libraries
  ui: [
    '@headlessui/react',
    '@heroicons/react',
    'lucide-react',
    '@radix-ui/react-tabs',
  ],
  
  // Utility libraries
  utils: [
    'axios',
    'date-fns',
    'clsx',
    'tailwind-merge',
    'class-variance-authority',
  ],
};

// Performance monitoring for dynamic imports
export const trackDynamicImport = (componentName: string) => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const startTime = performance.now();
    
    return {
      onLoad: () => {
        const loadTime = performance.now() - startTime;
        console.log(`Dynamic import ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
        
        // Send to analytics if available
        if ('gtag' in window) {
          (window as any).gtag('event', 'dynamic_import_load', {
            component_name: componentName,
            load_time: Math.round(loadTime),
          });
        }
      },
      onError: (error: Error) => {
        console.error(`Dynamic import ${componentName} failed:`, error);
        
        // Send error to analytics if available
        if ('gtag' in window) {
          (window as any).gtag('event', 'dynamic_import_error', {
            component_name: componentName,
            error_message: error.message,
          });
        }
      },
    };
  }
  
  return { onLoad: () => {}, onError: () => {} };
};