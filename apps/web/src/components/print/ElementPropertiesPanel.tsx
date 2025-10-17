'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PrintElement } from './PrintFormatDesigner';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Bold, 
  Italic
} from 'lucide-react';

interface ElementPropertiesPanelProps {
  element: PrintElement;
  onUpdate: (updates: Partial<PrintElement>) => void;
  availableFields?: { fieldname: string; label: string; fieldtype: string }[];
}

export const ElementPropertiesPanel: React.FC<ElementPropertiesPanelProps> = ({
  element,
  onUpdate,
  availableFields = [],
}) => {
  const updateStyle = (styleUpdates: Partial<PrintElement['style']>) => {
    onUpdate({
      style: {
        ...element.style,
        ...styleUpdates,
      },
    });
  };

  const updatePadding = (side: keyof PrintElement['style']['padding'], value: number) => {
    updateStyle({
      padding: {
        ...element.style.padding,
        [side]: value,
      },
    });
  };

  const updateBorder = (borderUpdates: Partial<NonNullable<PrintElement['style']['border']>>) => {
    updateStyle({
      border: {
        width: element.style.border?.width || 0,
        style: element.style.border?.style || 'solid',
        color: element.style.border?.color || '#000000',
        ...borderUpdates,
      },
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h4 className="text-sm font-medium mb-3">Position & Size</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">X</label>
            <input
              type="number"
              value={element.x}
              onChange={(e) => onUpdate({ x: parseInt(e.target.value) || 0 })}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Y</label>
            <input
              type="number"
              value={element.y}
              onChange={(e) => onUpdate({ y: parseInt(e.target.value) || 0 })}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Width</label>
            <input
              type="number"
              value={element.width}
              onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 0 })}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
            <input
              type="number"
              value={element.height}
              onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 0 })}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
            />
          </div>
        </div>
      </Card>

      {/* Content Settings */}
      {(element.type === 'text' || element.type === 'field') && (
        <Card className="p-4">
          <h4 className="text-sm font-medium mb-3">Content</h4>
          
          {element.type === 'text' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Text</label>
              <textarea
                value={element.content || ''}
                onChange={(e) => onUpdate({ content: e.target.value })}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 h-20 resize-none"
                placeholder="Enter text content..."
              />
            </div>
          )}

          {element.type === 'field' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Field</label>
              <select
                value={element.fieldname || ''}
                onChange={(e) => onUpdate({ fieldname: e.target.value })}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="">Select Field</option>
                {availableFields.map((field) => (
                  <option key={field.fieldname} value={field.fieldname}>
                    {field.label} ({field.fieldname})
                  </option>
                ))}
              </select>
            </div>
          )}
        </Card>
      )}

      {/* Typography */}
      <Card className="p-4">
        <h4 className="text-sm font-medium mb-3">Typography</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Font Family</label>
            <select
              value={element.style.fontFamily}
              onChange={(e) => updateStyle({ fontFamily: e.target.value })}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="Arial, sans-serif">Arial</option>
              <option value="Helvetica, sans-serif">Helvetica</option>
              <option value="Times New Roman, serif">Times New Roman</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="Courier New, monospace">Courier New</option>
              <option value="Verdana, sans-serif">Verdana</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
            <input
              type="number"
              value={element.style.fontSize}
              onChange={(e) => updateStyle({ fontSize: parseInt(e.target.value) || 12 })}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
              min="6"
              max="72"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Style</label>
            <div className="flex space-x-1">
              <Button
                variant={element.style.fontWeight === 'bold' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateStyle({ 
                  fontWeight: element.style.fontWeight === 'bold' ? 'normal' : 'bold' 
                })}
                className="px-2"
              >
                <Bold className="w-3 h-3" />
              </Button>
              <Button
                variant={element.style.fontStyle === 'italic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateStyle({ 
                  fontStyle: element.style.fontStyle === 'italic' ? 'normal' : 'italic' 
                })}
                className="px-2"
              >
                <Italic className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Alignment</label>
            <div className="flex space-x-1">
              <Button
                variant={element.style.textAlign === 'left' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateStyle({ textAlign: 'left' })}
                className="px-2"
              >
                <AlignLeft className="w-3 h-3" />
              </Button>
              <Button
                variant={element.style.textAlign === 'center' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateStyle({ textAlign: 'center' })}
                className="px-2"
              >
                <AlignCenter className="w-3 h-3" />
              </Button>
              <Button
                variant={element.style.textAlign === 'right' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateStyle({ textAlign: 'right' })}
                className="px-2"
              >
                <AlignRight className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Text Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={element.style.color}
                onChange={(e) => updateStyle({ color: e.target.value })}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={element.style.color}
                onChange={(e) => updateStyle({ color: e.target.value })}
                className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Background & Border */}
      <Card className="p-4">
        <h4 className="text-sm font-medium mb-3">Background & Border</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Background Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={element.style.backgroundColor || '#ffffff'}
                onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={element.style.backgroundColor || ''}
                onChange={(e) => updateStyle({ backgroundColor: e.target.value || undefined })}
                className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                placeholder="transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Border</label>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <input
                    type="number"
                    value={element.style.border?.width || 0}
                    onChange={(e) => updateBorder({ width: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    placeholder="Width"
                    min="0"
                  />
                </div>
                <div>
                  <select
                    value={element.style.border?.style || 'solid'}
                    onChange={(e) => updateBorder({ style: e.target.value as any })}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </div>
                <div>
                  <input
                    type="color"
                    value={element.style.border?.color || '#000000'}
                    onChange={(e) => updateBorder({ color: e.target.value })}
                    className="w-full h-7 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Padding */}
      <Card className="p-4">
        <h4 className="text-sm font-medium mb-3">Padding</h4>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Top</label>
            <input
              type="number"
              value={element.style.padding.top}
              onChange={(e) => updatePadding('top', parseInt(e.target.value) || 0)}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
              min="0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Right</label>
            <input
              type="number"
              value={element.style.padding.right}
              onChange={(e) => updatePadding('right', parseInt(e.target.value) || 0)}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
              min="0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Bottom</label>
            <input
              type="number"
              value={element.style.padding.bottom}
              onChange={(e) => updatePadding('bottom', parseInt(e.target.value) || 0)}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
              min="0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Left</label>
            <input
              type="number"
              value={element.style.padding.left}
              onChange={(e) => updatePadding('left', parseInt(e.target.value) || 0)}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
              min="0"
            />
          </div>
        </div>
      </Card>

      {/* Conditional Printing */}
      <Card className="p-4">
        <h4 className="text-sm font-medium mb-3">Conditional Printing</h4>
        
        <div className="space-y-2">
          <p className="text-xs text-gray-600">
            Show this element only when certain conditions are met.
          </p>
          
          {element.conditions?.map((condition, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
              <select
                value={condition.field}
                onChange={(e) => {
                  const newConditions = [...(element.conditions || [])];
                  newConditions[index] = { ...condition, field: e.target.value };
                  onUpdate({ conditions: newConditions });
                }}
                className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="">Select Field</option>
                {availableFields.map((field) => (
                  <option key={field.fieldname} value={field.fieldname}>
                    {field.label}
                  </option>
                ))}
              </select>
              
              <select
                value={condition.operator}
                onChange={(e) => {
                  const newConditions = [...(element.conditions || [])];
                  newConditions[index] = { ...condition, operator: e.target.value as any };
                  onUpdate({ conditions: newConditions });
                }}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="contains">Contains</option>
                <option value="not_contains">Not Contains</option>
              </select>
              
              <input
                type="text"
                value={condition.value}
                onChange={(e) => {
                  const newConditions = [...(element.conditions || [])];
                  newConditions[index] = { ...condition, value: e.target.value };
                  onUpdate({ conditions: newConditions });
                }}
                className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                placeholder="Value"
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newConditions = element.conditions?.filter((_, i) => i !== index) || [];
                  onUpdate({ conditions: newConditions });
                }}
                className="px-2"
              >
                ×
              </Button>
            </div>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newConditions = [
                ...(element.conditions || []),
                { field: '', operator: 'equals' as const, value: '' },
              ];
              onUpdate({ conditions: newConditions });
            }}
            className="w-full"
          >
            Add Condition
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ElementPropertiesPanel;