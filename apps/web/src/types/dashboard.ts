// Dashboard and Widget Types

export interface DashboardConfig {
  name: string;
  title: string;
  type: DashboardType;
  widgets: WidgetConfig[];
  layout: DashboardLayout;
  permissions: DashboardPermissions;
  isDefault?: boolean;
  module?: string;
}

export type DashboardType = 'workspace' | 'module' | 'custom';

export interface DashboardLayout {
  columns: number;
  rows: number;
  gridGap: number;
}

export interface DashboardPermissions {
  read: string[];
  write: string[];
  share: string[];
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  position: WidgetPosition;
  size: WidgetSize;
  config: WidgetSpecificConfig;
  permissions?: WidgetPermissions;
  refreshInterval?: number;
}

export type WidgetType = 'chart' | 'number' | 'shortcut' | 'report' | 'custom';

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface WidgetPermissions {
  read: string[];
  write: string[];
}

// Chart Widget Types
export interface ChartWidgetConfig extends WidgetSpecificConfig {
  chartType: ChartType;
  dataSource: ChartDataSource;
  styling: ChartStyling;
  interactions: ChartInteractions;
}

export type ChartType = 'bar' | 'line' | 'pie' | 'donut' | 'area' | 'scatter';

export interface ChartDataSource {
  doctype?: string;
  filters?: FilterCondition[];
  dateRange?: DateRange;
  groupBy?: string;
  aggregateFunction?: AggregateFunction;
  customQuery?: string;
}

export interface DateRange {
  from: string;
  to: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export type AggregateFunction = 'sum' | 'count' | 'avg' | 'min' | 'max';

export interface ChartStyling {
  colors: string[];
  showLegend: boolean;
  showGrid: boolean;
  showTooltip: boolean;
  height: number;
}

export interface ChartInteractions {
  enableDrillDown: boolean;
  enableExport: boolean;
  enableZoom: boolean;
  clickAction?: string;
}

// Number Card Widget Types
export interface NumberCardConfig extends WidgetSpecificConfig {
  dataSource: NumberCardDataSource;
  display: NumberCardDisplay;
  trend: NumberCardTrend;
}

export interface NumberCardDataSource {
  doctype?: string;
  field: string;
  filters?: FilterCondition[];
  aggregateFunction: AggregateFunction;
  customQuery?: string;
}

export interface NumberCardDisplay {
  prefix?: string;
  suffix?: string;
  decimals: number;
  format: 'number' | 'currency' | 'percentage';
  color?: string;
  icon?: string;
}

export interface NumberCardTrend {
  enabled: boolean;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  showPercentage: boolean;
  showArrow: boolean;
}

// Shortcut Widget Types
export interface ShortcutWidgetConfig extends WidgetSpecificConfig {
  shortcuts: ShortcutItem[];
  layout: ShortcutLayout;
}

export interface ShortcutItem {
  label: string;
  icon: string;
  action: ShortcutAction;
  color?: string;
  count?: number;
}

export interface ShortcutAction {
  type: 'navigate' | 'create' | 'report' | 'custom';
  target: string;
  params?: Record<string, unknown>;
}

export interface ShortcutLayout {
  columns: number;
  showLabels: boolean;
  showCounts: boolean;
}

// Report Widget Types
export interface ReportWidgetConfig extends WidgetSpecificConfig {
  reportName: string;
  filters?: FilterCondition[];
  columns?: string[];
  maxRows: number;
  showHeader: boolean;
}

// Custom Widget Types
export interface CustomWidgetConfig extends WidgetSpecificConfig {
  component: string;
  props: Record<string, unknown>;
}

// Base interface for all widget-specific configs
export interface WidgetSpecificConfig {
  [key: string]: unknown;
}

// Widget Data Types
export interface WidgetData {
  id: string;
  data: unknown;
  lastUpdated: string;
  isLoading: boolean;
  error?: string;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export interface NumberCardData {
  value: number;
  trend?: {
    value: number;
    percentage: number;
    direction: 'up' | 'down' | 'neutral';
  };
}

// Dashboard State Types
export interface DashboardState {
  currentDashboard: DashboardConfig | null;
  availableDashboards: DashboardConfig[];
  widgetData: Record<string, WidgetData>;
  isLoading: boolean;
  isEditing: boolean;
  error?: string;
}

// Dashboard Actions
export interface DashboardActions {
  loadDashboard: (name: string) => Promise<void>;
  saveDashboard: (config: DashboardConfig) => Promise<void>;
  addWidget: (widget: WidgetConfig) => void;
  updateWidget: (id: string, updates: Partial<WidgetConfig>) => void;
  removeWidget: (id: string) => void;
  moveWidget: (id: string, position: WidgetPosition) => void;
  resizeWidget: (id: string, size: WidgetSize) => void;
  refreshWidget: (id: string) => Promise<void>;
  refreshAllWidgets: () => Promise<void>;
  toggleEditMode: () => void;
  duplicateDashboard: (name: string, newName: string) => Promise<void>;
  deleteDashboard: (name: string) => Promise<void>;
}

// Import FilterCondition from main types
import type { FilterCondition } from './index';