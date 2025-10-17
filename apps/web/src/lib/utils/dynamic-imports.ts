// Dynamic import utilities for code splitting and lazy loading

import dynamic from 'next/dynamic';
import { ComponentType, ReactElement } from 'react';

// Loading component for lazy-loaded components
export const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Error boundary for lazy-loaded components
export const LazyLoadError = ({ error, retry }: { error: Error; retry: () => void }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="text-red-600 mb-4">
      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      Failed to load component
    </div>
    <p className="text-gray-600 mb-4 text-sm">{error.message}</p>
    <button
      onClick={retry}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
    >
      Try Again
    </button>
  </div>
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
    loading: options?.loading || LoadingSpinner,
    ssr: options?.ssr ?? true,
  });
}

// Route-based dynamic imports
export const DynamicRoutes = {
  // Dashboard components
  Dashboard: createDynamicComponent(() => import('@/components/dashboard/Dashboard')),
  DashboardSettings: createDynamicComponent(() => import('@/components/dashboard/DashboardSettings')),
  
  // Form components
  DynamicForm: createDynamicComponent(() => import('@/components/forms/DynamicForm')),
  
  // List components
  ListView: createDynamicComponent(() => import('@/components/lists/ListView')),
  VirtualizedList: createDynamicComponent(() => import('@/components/lists/VirtualizedList')),
  
  // Module-specific components
  Accounts: {
    ChartOfAccounts: createDynamicComponent(() => import('@/components/modules/accounts/ChartOfAccounts')),
    JournalEntry: createDynamicComponent(() => import('@/components/modules/accounts/JournalEntry')),
    PaymentEntry: createDynamicComponent(() => import('@/components/modules/accounts/PaymentEntry')),
  },
  
  Stock: {
    ItemMaster: createDynamicComponent(() => import('@/components/modules/stock/ItemMaster')),
    StockEntry: createDynamicComponent(() => import('@/components/modules/stock/StockEntry')),
    MaterialRequest: createDynamicComponent(() => import('@/components/modules/stock/MaterialRequest')),
  },
  
  Sales: {
    SalesOrder: createDynamicComponent(() => import('@/components/modules/sales/SalesOrder')),
  },
  
  Buying: {
    PurchaseOrder: createDynamicComponent(() => import('@/components/modules/buying/PurchaseOrder')),
  },
  
  Manufacturing: {
    BOM: createDynamicComponent(() => import('@/components/modules/manufacturing/BOM')),
    WorkOrder: createDynamicComponent(() => import('@/components/modules/manufacturing/WorkOrder')),
    JobCard: createDynamicComponent(() => import('@/components/modules/manufacturing/JobCard')),
  },
  
  CRM: {
    Lead: createDynamicComponent(() => import('@/components/modules/crm/Lead')),
    Opportunity: createDynamicComponent(() => import('@/components/modules/crm/Opportunity')),
    Customer: createDynamicComponent(() => import('@/components/modules/crm/Customer')),
    Contact: createDynamicComponent(() => import('@/components/modules/crm/Contact')),
    Project: createDynamicComponent(() => import('@/components/modules/crm/Project')),
  },
  
  // Specialized interfaces
  POS: createDynamicComponent(() => import('@/components/modules/pos/POSInterface'), { ssr: false }),
  ReportBuilder: createDynamicComponent(() => import('@/components/reports/ReportBuilder')),
  PrintDesigner: createDynamicComponent(() => import('@/components/print/PrintFormatDesigner')),
  
  // Customization tools
  CustomFieldManager: createDynamicComponent(() => import('@/components/customization/CustomFieldManager')),
  WorkflowDesigner: createDynamicComponent(() => import('@/components/customization/WorkflowDesigner')),
  PermissionManager: createDynamicComponent(() => import('@/components/customization/PermissionManager')),
};

// Heavy component dynamic imports (loaded only when needed)
export const HeavyComponents = {
  ChartWidget: createDynamicComponent(() => import('@/components/dashboard/widgets/ChartWidget'), { ssr: false }),
  PDFViewer: createDynamicComponent(() => import('@/components/print/PDFViewer'), { ssr: false }),
  CodeEditor: createDynamicComponent(() => import('@/components/customization/CodeEditor'), { ssr: false }),
  FileUploader: createDynamicComponent(() => import('@/components/forms/FileUploader'), { ssr: false }),
};

// Preloading strategies for critical components
export const preloadCriticalComponents = () => {
  // Preload components that are likely to be used soon
  if (typeof window !== 'undefined') {
    // Preload dashboard components on idle
    requestIdleCallback(() => {
      import('@/components/dashboard/Dashboard');
      import('@/components/forms/DynamicForm');
      import('@/components/lists/ListView');
    });
  }
};

// Module-based preloading
export const preloadModuleComponents = (module: string) => {
  if (typeof window !== 'undefined') {
    requestIdleCallback(() => {
      switch (module) {
        case 'accounts':
          import('@/components/modules/accounts/ChartOfAccounts');
          import('@/components/modules/accounts/JournalEntry');
          break;
        case 'stock':
          import('@/components/modules/stock/ItemMaster');
          import('@/components/modules/stock/StockEntry');
          break;
        case 'sales':
          import('@/components/modules/sales/SalesOrder');
          break;
        case 'buying':
          import('@/components/modules/buying/PurchaseOrder');
          break;
        case 'manufacturing':
          import('@/components/modules/manufacturing/BOM');
          import('@/components/modules/manufacturing/WorkOrder');
          break;
        case 'crm':
          import('@/components/modules/crm/Lead');
          import('@/components/modules/crm/Customer');
          break;
        default:
          break;
      }
    });
  }
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