'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FieldErrors } from 'react-hook-form';
import { 
  PlayIcon,
  StopIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  BookOpenIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';

// Validation schema for custom script
const customScriptSchema = z.object({
  name: z.string().min(1, 'Script name is required'),
  doctype: z.string().min(1, 'DocType is required'),
  script_type: z.enum(['Client', 'Server']).describe('Script type is required'),
  event_type: z.string().min(1, 'Event type is required'),
  script: z.string().min(1, 'Script content is required'),
  enabled: z.boolean().default(true),
  description: z.string().optional(),
});

type CustomScriptFormData = z.infer<typeof customScriptSchema>;

interface ScriptError {
  line: number;
  column: number;
  message: string;
  type: 'error' | 'warning';
}

interface CustomScriptEditorProps {
  doctype: string;
  onSave: (data: CustomScriptFormData) => void;
  onCancel: () => void;
  initialData?: Partial<CustomScriptFormData>;
  isEditing?: boolean;
}

// Common ERPNext events for different script types
const CLIENT_EVENTS = [
  { value: 'refresh', label: 'Refresh' },
  { value: 'validate', label: 'Validate' },
  { value: 'before_save', label: 'Before Save' },
  { value: 'after_save', label: 'After Save' },
  { value: 'onload', label: 'On Load' },
  { value: 'onload_post_render', label: 'On Load Post Render' },
  { value: 'before_submit', label: 'Before Submit' },
  { value: 'on_submit', label: 'On Submit' },
  { value: 'before_cancel', label: 'Before Cancel' },
  { value: 'after_cancel', label: 'After Cancel' },
  { value: 'timeline_refresh', label: 'Timeline Refresh' },
];

const SERVER_EVENTS = [
  { value: 'before_insert', label: 'Before Insert' },
  { value: 'after_insert', label: 'After Insert' },
  { value: 'before_validate', label: 'Before Validate' },
  { value: 'validate', label: 'Validate' },
  { value: 'before_save', label: 'Before Save' },
  { value: 'after_save', label: 'After Save' },
  { value: 'before_submit', label: 'Before Submit' },
  { value: 'on_submit', label: 'On Submit' },
  { value: 'before_cancel', label: 'Before Cancel' },
  { value: 'on_cancel', label: 'On Cancel' },
  { value: 'on_trash', label: 'On Trash' },
  { value: 'after_delete', label: 'After Delete' },
  { value: 'before_update_after_submit', label: 'Before Update After Submit' },
];

// Script templates for common use cases
const SCRIPT_TEMPLATES = {
  client_validation: `// Client-side validation example
frappe.ui.form.on('${doctype}', {
    validate: function(frm) {
        // Add your validation logic here
        if (!frm.doc.field_name) {
            frappe.msgprint(__('Field Name is required'));
            frappe.validated = false;
        }
    }
});`,
  
  server_validation: `# Server-side validation example
def validate(self):
    # Add your validation logic here
    if not self.field_name:
        frappe.throw(_("Field Name is required"))`,
  
  client_field_change: `// Field change event example
frappe.ui.form.on('${doctype}', {
    field_name: function(frm) {
        // Triggered when field_name changes
        if (frm.doc.field_name) {
            // Do something when field changes
            frm.set_value('other_field', 'calculated_value');
        }
    }
});`,
  
  server_calculation: `# Server-side calculation example
def before_save(self):
    # Calculate total or perform other operations
    self.total_amount = self.quantity * self.rate
    
    # Set other fields based on calculations
    if self.total_amount > 1000:
        self.discount_applicable = 1`,
  
  client_button_action: `// Custom button example
frappe.ui.form.on('${doctype}', {
    refresh: function(frm) {
        if (frm.doc.docstatus === 1) {
            frm.add_custom_button(__('Custom Action'), function() {
                // Add your custom action here
                frappe.call({
                    method: 'your_app.api.custom_method',
                    args: {
                        'doc_name': frm.doc.name
                    },
                    callback: function(r) {
                        if (r.message) {
                            frappe.msgprint(__('Action completed successfully'));
                            frm.reload_doc();
                        }
                    }
                });
            });
        }
    }
});`,
};

export function CustomScriptEditor({
  doctype,
  onSave,
  onCancel,
  initialData,
  isEditing = false,
}: CustomScriptEditorProps): React.JSX.Element {
  const [scriptErrors, setScriptErrors] = useState<ScriptError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const form = useForm<CustomScriptFormData>({
    resolver: zodResolver(customScriptSchema),
    defaultValues: {
      enabled: true,
      script_type: 'Client',
      ...initialData,
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;
  const watchedScriptType = watch('script_type');
  const watchedScript = watch('script');

  // Get available events based on script type
  const availableEvents = watchedScriptType === 'Client' ? CLIENT_EVENTS : SERVER_EVENTS;

  // Validate script syntax
  const validateScript = async (script: string, scriptType: string): Promise<void> => {
    setIsValidating(true);
    setScriptErrors([]);

    try {
      // Simulate script validation - in real implementation, this would call backend
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock validation errors for demonstration
      const validationErrors: ScriptError[] = [];
      
      if (scriptType === 'Client') {
        // Basic JavaScript syntax checking (simplified)
        if (script.includes('frappe.throw') && !script.includes('frappe.msgprint')) {
          validationErrors.push({
            line: 5,
            column: 12,
            message: 'frappe.throw should not be used in client scripts. Use frappe.msgprint instead.',
            type: 'warning',
          });
        }
        
        if (!script.includes('frappe.ui.form.on') && script.length > 50) {
          validationErrors.push({
            line: 1,
            column: 1,
            message: 'Client scripts should typically use frappe.ui.form.on pattern.',
            type: 'warning',
          });
        }
      } else {
        // Python syntax checking (simplified)
        if (script.includes('def ') && !script.includes('self')) {
          validationErrors.push({
            line: 2,
            column: 8,
            message: 'Server methods should typically include self parameter.',
            type: 'warning',
          });
        }
      }
      
      setScriptErrors(validationErrors);
    } catch (err) {
      console.error('Script validation error:', err);
      setScriptErrors([{
        line: 1,
        column: 1,
        message: 'Failed to validate script syntax.',
        type: 'error',
      }]);
    } finally {
      setIsValidating(false);
    }
  };

  // Insert template into script
  const insertTemplate = (templateKey: string): void => {
    const template = SCRIPT_TEMPLATES[templateKey as keyof typeof SCRIPT_TEMPLATES];
    if (!template || !textareaRef.current) return;
    
    const processedTemplate = template.replace(/\$\{doctype\}/g, doctype);
    form.setValue('script', processedTemplate);
    setShowTemplates(false);
  };

  // Insert text at cursor position
  const insertAtCursor = (text: string): void => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = textarea.value;
    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
    form.setValue('script', newValue);
      
    // Set cursor position after inserted text
    setTimeout(() => {
      if (textarea) {
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();
      }
    }, 0);
  };

  const handleFormSubmit = (data: CustomScriptFormData): void => {
    onSave(data);
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Edit Custom Script' : 'Add Custom Script'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          DocType: <span className="font-medium">{doctype}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Script Name *
            </label>
            <Input
              {...register('name')}
              placeholder="e.g., Customer Validation Script"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Input
              {...register('description')}
              placeholder="Brief description of what this script does"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Script Type *
            </label>
            <select
              {...register('script_type')}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.script_type ? 'border-red-500' : ''
              }`}
            >
              <option value="Client">Client Script (JavaScript)</option>
              <option value="Server">Server Script (Python)</option>
            </select>
            {errors.script_type && (
              <p className="text-red-500 text-xs mt-1">{errors.script_type.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {watchedScriptType === 'Client' 
                ? 'Runs in the browser, handles UI interactions'
                : 'Runs on the server, handles business logic and data validation'
              }
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Type *
            </label>
            <select
              {...register('event_type')}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.event_type ? 'border-red-500' : ''
              }`}
            >
              <option value="">Select Event</option>
              {availableEvents.map((event) => (
                <option key={event.value} value={event.value}>
                  {event.label}
                </option>
              ))}
            </select>
            {errors.event_type && (
              <p className="text-red-500 text-xs mt-1">{errors.event_type.message}</p>
            )}
          </div>
        </div>

        {/* Script Editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Script Content *
            </label>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowTemplates(!showTemplates)}
              >
                <BookOpenIcon className="h-4 w-4 mr-1" />
                Templates
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => validateScript(watchedScript, watchedScriptType)}
                disabled={isValidating || !watchedScript}
              >
                {isValidating ? (
                  <StopIcon className="h-4 w-4 mr-1" />
                ) : (
                  <PlayIcon className="h-4 w-4 mr-1" />
                )}
                {isValidating ? 'Validating...' : 'Validate'}
              </Button>
            </div>
          </div>

          {/* Script Templates */}
          {showTemplates && (
            <Card className="p-4 mb-4 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Script Templates</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertTemplate('client_validation')}
                  className="justify-start"
                >
                  Client Validation
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertTemplate('server_validation')}
                  className="justify-start"
                >
                  Server Validation
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertTemplate('client_field_change')}
                  className="justify-start"
                >
                  Field Change Event
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertTemplate('server_calculation')}
                  className="justify-start"
                >
                  Server Calculation
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertTemplate('client_button_action')}
                  className="justify-start"
                >
                  Custom Button
                </Button>
              </div>
            </Card>
          )}

          <div className="relative">
            <textarea
              ref={textareaRef}
              {...register('script')}
              rows={20}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                errors.script ? 'border-red-500' : ''
              }`}
              placeholder={
                watchedScriptType === 'Client'
                  ? `// Client script example\nfrappe.ui.form.on('${doctype}', {\n    refresh: function(frm) {\n        // Your code here\n    }\n});`
                  : `# Server script example\ndef validate(self):\n    # Your code here\n    pass`
              }
            />
            
            {/* Line numbers overlay (simplified) */}
            <div className="absolute left-2 top-2 text-xs text-gray-400 pointer-events-none font-mono leading-5">
              {watchedScript && watchedScript.split('\n').map((_, index) => (
                <div key={index}>{index + 1}</div>
              ))}
            </div>
          </div>
          
          {errors.script && (
            <p className="text-red-500 text-xs mt-1">{errors.script.message}</p>
          )}

          {/* Script Errors */}
          {scriptErrors.length > 0 && (
            <div className="mt-3 space-y-2">
              {scriptErrors.map((error, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-2 p-2 rounded-md text-sm ${
                    error.type === 'error'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-yellow-50 text-yellow-700'
                  }`}
                >
                  {error.type === 'error' ? (
                    <XCircleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <ExclamationTriangleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <span className="font-medium">
                      Line {error.line}, Column {error.column}:
                    </span>{' '}
                    {error.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Script Options */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Options</h3>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('enabled')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Enable this script</span>
          </label>
        </div>

        {/* Help Text */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <DocumentTextIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">
                {watchedScriptType === 'Client' ? 'Client Script Guidelines' : 'Server Script Guidelines'}
              </h4>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                {watchedScriptType === 'Client' ? (
                  <>
                    <li>• Use frappe.ui.form.on() pattern for form events</li>
                    <li>• Access document data with frm.doc</li>
                    <li>• Use frm.set_value() to update fields</li>
                    <li>• Use frappe.msgprint() for user messages</li>
                    <li>• Avoid heavy computations in client scripts</li>
                  </>
                ) : (
                  <>
                    <li>• Use self to access document fields</li>
                    <li>• Use frappe.throw() for validation errors</li>
                    <li>• Access database with frappe.db methods</li>
                    <li>• Use frappe.get_doc() to load other documents</li>
                    <li>• Follow Python coding standards</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Update Script' : 'Save Script'}
          </Button>
        </div>
      </form>
    </Card>
  );
}