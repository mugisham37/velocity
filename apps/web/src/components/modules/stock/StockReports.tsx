'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { StockBalance, StockLedgerEntry, StockAgeingItem, ABCAnalysisItem } from '@/types';
import { ListView } from '@/components/lists/ListView';
import { ListFilters } from '@/components/lists/ListFilters';
import { useDocuments } from '@/hooks/useDocuments';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  ChartBarIcon, 
  TableCellsIcon, 
  DocumentChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';

interface StockReportsProps {
  onReportSelect?: (reportType: string, data: unknown) => void;
}

type ReportType = 'stock-balance' | 'stock-ledger' | 'stock-valuation' | 'stock-ageing' | 'abc-analysis';

interface ReportFilters {
  company?: string;
  warehouse?: string;
  item_code?: string;
  item_group?: string;
  brand?: string;
  from_date?: string;
  to_date?: string;
  valuation_method?: string;
  ageing_based_on?: string;
  range1?: number;
  range2?: number;
  range3?: number;
  range4?: number;
}

export function StockReports({ onReportSelect }: StockReportsProps) {
  const [activeReport, setActiveReport] = useState<ReportType>('stock-balance');
  const [reportData, setReportData] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({});
  
  const { showNotification } = useNotifications();
  const { getList } = useDocuments();

  // Form for report filters
  const methods = useForm<ReportFilters>({
    defaultValues: {
      company: '',
      warehouse: '',
      item_code: '',
      item_group: '',
      brand: '',
      from_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
      to_date: new Date().toISOString().split('T')[0],
      valuation_method: 'FIFO',
      ageing_based_on: 'Posting Date',
      range1: 30,
      range2: 60,
      range3: 90,
      range4: 120,
    },
    mode: 'onChange',
  });

  const { watch, reset } = methods;
  const formData = watch();

  // Report configurations
  const reportConfigs = useMemo(() => ({
    'stock-balance': {
      title: 'Stock Balance',
      description: 'Current stock balance by item and warehouse',
      icon: ArchiveBoxIcon,
      columns: [
        { fieldname: 'item_code', label: 'Item Code', fieldtype: 'Link' },
        { fieldname: 'item_name', label: 'Item Name', fieldtype: 'Data' },
        { fieldname: 'item_group', label: 'Item Group', fieldtype: 'Link' },
        { fieldname: 'warehouse', label: 'Warehouse', fieldtype: 'Link' },
        { fieldname: 'bal_qty', label: 'Balance Qty', fieldtype: 'Float' },
        { fieldname: 'bal_val', label: 'Balance Value', fieldtype: 'Currency' },
        { fieldname: 'val_rate', label: 'Valuation Rate', fieldtype: 'Currency' },
        { fieldname: 'uom', label: 'UOM', fieldtype: 'Link' },
      ],
      filters: ['company', 'warehouse', 'item_code', 'item_group', 'brand'],
    },
    'stock-ledger': {
      title: 'Stock Ledger',
      description: 'Detailed stock movement history',
      icon: TableCellsIcon,
      columns: [
        { fieldname: 'posting_date', label: 'Date', fieldtype: 'Date' },
        { fieldname: 'item_code', label: 'Item Code', fieldtype: 'Link' },
        { fieldname: 'warehouse', label: 'Warehouse', fieldtype: 'Link' },
        { fieldname: 'voucher_type', label: 'Voucher Type', fieldtype: 'Data' },
        { fieldname: 'voucher_no', label: 'Voucher No', fieldtype: 'Dynamic Link' },
        { fieldname: 'actual_qty', label: 'Qty Change', fieldtype: 'Float' },
        { fieldname: 'qty_after_transaction', label: 'Qty After Transaction', fieldtype: 'Float' },
        { fieldname: 'valuation_rate', label: 'Valuation Rate', fieldtype: 'Currency' },
        { fieldname: 'stock_value', label: 'Stock Value', fieldtype: 'Currency' },
      ],
      filters: ['company', 'warehouse', 'item_code', 'from_date', 'to_date'],
    },
    'stock-valuation': {
      title: 'Stock Valuation Summary',
      description: 'Stock valuation by warehouse and item group',
      icon: CurrencyDollarIcon,
      columns: [
        { fieldname: 'warehouse', label: 'Warehouse', fieldtype: 'Link' },
        { fieldname: 'item_group', label: 'Item Group', fieldtype: 'Link' },
        { fieldname: 'balance_qty', label: 'Balance Qty', fieldtype: 'Float' },
        { fieldname: 'balance_value', label: 'Balance Value', fieldtype: 'Currency' },
        { fieldname: 'average_rate', label: 'Average Rate', fieldtype: 'Currency' },
      ],
      filters: ['company', 'warehouse', 'item_group', 'valuation_method'],
    },
    'stock-ageing': {
      title: 'Stock Ageing Analysis',
      description: 'Analysis of stock age by item',
      icon: ClockIcon,
      columns: [
        { fieldname: 'item_code', label: 'Item Code', fieldtype: 'Link' },
        { fieldname: 'item_name', label: 'Item Name', fieldtype: 'Data' },
        { fieldname: 'item_group', label: 'Item Group', fieldtype: 'Link' },
        { fieldname: 'warehouse', label: 'Warehouse', fieldtype: 'Link' },
        { fieldname: 'range1', label: '0-30 Days', fieldtype: 'Float' },
        { fieldname: 'range2', label: '30-60 Days', fieldtype: 'Float' },
        { fieldname: 'range3', label: '60-90 Days', fieldtype: 'Float' },
        { fieldname: 'range4', label: '90-120 Days', fieldtype: 'Float' },
        { fieldname: 'range5', label: '120+ Days', fieldtype: 'Float' },
        { fieldname: 'total_qty', label: 'Total Qty', fieldtype: 'Float' },
        { fieldname: 'total_value', label: 'Total Value', fieldtype: 'Currency' },
        { fieldname: 'average_age', label: 'Average Age (Days)', fieldtype: 'Int' },
      ],
      filters: ['company', 'warehouse', 'item_group', 'ageing_based_on', 'range1', 'range2', 'range3', 'range4'],
    },
    'abc-analysis': {
      title: 'ABC Analysis',
      description: 'ABC classification based on consumption value',
      icon: ChartBarIcon,
      columns: [
        { fieldname: 'item_code', label: 'Item Code', fieldtype: 'Link' },
        { fieldname: 'item_name', label: 'Item Name', fieldtype: 'Data' },
        { fieldname: 'item_group', label: 'Item Group', fieldtype: 'Link' },
        { fieldname: 'consumption_qty', label: 'Consumption Qty', fieldtype: 'Float' },
        { fieldname: 'consumption_value', label: 'Consumption Value', fieldtype: 'Currency' },
        { fieldname: 'abc_classification', label: 'ABC Classification', fieldtype: 'Data' },
        { fieldname: 'qty_percentage', label: 'Qty %', fieldtype: 'Percent' },
        { fieldname: 'value_percentage', label: 'Value %', fieldtype: 'Percent' },
        { fieldname: 'cumulative_value_percentage', label: 'Cumulative Value %', fieldtype: 'Percent' },
      ],
      filters: ['company', 'warehouse', 'item_group', 'from_date', 'to_date'],
    },
  }), []);

  // Load report data
  const loadReportData = async (reportType: ReportType, reportFilters: ReportFilters) => {
    setIsLoading(true);
    try {
      let data: unknown[] = [];
      
      switch (reportType) {
        case 'stock-balance':
          data = await generateStockBalanceReport(reportFilters);
          break;
        case 'stock-ledger':
          data = await generateStockLedgerReport(reportFilters);
          break;
        case 'stock-valuation':
          data = await generateStockValuationReport(reportFilters);
          break;
        case 'stock-ageing':
          data = await generateStockAgeingReport(reportFilters);
          break;
        case 'abc-analysis':
          data = await generateABCAnalysisReport(reportFilters);
          break;
      }
      
      setReportData(data);
      
      if (onReportSelect) {
        onReportSelect(reportType, data);
      }
    } catch (error) {
      showNotification(`Failed to load ${reportConfigs[reportType].title}`, 'error');
      console.error(`Error loading ${reportType}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Stock Balance Report
  const generateStockBalanceReport = async (filters: ReportFilters): Promise<StockBalance[]> => {
    // This would typically call the backend API
    // For now, return mock data
    return [
      {
        item_code: 'ITEM-001',
        item_name: 'Sample Item 1',
        item_group: 'Raw Material',
        warehouse: 'Main Store',
        company: 'Sample Company',
        actual_qty: 100,
        reserved_qty: 0,
        reserved_qty_for_production: 0,
        reserved_qty_for_sub_contract: 0,
        projected_qty: 100,
        valuation_rate: 100,
        stock_value: 10000,
        stock_uom: 'Nos',
        bal_qty: 100,
        bal_val: 10000,
        opening_qty: 80,
        opening_val: 8000,
        in_qty: 50,
        in_val: 5000,
        out_qty: 30,
        out_val: 3000,
      },
      // Add more mock data as needed
    ];
  };

  // Generate Stock Ledger Report
  const generateStockLedgerReport = async (filters: ReportFilters): Promise<StockLedgerEntry[]> => {
    // Mock data for demonstration
    return [
      {
        name: 'SLE-001',
        item_code: 'ITEM-001',
        warehouse: 'Main Store',
        posting_date: '2024-01-15',
        posting_time: '10:30:00',
        voucher_type: 'Stock Entry',
        voucher_no: 'STE-001',
        actual_qty: 50,
        qty_after_transaction: 150,
        incoming_rate: 100,
        outgoing_rate: 0,
        stock_value: 15000,
        stock_value_difference: 5000,
        valuation_rate: 100,
        company: 'Sample Company',
      },
    ];
  };

  // Generate Stock Valuation Report
  const generateStockValuationReport = async (filters: ReportFilters) => {
    // Mock data for demonstration
    return [
      {
        warehouse: 'Main Store',
        item_group: 'Raw Material',
        balance_qty: 500,
        balance_value: 50000,
        average_rate: 100,
      },
    ];
  };

  // Generate Stock Ageing Report
  const generateStockAgeingReport = async (filters: ReportFilters): Promise<StockAgeingItem[]> => {
    // Mock data for demonstration
    return [
      {
        item_code: 'ITEM-001',
        item_name: 'Sample Item 1',
        item_group: 'Raw Material',
        warehouse: 'Main Store',
        actual_qty: 100,
        valuation_rate: 100,
        stock_value: 10000,
        age_0_30: 20,
        age_30_60: 30,
        age_60_90: 25,
        age_90_120: 15,
        age_120_above: 10,
        range1: 20,
        range2: 30,
        range3: 25,
        range4: 15,
        range5: 10,
        total_qty: 100,
        total_value: 10000,
        average_age: 45,
        earliest_age: 10,
        latest_age: 150,
      },
    ];
  };

  // Generate ABC Analysis Report
  const generateABCAnalysisReport = async (filters: ReportFilters): Promise<ABCAnalysisItem[]> => {
    // Mock data for demonstration
    return [
      {
        item_code: 'ITEM-001',
        item_name: 'Sample Item 1',
        item_group: 'Raw Material',
        total_outgoing: 1000,
        outgoing_value: 100000,
        percentage_value: 60,
        cumulative_percentage: 60,
        consumption_value: 100000,
        classification: 'A',
      },
      {
        item_code: 'ITEM-002',
        item_name: 'Sample Item 2',
        item_group: 'Raw Material',
        total_outgoing: 400,
        outgoing_value: 40000,
        percentage_value: 24,
        cumulative_percentage: 84,
        consumption_value: 40000,
        classification: 'B',

      },
    ];
  };

  // Load data when report type or filters change
  useEffect(() => {
    loadReportData(activeReport, formData);
  }, [activeReport, formData]);

  const currentConfig = reportConfigs[activeReport];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Stock Reports</h1>
            <p className="text-sm text-gray-500 mt-1">
              Comprehensive stock analysis and reporting
            </p>
          </div>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(reportConfigs).map(([key, config]) => {
            const IconComponent = config.icon;
            return (
              <button
                key={key}
                onClick={() => setActiveReport(key as ReportType)}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  activeReport === key
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <IconComponent className="h-8 w-8 mx-auto mb-2" />
                <div className="text-sm font-medium">{config.title}</div>
                <div className="text-xs text-gray-500 mt-1">{config.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <FormProvider {...methods}>
          <form className="grid grid-cols-6 gap-4">
            {currentConfig.filters.map((filterName) => (
              <div key={filterName}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {getFilterLabel(filterName)}
                </label>
                {renderFilterField(filterName, formData, methods.register)}
              </div>
            ))}
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => loadReportData(activeReport, formData)}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>

      {/* Report Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">{currentConfig.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{currentConfig.description}</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ListView
              doctype="Stock Report"
              data={reportData as any}
              totalCount={reportData.length}
              columns={currentConfig.columns}
              isLoading={false}
              onRowClick={(row) => console.log('Row clicked:', row)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to get filter labels
function getFilterLabel(filterName: string): string {
  const labels: Record<string, string> = {
    company: 'Company',
    warehouse: 'Warehouse',
    item_code: 'Item Code',
    item_group: 'Item Group',
    brand: 'Brand',
    from_date: 'From Date',
    to_date: 'To Date',
    valuation_method: 'Valuation Method',
    ageing_based_on: 'Ageing Based On',
    range1: 'Range 1 (Days)',
    range2: 'Range 2 (Days)',
    range3: 'Range 3 (Days)',
    range4: 'Range 4 (Days)',
  };
  return labels[filterName] || filterName;
}

// Helper function to render filter fields
function renderFilterField(filterName: string, formData: ReportFilters, register: any) {
  switch (filterName) {
    case 'from_date':
    case 'to_date':
      return (
        <input
          {...register(filterName)}
          type="date"
          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      );
    
    case 'range1':
    case 'range2':
    case 'range3':
    case 'range4':
      return (
        <input
          {...register(filterName, { valueAsNumber: true })}
          type="number"
          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      );
    
    case 'valuation_method':
      return (
        <select
          {...register(filterName)}
          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="">All</option>
          <option value="FIFO">FIFO</option>
          <option value="Moving Average">Moving Average</option>
        </select>
      );
    
    case 'ageing_based_on':
      return (
        <select
          {...register(filterName)}
          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="Posting Date">Posting Date</option>
          <option value="Creation Date">Creation Date</option>
        </select>
      );
    
    default:
      return (
        <input
          {...register(filterName)}
          type="text"
          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder={`Enter ${getFilterLabel(filterName)}`}
        />
      );
  }
}