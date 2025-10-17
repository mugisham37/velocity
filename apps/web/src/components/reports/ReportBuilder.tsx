'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ReportBuilderState, ReportDefinition, ReportResult, ReportType, ChartConfig, SummaryConfig, FormattingOptions } from '@/types/reports';
import { QueryBuilder } from './QueryBuilder';
import { ReportRenderer } from './ReportRenderer';
import { ReportTypeSelector } from './query-builder/ReportTypeSelector';
import { useNotifications } from '@/hooks/useNotifications';
import { useDocuments } from '@/hooks/useDocuments';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DocumentTextIcon,
  EyeIcon,
  Cog6ToothIcon,
  DocumentArrowDownIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface ReportBuilderProps {
  reportName?: string;
  onSave?: (report: ReportDefinition) => void;
  onCancel?: () => void;
}

export function ReportBuilder({ reportName, onSave, onCancel }: ReportBuilderProps) {
  const [activeTab, setActiveTab] = useState<'builder' | 'config' | 'preview'>('builder');
  const [reportState, setReportState] = useState<ReportBuilderState>({
    selectedDocType: '',
    availableFields: [],
    selectedFields: [],
    filters: [],
    groupBy: [],
    orderBy: [],
    relations: [],
    isLoading: false
  });
  const [previewData, setPreviewData] = useState<ReportResult | null>(null);
  const [reportDefinition, setReportDefinition] = useState<Partial<ReportDefinition>>({
    name: reportName || '',
    title: '',
    description: '',
    report_type: 'tabular'
  });
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    type: 'bar',
    x_field: '',
    y_fields: [],
    height: 400
  });
  const [summaryConfig, setSummaryConfig] = useState<SummaryConfig>({
    group_by_fields: [],
    aggregate_functions: [],
    show_totals: true,
    show_percentages: false
  });

  // Update summary config when groupBy changes
  useEffect(() => {
    if (reportDefinition.report_type === 'summary') {
      setSummaryConfig(prev => ({
        ...prev,
        group_by_fields: reportState.groupBy.map(g => g.fieldname),
        aggregate_functions: reportState.selectedFields
          .filter(f => ['Int', 'Float', 'Currency'].includes(f.fieldtype))
          .map(f => ({
            field: f.fieldname,
            function: 'sum' as const,
            label: `Sum of ${f.label}`
          }))
      }));
    }
  }, [reportState.groupBy, reportState.selectedFields, reportDefinition.report_type]);
  const [formattingOptions, setFormattingOptions] = useState<FormattingOptions>({
    show_row_numbers: false,
    alternate_row_colors: true,
    freeze_first_column: false,
    page_size: 50,
    currency_symbol: '$',
    date_format: 'short',
    number_format: 'standard'
  });

  const { showError, showSuccess } = useNotifications();
  const { getList } = useDocuments();

  const handleQueryChange = useCallback((state: ReportBuilderState) => {
    setReportState(state);
  }, []);

  const handlePreview = useCallback(async (state: ReportBuilderState) => {
    if (!state.selectedDocType || state.selectedFields.length === 0) {
      showError('Invalid Query', 'Please select a DocType and at least one field');
      return;
    }

    setReportState(prev => ({ ...prev, isLoading: true }));

    try {
      // Build the query for Frappe
      const fields = state.selectedFields.map(f => f.fieldname);
      const filters = state.filters
        .filter(f => f.fieldname && f.value !== '' && f.value !== null)
        .map(f => [f.fieldname, f.operator, f.value]);

      const orderBy = state.orderBy
        .filter(o => o.fieldname)
        .map(o => `${o.fieldname} ${o.order}`)
        .join(', ');

      // Execute the query
      const response = await getList(state.selectedDocType, {
        fields,
        filters,
        order_by: orderBy || undefined,
        limit: 100 // Limit preview to 100 records
      });

      // Transform the data for display
      const columns = state.selectedFields.map(field => ({
        fieldname: field.fieldname,
        label: field.label,
        width: 150,
        align: ['Int', 'Float', 'Currency'].includes(field.fieldtype) ? 'right' as const : 'left' as const
      }));

      const data = response.data?.map((row: any) => 
        state.selectedFields.map(field => row[field.fieldname] || '')
      ) || [];

      const result: ReportResult = {
        columns,
        data,
        message: `Showing ${data.length} records`
      };

      setPreviewData(result);
      setActiveTab('preview');

      showSuccess('Preview Generated', `Report preview generated with ${data.length} records`);

    } catch (error) {
      console.error('Preview failed:', error);
      showError('Preview Failed', 'Failed to generate report preview. Please check your query.');
    } finally {
      setReportState(prev => ({ ...prev, isLoading: false }));
    }
  }, [getList, showError, showSuccess]);

  const handleSave = useCallback(async (state: ReportBuilderState) => {
    if (!reportDefinition.name || !reportDefinition.title) {
      showError('Missing Information', 'Please provide a report name and title');
      return;
    }

    const definition: ReportDefinition = {
      name: reportDefinition.name,
      title: reportDefinition.title,
      description: reportDefinition.description || '',
      doctype: state.selectedDocType,
      report_type: reportDefinition.report_type || 'tabular',
      query: {
        doctype: state.selectedDocType,
        fields: state.selectedFields,
        filters: state.filters,
        group_by: state.groupBy,
        order_by: state.orderBy
      },
      columns: state.selectedFields.map(field => ({
        fieldname: field.fieldname,
        label: field.label,
        width: 150,
        align: ['Int', 'Float', 'Currency'].includes(field.fieldtype) ? 'right' as const : 'left' as const
      })),
      chart_config: reportDefinition.report_type === 'chart' ? chartConfig : undefined,
      summary_config: reportDefinition.report_type === 'summary' ? summaryConfig : undefined,
      formatting_options: formattingOptions,
      is_standard: false,
      creation: new Date().toISOString(),
      modified: new Date().toISOString()
    };

    onSave?.(definition);
  }, [reportDefinition, onSave, showError]);

  const canPreview = reportState.selectedDocType && reportState.selectedFields.length > 0;
  const canSave = canPreview && reportDefinition.name && reportDefinition.title;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-4">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Report Name"
                  value={reportDefinition.name || ''}
                  onChange={(e) => setReportDefinition(prev => ({ ...prev, name: e.target.value }))}
                  className="text-lg font-semibold text-gray-900 bg-transparent border-none outline-none placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="Report Title"
                  value={reportDefinition.title || ''}
                  onChange={(e) => setReportDefinition(prev => ({ ...prev, title: e.target.value }))}
                  className="text-sm text-gray-600 bg-transparent border-none outline-none placeholder-gray-400 block w-full mt-1"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => handlePreview(reportState)}
              disabled={!canPreview || reportState.isLoading}
              className="flex items-center space-x-2"
            >
              <EyeIcon className="h-4 w-4" />
              <span>Preview</span>
            </Button>
            <Button
              onClick={() => handleSave(reportState)}
              disabled={!canSave || reportState.isLoading}
              className="flex items-center space-x-2"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              <span>Save Report</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'builder' | 'config' | 'preview')}>
          <TabsList className="ml-6">
            <TabsTrigger value="builder" className="flex items-center space-x-2">
              <Cog6ToothIcon className="h-4 w-4" />
              <span>Query Builder</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center space-x-2">
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
              <span>Report Config</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center space-x-2" disabled={!previewData}>
              <EyeIcon className="h-4 w-4" />
              <span>Preview</span>
              {previewData && (
                <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                  {previewData.data.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab}>
          <TabsContent value="builder" className="h-full m-0">
            <QueryBuilder
              onQueryChange={handleQueryChange}
              onPreview={handlePreview}
              onSave={handleSave}
              initialState={reportState}
            />
          </TabsContent>
          <TabsContent value="config" className="h-full m-0 p-6">
            <div className="max-w-4xl mx-auto">
              <ReportTypeSelector
                selectedType={reportDefinition.report_type || 'tabular'}
                onTypeChange={(type) => setReportDefinition(prev => ({ ...prev, report_type: type }))}
                chartConfig={chartConfig}
                onChartConfigChange={setChartConfig}
                summaryConfig={summaryConfig}
                onSummaryConfigChange={setSummaryConfig}
                formattingOptions={formattingOptions}
                onFormattingChange={setFormattingOptions}
              />
            </div>
          </TabsContent>
          <TabsContent value="preview" className="h-full m-0 p-6">
            {previewData ? (
              <Card className="h-full">
                <ReportRenderer
                  data={previewData}
                  title={reportDefinition.title || 'Report Preview'}
                  reportType={reportDefinition.report_type}
                  chartConfig={chartConfig}
                  summaryConfig={summaryConfig}
                  formattingOptions={formattingOptions}
                  showExportOptions={false}
                  onConfigChange={setChartConfig}
                />
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <EyeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Preview Available
                  </h3>
                  <p className="text-gray-600">
                    Build your query and click Preview to see the results
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}