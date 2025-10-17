'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  ReportBuilderState, 
  ReportField, 
  ReportFilter, 
  ReportGroupBy,
  DocTypeRelation 
} from '@/types/reports';
import { DocTypeSelector } from './query-builder/DocTypeSelector';
import { FieldSelector } from './query-builder/FieldSelector';
import { FilterBuilder } from './query-builder/FilterBuilder';
import { GroupByBuilder } from './query-builder/GroupByBuilder';
import { OrderByBuilder } from './query-builder/OrderByBuilder';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PlayIcon, 
  DocumentArrowDownIcon,
  Cog6ToothIcon 
} from '@heroicons/react/24/outline';

interface QueryBuilderProps {
  onQueryChange?: (state: ReportBuilderState) => void;
  onPreview?: (state: ReportBuilderState) => void;
  onSave?: (state: ReportBuilderState) => void;
  initialState?: Partial<ReportBuilderState>;
}

export function QueryBuilder({ 
  onQueryChange, 
  onPreview, 
  onSave,
  initialState 
}: QueryBuilderProps) {
  const [state, setState] = useState<ReportBuilderState>({
    selectedDocType: '',
    availableFields: [],
    selectedFields: [],
    filters: [],
    groupBy: [],
    orderBy: [],
    relations: [],
    isLoading: false,
    ...initialState
  });

  // Notify parent of state changes
  useEffect(() => {
    onQueryChange?.(state);
  }, [state, onQueryChange]);

  const handleDocTypeChange = useCallback((doctype: string, fields: ReportField[], relations: DocTypeRelation[]) => {
    setState(prev => ({
      ...prev,
      selectedDocType: doctype,
      availableFields: fields,
      relations,
      selectedFields: [],
      filters: [],
      groupBy: [],
      orderBy: []
    }));
  }, []);

  const handleFieldsChange = useCallback((fields: ReportField[]) => {
    setState(prev => ({ ...prev, selectedFields: fields }));
  }, []);

  const handleFiltersChange = useCallback((filters: ReportFilter[]) => {
    setState(prev => ({ ...prev, filters }));
  }, []);

  const handleGroupByChange = useCallback((groupBy: ReportGroupBy[]) => {
    setState(prev => ({ ...prev, groupBy }));
  }, []);

  const handleOrderByChange = useCallback((orderBy: { fieldname: string; order: 'asc' | 'desc' }[]) => {
    setState(prev => ({ ...prev, orderBy }));
  }, []);

  const handlePreview = useCallback(() => {
    if (!state.selectedDocType || state.selectedFields.length === 0) {
      return;
    }
    onPreview?.(state);
  }, [state, onPreview]);

  const handleSave = useCallback(() => {
    if (!state.selectedDocType || state.selectedFields.length === 0) {
      return;
    }
    onSave?.(state);
  }, [state, onSave]);

  const canPreview = state.selectedDocType && state.selectedFields.length > 0;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Report Builder</h1>
              <p className="text-sm text-gray-600 mt-1">
                Create custom reports by selecting fields, filters, and grouping options
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={!canPreview || state.isLoading}
                className="flex items-center space-x-2"
              >
                <PlayIcon className="h-4 w-4" />
                <span>Preview</span>
              </Button>
              <Button
                onClick={handleSave}
                disabled={!canPreview || state.isLoading}
                className="flex items-center space-x-2"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>Save Report</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Configuration */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-sm font-medium text-gray-900 mb-3">Data Source</h2>
              <DocTypeSelector
                selectedDocType={state.selectedDocType}
                onDocTypeChange={handleDocTypeChange}
              />
            </div>

            {state.selectedDocType && (
              <div className="flex-1 overflow-y-auto">
                <Tabs defaultValue="fields" className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-4 mx-4 mt-4">
                    <TabsTrigger value="fields" className="text-xs">Fields</TabsTrigger>
                    <TabsTrigger value="filters" className="text-xs">Filters</TabsTrigger>
                    <TabsTrigger value="group" className="text-xs">Group</TabsTrigger>
                    <TabsTrigger value="sort" className="text-xs">Sort</TabsTrigger>
                  </TabsList>

                  <div className="flex-1 overflow-hidden">
                    <TabsContent value="fields" className="h-full m-0 p-4">
                      <FieldSelector
                        availableFields={state.availableFields}
                        selectedFields={state.selectedFields}
                        relations={state.relations}
                        onFieldsChange={handleFieldsChange}
                      />
                    </TabsContent>

                    <TabsContent value="filters" className="h-full m-0 p-4">
                      <FilterBuilder
                        availableFields={state.availableFields}
                        filters={state.filters}
                        onFiltersChange={handleFiltersChange}
                      />
                    </TabsContent>

                    <TabsContent value="group" className="h-full m-0 p-4">
                      <GroupByBuilder
                        availableFields={state.selectedFields}
                        groupBy={state.groupBy}
                        onGroupByChange={handleGroupByChange}
                      />
                    </TabsContent>

                    <TabsContent value="sort" className="h-full m-0 p-4">
                      <OrderByBuilder
                        availableFields={state.selectedFields}
                        orderBy={state.orderBy}
                        onOrderByChange={handleOrderByChange}
                      />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            )}
          </div>

          {/* Right Panel - Preview Area */}
          <div className="flex-1 flex flex-col bg-gray-50">
            {!state.selectedDocType ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Cog6ToothIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a DocType to Start
                  </h3>
                  <p className="text-gray-600 max-w-sm">
                    Choose a DocType from the left panel to begin building your report. 
                    You can then select fields, add filters, and configure grouping options.
                  </p>
                </div>
              </div>
            ) : state.selectedFields.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <DocumentArrowDownIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Add Fields to Your Report
                  </h3>
                  <p className="text-gray-600 max-w-sm">
                    Select fields from the Fields tab to include in your report. 
                    You can drag and drop fields to reorder them.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 p-6">
                <Card className="h-full">
                  <div className="p-6 h-full flex items-center justify-center">
                    <div className="text-center">
                      <PlayIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Ready to Preview
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Your report configuration is ready. Click Preview to see the results.
                      </p>
                      <Button onClick={handlePreview} disabled={state.isLoading}>
                        {state.isLoading ? 'Loading...' : 'Preview Report'}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}