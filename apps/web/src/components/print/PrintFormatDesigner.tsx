'use client';

import React, { useState, useCallback, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ElementPropertiesPanel } from './ElementPropertiesPanel';
import { 
  Save, 
  Eye, 
  Undo, 
  Redo, 
  Type, 
  Image, 
  Table, 
  Minus,
  Settings,
  Trash2
} from 'lucide-react';

// Types for print format elements
export interface PrintElement {
  id: string;
  type: 'text' | 'field' | 'image' | 'table' | 'line' | 'barcode';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fieldname?: string;
  style: {
    fontSize: number;
    fontFamily: string;
    fontWeight: 'normal' | 'bold';
    fontStyle: 'normal' | 'italic';
    textAlign: 'left' | 'center' | 'right';
    color: string;
    backgroundColor?: string;
    border?: {
      width: number;
      style: 'solid' | 'dashed' | 'dotted';
      color: string;
    };
    padding: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
  conditions?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains';
    value: string;
  }[];
}

export interface PrintFormat {
  name: string;
  doctype: string;
  is_standard: boolean;
  letterhead?: string;
  page_size: 'A4' | 'A3' | 'Letter' | 'Legal';
  orientation: 'Portrait' | 'Landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  elements: PrintElement[];
  css?: string;
}

interface PrintFormatDesignerProps {
  printFormat?: PrintFormat;
  doctype: string;
  onSave: (format: PrintFormat) => void;
  onCancel: () => void;
  availableFields?: { fieldname: string; label: string; fieldtype: string }[];
  availableLetterheads?: { name: string; company: string }[];
}

// Draggable element component
const DraggableElement: React.FC<{
  element: PrintElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ element, isSelected, onSelect, onDelete }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: 'element',
    item: { id: element.id, type: element.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Connect the drag source to the element
  React.useEffect(() => {
    drag(elementRef.current);
  }, [drag]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(element.id);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Open element editor
  };

  return (
    <div
      ref={elementRef}
      className={`absolute cursor-move border-2 ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      } ${isDragging ? 'opacity-50' : ''}`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        fontSize: element.style.fontSize,
        fontFamily: element.style.fontFamily,
        fontWeight: element.style.fontWeight,
        fontStyle: element.style.fontStyle,
        textAlign: element.style.textAlign,
        color: element.style.color,
        backgroundColor: element.style.backgroundColor,
        padding: `${element.style.padding.top}px ${element.style.padding.right}px ${element.style.padding.bottom}px ${element.style.padding.left}px`,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Element content based on type */}
      {element.type === 'text' && (
        <div className="w-full h-full overflow-hidden">
          {element.content || 'Text Element'}
        </div>
      )}
      {element.type === 'field' && (
        <div className="w-full h-full overflow-hidden text-gray-600">
          {`{${element.fieldname || 'field_name'}}`}
        </div>
      )}
      {element.type === 'image' && (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-500">
          <Image className="w-6 h-6" aria-label="Image placeholder" />
        </div>
      )}
      {element.type === 'table' && (
        <div className="w-full h-full bg-gray-50 border border-gray-300">
          <div className="text-xs text-gray-600 p-1">Table</div>
        </div>
      )}
      {element.type === 'line' && (
        <div className="w-full h-full border-t border-gray-800"></div>
      )}

      {/* Selection handles */}
      {isSelected && (
        <>
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 border border-white"></div>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 border border-white"></div>
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 border border-white"></div>
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 border border-white"></div>
          
          {/* Delete button */}
          <button
            className="absolute -top-6 -right-6 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(element.id);
            }}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </>
      )}
    </div>
  );
};

// Element palette component
const ElementPalette: React.FC<{
  onAddElement: (type: PrintElement['type']) => void;
}> = ({ onAddElement }) => {
  const elements = [
    { type: 'text' as const, icon: Type, label: 'Text' },
    { type: 'field' as const, icon: Type, label: 'Field' },
    { type: 'image' as const, icon: Image, label: 'Image' },
    { type: 'table' as const, icon: Table, label: 'Table' },
    { type: 'line' as const, icon: Minus, label: 'Line' },
  ];

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-3">Elements</h3>
      <div className="space-y-2">
        {elements.map((element) => (
          <Button
            key={element.type}
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => onAddElement(element.type)}
          >
            <element.icon className="w-4 h-4 mr-2" />
            {element.label}
          </Button>
        ))}
      </div>
    </Card>
  );
};

export const PrintFormatDesigner: React.FC<PrintFormatDesignerProps> = ({
  printFormat,
  doctype,
  onSave,
  onCancel,
  availableFields = [],
  availableLetterheads = [],
}) => {
  const [format, setFormat] = useState<PrintFormat>(
    printFormat || {
      name: 'New Print Format',
      doctype,
      is_standard: false,
      page_size: 'A4',
      orientation: 'Portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      elements: [],
    }
  );

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [history, setHistory] = useState<PrintFormat[]>([format]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Add element to canvas
  const addElement = useCallback((type: PrintElement['type']) => {
    const newElement: PrintElement = {
      id: `element_${Date.now()}`,
      type,
      x: 50,
      y: 50,
      width: type === 'line' ? 200 : 150,
      height: type === 'line' ? 2 : 30,
      content: type === 'text' ? 'Sample Text' : undefined,
      fieldname: type === 'field' ? 'name' : undefined,
      style: {
        fontSize: 12,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'left',
        color: '#000000',
        padding: { top: 2, right: 4, bottom: 2, left: 4 },
      },
    };

    const newFormat = {
      ...format,
      elements: [...format.elements, newElement],
    };

    setFormat(newFormat);
    setSelectedElementId(newElement.id);
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newFormat);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [format, history, historyIndex]);

  // Update element
  const updateElement = useCallback((id: string, updates: Partial<PrintElement>) => {
    const newFormat = {
      ...format,
      elements: format.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    };
    setFormat(newFormat);
  }, [format]);

  // Delete element
  const deleteElement = useCallback((id: string) => {
    const newFormat = {
      ...format,
      elements: format.elements.filter((el) => el.id !== id),
    };
    setFormat(newFormat);
    setSelectedElementId(null);
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newFormat);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [format, history, historyIndex]);

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setFormat(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setFormat(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Canvas drop handler
  const [{ isOver }, drop] = useDrop({
    accept: 'element',
    drop: (item: { id: string; type: string }, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      
      if (offset && canvasRect) {
        const x = offset.x - canvasRect.left;
        const y = offset.y - canvasRect.top;
        
        updateElement(item.id, { x, y });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Calculate canvas dimensions based on page size
  const getCanvasDimensions = () => {
    const dpi = 96; // Screen DPI
    const mmToPx = dpi / 25.4;
    
    let width, height;
    switch (format.page_size) {
      case 'A4':
        width = 210 * mmToPx;
        height = 297 * mmToPx;
        break;
      case 'A3':
        width = 297 * mmToPx;
        height = 420 * mmToPx;
        break;
      case 'Letter':
        width = 216 * mmToPx;
        height = 279 * mmToPx;
        break;
      case 'Legal':
        width = 216 * mmToPx;
        height = 356 * mmToPx;
        break;
      default:
        width = 210 * mmToPx;
        height = 297 * mmToPx;
    }

    if (format.orientation === 'Landscape') {
      [width, height] = [height, width];
    }

    return { width, height };
  };

  const canvasDimensions = getCanvasDimensions();

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex === 0}>
              <Undo className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex === history.length - 1}>
              <Redo className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={() => onSave(format)}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Left Sidebar - Element Palette */}
          <div className="w-64 bg-white border-r border-gray-200 p-4">
            <ElementPalette onAddElement={addElement} />
          </div>

          {/* Main Canvas Area */}
          <div className="flex-1 p-8 overflow-auto">
            <div className="flex justify-center">
              <div
                ref={(node) => {
                  canvasRef.current = node;
                  drop(node);
                }}
                className={`relative bg-white shadow-lg ${isOver ? 'ring-2 ring-blue-500' : ''}`}
                style={{
                  width: canvasDimensions.width,
                  height: canvasDimensions.height,
                  minHeight: '600px',
                }}
                onClick={() => setSelectedElementId(null)}
              >
                {/* Margin guides */}
                <div
                  className="absolute border border-dashed border-gray-300 pointer-events-none"
                  style={{
                    top: format.margins.top,
                    left: format.margins.left,
                    right: format.margins.right,
                    bottom: format.margins.bottom,
                  }}
                />

                {/* Render elements */}
                {format.elements.map((element) => (
                  <DraggableElement
                    key={element.id}
                    element={element}
                    isSelected={selectedElementId === element.id}
                    onSelect={setSelectedElementId}
                    onDelete={deleteElement}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Properties Panel */}
          <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
            {selectedElementId ? (
              <div>
                <h3 className="text-sm font-medium mb-3">Element Properties</h3>
                {(() => {
                  const selectedElement = format.elements.find(el => el.id === selectedElementId);
                  if (!selectedElement) return null;
                  
                  return (
                    <ElementPropertiesPanel
                      element={selectedElement}
                      onUpdate={(updates) => updateElement(selectedElementId, updates)}
                      availableFields={availableFields}
                    />
                  );
                })()}
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-medium mb-3">Page Settings</h3>
                <div className="space-y-4">
                  <Card className="p-4">
                    <h4 className="text-sm font-medium mb-3">Format Settings</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Format Name
                        </label>
                        <input
                          type="text"
                          value={format.name}
                          onChange={(e) => setFormat({ ...format, name: e.target.value })}
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Page Size
                        </label>
                        <select
                          value={format.page_size}
                          onChange={(e) => setFormat({ ...format, page_size: e.target.value as PrintFormat['page_size'] })}
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="A4">A4</option>
                          <option value="A3">A3</option>
                          <option value="Letter">Letter</option>
                          <option value="Legal">Legal</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Orientation
                        </label>
                        <select
                          value={format.orientation}
                          onChange={(e) => setFormat({ ...format, orientation: e.target.value as PrintFormat['orientation'] })}
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="Portrait">Portrait</option>
                          <option value="Landscape">Landscape</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Letterhead
                        </label>
                        <select
                          value={format.letterhead || ''}
                          onChange={(e) => setFormat({ ...format, letterhead: e.target.value || undefined })}
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="">No Letterhead</option>
                          {availableLetterheads.map((letterhead) => (
                            <option key={letterhead.name} value={letterhead.name}>
                              {letterhead.name} ({letterhead.company})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="text-sm font-medium mb-3">Margins (px)</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Top</label>
                        <input
                          type="number"
                          value={format.margins.top}
                          onChange={(e) => setFormat({ 
                            ...format, 
                            margins: { ...format.margins, top: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Right</label>
                        <input
                          type="number"
                          value={format.margins.right}
                          onChange={(e) => setFormat({ 
                            ...format, 
                            margins: { ...format.margins, right: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Bottom</label>
                        <input
                          type="number"
                          value={format.margins.bottom}
                          onChange={(e) => setFormat({ 
                            ...format, 
                            margins: { ...format.margins, bottom: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Left</label>
                        <input
                          type="number"
                          value={format.margins.left}
                          onChange={(e) => setFormat({ 
                            ...format, 
                            margins: { ...format.margins, left: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default PrintFormatDesigner;