'use client';

import React, { useState } from 'react';
import { 
  CustomFieldManager, 
  CustomScriptEditor, 
  WorkflowDesigner, 
  PermissionManager,
  type Workflow 
} from '@/components/customization';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  WrenchScrewdriverIcon,
  CodeBracketIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useNotifications } from '@/hooks/useNotifications';

type CustomizationTool = 'overview' | 'custom-fields' | 'custom-scripts' | 'workflows' | 'permissions';

interface CustomizationOption {
  id: CustomizationTool;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const CUSTOMIZATION_TOOLS: CustomizationOption[] = [
  {
    id: 'custom-fields',
    title: 'Custom Fields',
    description: 'Add custom fields to DocTypes with validation and positioning',
    icon: WrenchScrewdriverIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
  },
  {
    id: 'custom-scripts',
    title: 'Custom Scripts',
    description: 'Create client and server scripts for business logic and validation',
    icon: CodeBracketIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
  },
  {
    id: 'workflows',
    title: 'Workflow Designer',
    description: 'Design visual workflows with states and transitions',
    icon: Cog6ToothIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
  },
  {
    id: 'permissions',
    title: 'Permission Manager',
    description: 'Manage role-based permissions and access controls',
    icon: ShieldCheckIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100',
  },
];

// Common DocTypes for customization
const COMMON_DOCTYPES = [
  'Customer',
  'Supplier',
  'Item',
  'Sales Order',
  'Purchase Order',
  'Sales Invoice',
  'Purchase Invoice',
  'Delivery Note',
  'Purchase Receipt',
  'Payment Entry',
  'Journal Entry',
  'Lead',
  'Opportunity',
  'Quotation',
  'Project',
  'Task',
  'Employee',
  'Leave Application',
  'Expense Claim',
  'Stock Entry',
  'Material Request',
  'BOM',
  'Work Order',
  'Job Card',
];

export default function CustomizationPage() {
  const [currentTool, setCurrentTool] = useState<CustomizationTool>('overview');
  const [selectedDocType, setSelectedDocType] = useState('Customer');
  const [searchTerm, setSearchTerm] = useState('');
  const { addNotification } = useNotifications();

  // Filter DocTypes based on search
  const filteredDocTypes = COMMON_DOCTYPES.filter(doctype =>
    doctype.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle tool selection
  const selectTool = (toolId: CustomizationTool) => {
    setCurrentTool(toolId);
  };

  // Handle back to overview
  const backToOverview = () => {
    setCurrentTool('overview');
  };

  // Handle script save
  const handleScriptSave = (data: { name: string; doctype: string; script_type: string; event_type: string; script: string; enabled: boolean; description?: string }) => {
    // In real implementation, this would save to API
    addNotification({
      type: 'success',
      title: 'Script Saved',
      message: `Custom script "${data.name}" has been saved successfully.`,
    });
    setCurrentTool('overview');
  };

  // Handle workflow save
  const handleWorkflowSave = (workflow: Workflow) => {
    // In real implementation, this would save to API
    addNotification({
      type: 'success',
      title: 'Workflow Saved',
      message: `Workflow "${workflow.name}" has been saved successfully.`,
    });
    setCurrentTool('overview');
  };

  // Render overview
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customization Tools</h1>
            <p className="text-gray-600 mt-2">
              Customize ERPNext to fit your business needs with fields, scripts, workflows, and permissions
            </p>
          </div>
          <DocumentTextIcon className="h-16 w-16 text-gray-400" />
        </div>
      </Card>

      {/* DocType Selection */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select DocType</h2>
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search DocTypes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
          >
            {filteredDocTypes.map((doctype) => (
              <option key={doctype} value={doctype}>
                {doctype}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-gray-600">
          Selected: <span className="font-medium text-gray-900">{selectedDocType}</span>
        </p>
      </Card>

      {/* Customization Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CUSTOMIZATION_TOOLS.map((tool) => (
          <Card
            key={tool.id}
            className={`p-6 cursor-pointer transition-all duration-200 ${tool.bgColor} border-2 border-transparent hover:border-gray-300`}
            onClick={() => selectTool(tool.id)}
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg bg-white shadow-sm`}>
                <tool.icon className={`h-8 w-8 ${tool.color}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {tool.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {tool.description}
                </p>
                <div className="mt-4">
                  <Button variant="outline" size="sm">
                    Open Tool →
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="justify-start h-auto p-4"
            onClick={() => selectTool('custom-fields')}
          >
            <PlusIcon className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-medium">Add Custom Field</div>
              <div className="text-sm text-gray-500">to {selectedDocType}</div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="justify-start h-auto p-4"
            onClick={() => selectTool('custom-scripts')}
          >
            <CodeBracketIcon className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-medium">Create Script</div>
              <div className="text-sm text-gray-500">for {selectedDocType}</div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="justify-start h-auto p-4"
            onClick={() => selectTool('workflows')}
          >
            <Cog6ToothIcon className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-medium">Design Workflow</div>
              <div className="text-sm text-gray-500">for {selectedDocType}</div>
            </div>
          </Button>
        </div>
      </Card>

      {/* Help and Documentation */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">Need Help?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-blue-900 mb-2">Best Practices</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Test customizations in a development environment first</li>
              <li>• Use descriptive names for custom fields and scripts</li>
              <li>• Document your customizations for future reference</li>
              <li>• Follow ERPNext naming conventions</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-blue-900 mb-2">Important Notes</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Custom fields are added to the database schema</li>
              <li>• Scripts can affect system performance if not optimized</li>
              <li>• Workflows control document state transitions</li>
              <li>• Permissions are enforced at the database level</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );

  // Render current tool
  const renderCurrentTool = () => {
    switch (currentTool) {
      case 'custom-fields':
        return <CustomFieldManager doctype={selectedDocType} onBack={backToOverview} />;
      
      case 'custom-scripts':
        return (
          <CustomScriptEditor
            doctype={selectedDocType}
            onSave={handleScriptSave}
            onCancel={backToOverview}
          />
        );
      
      case 'workflows':
        return (
          <WorkflowDesigner
            doctype={selectedDocType}
            onSave={handleWorkflowSave}
            onCancel={backToOverview}
          />
        );
      
      case 'permissions':
        return <PermissionManager doctype={selectedDocType} onBack={backToOverview} />;
      
      default:
        return renderOverview();
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        {renderCurrentTool()}
      </div>
    </AppLayout>
  );
}