'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Save, 
  Eye, 
  Upload, 
  Trash2, 
  Image as ImageIcon,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  X
} from 'lucide-react';

export interface LetterheadElement {
  id: string;
  type: 'text' | 'image' | 'line';
  content?: string;
  src?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    textDecoration?: 'none' | 'underline';
    textAlign?: 'left' | 'center' | 'right';
    color?: string;
    backgroundColor?: string;
    borderWidth?: number;
    borderColor?: string;
    borderStyle?: 'solid' | 'dashed' | 'dotted';
  };
}

export interface Letterhead {
  name: string;
  company: string;
  is_default: boolean;
  disabled: boolean;
  header_html?: string;
  footer_html?: string;
  header_elements: LetterheadElement[];
  footer_elements: LetterheadElement[];
  header_height: number;
  footer_height: number;
  logo?: string;
  logo_width?: number;
  logo_height?: number;
}

interface LetterheadDesignerProps {
  letterhead?: Letterhead;
  onSave: (letterhead: Letterhead) => void;
  onCancel: () => void;
}

export const LetterheadDesigner: React.FC<LetterheadDesignerProps> = ({
  letterhead,
  onSave,
  onCancel,
}) => {
  const [currentLetterhead, setCurrentLetterhead] = useState<Letterhead>(
    letterhead || {
      name: 'New Letterhead',
      company: '',
      is_default: false,
      disabled: false,
      header_elements: [],
      footer_elements: [],
      header_height: 100,
      footer_height: 60,
    }
  );

  const [activeSection, setActiveSection] = useState<'header' | 'footer'>('header');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentElements = activeSection === 'header' 
    ? currentLetterhead.header_elements 
    : currentLetterhead.footer_elements;

  const currentHeight = activeSection === 'header' 
    ? currentLetterhead.header_height 
    : currentLetterhead.footer_height;

  // Add element to current section
  const addElement = (type: LetterheadElement['type']) => {
    const newElement: LetterheadElement = {
      id: `element_${Date.now()}`,
      type,
      x: 50,
      y: 20,
      width: type === 'image' ? 100 : 200,
      height: type === 'image' ? 50 : 30,
      content: type === 'text' ? 'Sample Text' : undefined,
      style: {
        fontSize: 14,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'left',
        color: '#000000',
      },
    };

    const updatedElements = [...currentElements, newElement];
    
    if (activeSection === 'header') {
      setCurrentLetterhead({
        ...currentLetterhead,
        header_elements: updatedElements,
      });
    } else {
      setCurrentLetterhead({
        ...currentLetterhead,
        footer_elements: updatedElements,
      });
    }

    setSelectedElementId(newElement.id);
  };

  // Update element
  const updateElement = (id: string, updates: Partial<LetterheadElement>) => {
    const updatedElements = currentElements.map(el =>
      el.id === id ? { ...el, ...updates } : el
    );

    if (activeSection === 'header') {
      setCurrentLetterhead({
        ...currentLetterhead,
        header_elements: updatedElements,
      });
    } else {
      setCurrentLetterhead({
        ...currentLetterhead,
        footer_elements: updatedElements,
      });
    }
  };

  // Delete element
  const deleteElement = (id: string) => {
    const updatedElements = currentElements.filter(el => el.id !== id);
    
    if (activeSection === 'header') {
      setCurrentLetterhead({
        ...currentLetterhead,
        header_elements: updatedElements,
      });
    } else {
      setCurrentLetterhead({
        ...currentLetterhead,
        footer_elements: updatedElements,
      });
    }

    setSelectedElementId(null);
  };

  // Handle logo upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoUrl = e.target?.result as string;
        setCurrentLetterhead({
          ...currentLetterhead,
          logo: logoUrl,
          logo_width: 120,
          logo_height: 60,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Update section height
  const updateSectionHeight = (height: number) => {
    if (activeSection === 'header') {
      setCurrentLetterhead({
        ...currentLetterhead,
        header_height: height,
      });
    } else {
      setCurrentLetterhead({
        ...currentLetterhead,
        footer_height: height,
      });
    }
  };

  // Render element
  const renderElement = (element: LetterheadElement) => {
    const isSelected = selectedElementId === element.id;
    
    return (
      <div
        key={element.id}
        className={`absolute cursor-pointer border-2 ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-gray-300'
        }`}
        style={{
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
        }}
        onClick={() => setSelectedElementId(element.id)}
      >
        {element.type === 'text' && (
          <div
            className="w-full h-full overflow-hidden"
            style={{
              fontSize: element.style.fontSize,
              fontFamily: element.style.fontFamily,
              fontWeight: element.style.fontWeight,
              fontStyle: element.style.fontStyle,
              textDecoration: element.style.textDecoration,
              textAlign: element.style.textAlign,
              color: element.style.color,
              backgroundColor: element.style.backgroundColor,
            }}
          >
            {element.content}
          </div>
        )}

        {element.type === 'image' && (
          <div className="w-full h-full">
            {element.src ? (
              <img 
                src={element.src} 
                alt="Letterhead element"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                <ImageIcon className="w-6 h-6" />
              </div>
            )}
          </div>
        )}

        {element.type === 'line' && (
          <div
            className="w-full"
            style={{
              borderTop: `${element.style.borderWidth || 1}px ${element.style.borderStyle || 'solid'} ${element.style.borderColor || '#000000'}`,
              height: element.style.borderWidth || 1,
            }}
          />
        )}

        {/* Selection handles */}
        {isSelected && (
          <>
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 border border-white"></div>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 border border-white"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 border border-white"></div>
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 border border-white"></div>
            
            <button
              className="absolute -top-6 -right-6 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
              onClick={(e) => {
                e.stopPropagation();
                deleteElement(element.id);
              }}
            >
              <X className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
    );
  };

  const selectedElement = currentElements.find(el => el.id === selectedElementId);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-medium">Letterhead Designer</h2>
          <span className="text-sm text-gray-600">{currentLetterhead.name}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? 'Edit' : 'Preview'}
          </Button>
          
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          
          <Button onClick={() => onSave(currentLetterhead)}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Sidebar - Tools */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          {/* Letterhead Settings */}
          <Card className="p-4 mb-4">
            <h3 className="text-sm font-medium mb-3">Letterhead Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={currentLetterhead.name}
                  onChange={(e) => setCurrentLetterhead({
                    ...currentLetterhead,
                    name: e.target.value,
                  })}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={currentLetterhead.company}
                  onChange={(e) => setCurrentLetterhead({
                    ...currentLetterhead,
                    company: e.target.value,
                  })}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={currentLetterhead.is_default}
                  onChange={(e) => setCurrentLetterhead({
                    ...currentLetterhead,
                    is_default: e.target.checked,
                  })}
                  className="rounded"
                />
                <label htmlFor="is_default" className="text-xs text-gray-700">
                  Set as Default
                </label>
              </div>
            </div>
          </Card>

          {/* Logo Upload */}
          <Card className="p-4 mb-4">
            <h3 className="text-sm font-medium mb-3">Company Logo</h3>
            <div className="space-y-3">
              {currentLetterhead.logo && (
                <div className="border border-gray-300 rounded p-2">
                  <img 
                    src={currentLetterhead.logo} 
                    alt="Company logo"
                    className="w-full h-16 object-contain"
                  />
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Logo
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />

              {currentLetterhead.logo && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Width
                    </label>
                    <input
                      type="number"
                      value={currentLetterhead.logo_width || 120}
                      onChange={(e) => setCurrentLetterhead({
                        ...currentLetterhead,
                        logo_width: parseInt(e.target.value) || 120,
                      })}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Height
                    </label>
                    <input
                      type="number"
                      value={currentLetterhead.logo_height || 60}
                      onChange={(e) => setCurrentLetterhead({
                        ...currentLetterhead,
                        logo_height: parseInt(e.target.value) || 60,
                      })}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Element Tools */}
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3">Add Elements</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addElement('text')}
              >
                <Type className="w-4 h-4 mr-2" />
                Text
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addElement('image')}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Image
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addElement('line')}
              >
                <div className="w-4 h-4 mr-2 border-t border-gray-600"></div>
                Line
              </Button>
            </div>
          </Card>
        </div>

        {/* Main Design Area */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Section Tabs */}
          <div className="flex space-x-1 mb-4">
            <Button
              variant={activeSection === 'header' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveSection('header')}
            >
              Header
            </Button>
            <Button
              variant={activeSection === 'footer' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveSection('footer')}
            >
              Footer
            </Button>
          </div>

          {/* Design Canvas */}
          <div className="bg-white shadow-lg mx-auto" style={{ width: 794 }}>
            <div
              className="relative border-b border-gray-300"
              style={{ height: currentHeight }}
              onClick={() => setSelectedElementId(null)}
            >
              <div className="absolute top-2 left-2 text-xs text-gray-400">
                {activeSection === 'header' ? 'Header' : 'Footer'} ({currentHeight}px)
              </div>
              
              {currentElements.map(renderElement)}
            </div>
          </div>

          {/* Height Control */}
          <div className="mt-4 flex items-center justify-center space-x-4">
            <label className="text-sm text-gray-700">
              {activeSection === 'header' ? 'Header' : 'Footer'} Height:
            </label>
            <input
              type="number"
              value={currentHeight}
              onChange={(e) => updateSectionHeight(parseInt(e.target.value) || 60)}
              className="w-20 text-sm border border-gray-300 rounded px-2 py-1"
              min="20"
              max="300"
            />
            <span className="text-sm text-gray-500">px</span>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          {selectedElement ? (
            <div>
              <h3 className="text-sm font-medium mb-3">Element Properties</h3>
              
              {/* Position & Size */}
              <Card className="p-4 mb-4">
                <h4 className="text-sm font-medium mb-3">Position & Size</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">X</label>
                    <input
                      type="number"
                      value={selectedElement.x}
                      onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) || 0 })}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Y</label>
                    <input
                      type="number"
                      value={selectedElement.y}
                      onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) || 0 })}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Width</label>
                    <input
                      type="number"
                      value={selectedElement.width}
                      onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 0 })}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
                    <input
                      type="number"
                      value={selectedElement.height}
                      onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 0 })}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                </div>
              </Card>

              {/* Content */}
              {selectedElement.type === 'text' && (
                <Card className="p-4 mb-4">
                  <h4 className="text-sm font-medium mb-3">Content</h4>
                  <textarea
                    value={selectedElement.content || ''}
                    onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 h-20 resize-none"
                    placeholder="Enter text content..."
                  />
                </Card>
              )}

              {/* Typography (for text elements) */}
              {selectedElement.type === 'text' && (
                <Card className="p-4 mb-4">
                  <h4 className="text-sm font-medium mb-3">Typography</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
                      <input
                        type="number"
                        value={selectedElement.style.fontSize || 14}
                        onChange={(e) => updateElement(selectedElement.id, {
                          style: { ...selectedElement.style, fontSize: parseInt(e.target.value) || 14 }
                        })}
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Font Family</label>
                      <select
                        value={selectedElement.style.fontFamily || 'Arial, sans-serif'}
                        onChange={(e) => updateElement(selectedElement.id, {
                          style: { ...selectedElement.style, fontFamily: e.target.value }
                        })}
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="Helvetica, sans-serif">Helvetica</option>
                        <option value="Times New Roman, serif">Times New Roman</option>
                        <option value="Georgia, serif">Georgia</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Style</label>
                      <div className="flex space-x-1">
                        <Button
                          variant={selectedElement.style.fontWeight === 'bold' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateElement(selectedElement.id, {
                            style: { 
                              ...selectedElement.style, 
                              fontWeight: selectedElement.style.fontWeight === 'bold' ? 'normal' : 'bold' 
                            }
                          })}
                          className="px-2"
                        >
                          <Bold className="w-3 h-3" />
                        </Button>
                        <Button
                          variant={selectedElement.style.fontStyle === 'italic' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateElement(selectedElement.id, {
                            style: { 
                              ...selectedElement.style, 
                              fontStyle: selectedElement.style.fontStyle === 'italic' ? 'normal' : 'italic' 
                            }
                          })}
                          className="px-2"
                        >
                          <Italic className="w-3 h-3" />
                        </Button>
                        <Button
                          variant={selectedElement.style.textDecoration === 'underline' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateElement(selectedElement.id, {
                            style: { 
                              ...selectedElement.style, 
                              textDecoration: selectedElement.style.textDecoration === 'underline' ? 'none' : 'underline' 
                            }
                          })}
                          className="px-2"
                        >
                          <Underline className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Alignment</label>
                      <div className="flex space-x-1">
                        <Button
                          variant={selectedElement.style.textAlign === 'left' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateElement(selectedElement.id, {
                            style: { ...selectedElement.style, textAlign: 'left' }
                          })}
                          className="px-2"
                        >
                          <AlignLeft className="w-3 h-3" />
                        </Button>
                        <Button
                          variant={selectedElement.style.textAlign === 'center' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateElement(selectedElement.id, {
                            style: { ...selectedElement.style, textAlign: 'center' }
                          })}
                          className="px-2"
                        >
                          <AlignCenter className="w-3 h-3" />
                        </Button>
                        <Button
                          variant={selectedElement.style.textAlign === 'right' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateElement(selectedElement.id, {
                            style: { ...selectedElement.style, textAlign: 'right' }
                          })}
                          className="px-2"
                        >
                          <AlignRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                      <input
                        type="color"
                        value={selectedElement.style.color || '#000000'}
                        onChange={(e) => updateElement(selectedElement.id, {
                          style: { ...selectedElement.style, color: e.target.value }
                        })}
                        className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </Card>
              )}

              {/* Image Upload (for image elements) */}
              {selectedElement.type === 'image' && (
                <Card className="p-4 mb-4">
                  <h4 className="text-sm font-medium mb-3">Image</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            updateElement(selectedElement.id, {
                              src: event.target?.result as string
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-8">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Select an element to edit its properties</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LetterheadDesigner;