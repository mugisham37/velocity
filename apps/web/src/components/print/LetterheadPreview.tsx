'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Printer,
  Maximize,
  Minimize
} from 'lucide-react';
import { Letterhead, LetterheadElement } from './LetterheadDesigner';

interface LetterheadPreviewProps {
  letterhead: Letterhead;
  sampleDocument?: {
    title: string;
    content: string;
    date: string;
  };
  onClose: () => void;
  onEdit: () => void;
}

export const LetterheadPreview: React.FC<LetterheadPreviewProps> = ({
  letterhead,
  sampleDocument = {
    title: 'Sample Document',
    content: 'This is a sample document to demonstrate how the letterhead will appear on actual documents. The letterhead includes header and footer elements that will be consistent across all printed materials.',
    date: new Date().toLocaleDateString(),
  },
  onClose,
  onEdit,
}) => {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = () => setZoom(Math.min(zoom + 25, 200));
  const handleZoomOut = () => setZoom(Math.max(zoom - 25, 25));
  const handleResetZoom = () => setZoom(100);

  // Render letterhead element
  const renderElement = (element: LetterheadElement) => {
    const elementStyle: React.CSSProperties = {
      position: 'absolute',
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      fontSize: element.style.fontSize,
      fontFamily: element.style.fontFamily,
      fontWeight: element.style.fontWeight,
      fontStyle: element.style.fontStyle,
      textDecoration: element.style.textDecoration,
      textAlign: element.style.textAlign,
      color: element.style.color,
      backgroundColor: element.style.backgroundColor,
      overflow: 'hidden',
    };

    return (
      <div key={element.id} style={elementStyle}>
        {element.type === 'text' && (
          <div className="w-full h-full">
            {element.content}
          </div>
        )}

        {element.type === 'image' && element.src && (
          <img 
            src={element.src} 
            alt="Letterhead element"
            className="w-full h-full object-contain"
          />
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
      </div>
    );
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'relative'} bg-white`}>
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium">Letterhead Preview</h3>
          <span className="text-sm text-gray-600">
            {letterhead.name} - {letterhead.company}
          </span>
          {letterhead.is_default && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Default
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 border border-gray-300 rounded">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 25}
              className="px-2"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="px-2 text-sm font-medium min-w-[60px] text-center">
              {zoom}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="px-2"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetZoom}
              className="px-2"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          <div className="w-px h-6 bg-gray-300" />

          {/* Action Buttons */}
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>

          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>

          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          <div className="w-px h-6 bg-gray-300" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>

          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div 
        className="flex-1 bg-gray-100 p-8 overflow-auto" 
        style={{ height: isFullscreen ? 'calc(100vh - 73px)' : '600px' }}
      >
        <div className="flex justify-center">
          <div
            className="bg-white shadow-lg relative"
            style={{
              width: (794 * zoom) / 100, // A4 width at 96 DPI
              minHeight: (1123 * zoom) / 100, // A4 height at 96 DPI
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Header Section */}
            <div
              className="relative border-b border-gray-200"
              style={{ height: letterhead.header_height }}
            >
              {/* Company Logo */}
              {letterhead.logo && (
                <div 
                  className="absolute top-2 left-4"
                  style={{
                    width: letterhead.logo_width || 120,
                    height: letterhead.logo_height || 60,
                  }}
                >
                  <img 
                    src={letterhead.logo} 
                    alt="Company logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Header Elements */}
              {letterhead.header_elements.map(renderElement)}
            </div>

            {/* Document Content Area */}
            <div className="p-8 min-h-[600px]">
              <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">{sampleDocument.title}</h1>
                <p className="text-sm text-gray-600">Date: {sampleDocument.date}</p>
              </div>

              <div className="prose max-w-none">
                <p className="mb-4">Dear Valued Customer,</p>
                
                <p className="mb-4">{sampleDocument.content}</p>
                
                <p className="mb-4">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod 
                  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim 
                  veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea 
                  commodo consequat.
                </p>

                <p className="mb-4">
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum 
                  dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non 
                  proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </p>

                <p className="mb-8">
                  Thank you for your continued business and support.
                </p>

                <div className="mt-12">
                  <p className="mb-2">Sincerely,</p>
                  <p className="font-semibold">{letterhead.company}</p>
                </div>
              </div>
            </div>

            {/* Footer Section */}
            <div
              className="relative border-t border-gray-200 mt-auto"
              style={{ 
                height: letterhead.footer_height,
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
              }}
            >
              {/* Footer Elements */}
              {letterhead.footer_elements.map(renderElement)}
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>Letterhead: {letterhead.name}</span>
          <span>Company: {letterhead.company}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Header: {letterhead.header_elements.length} elements</span>
          <span>Footer: {letterhead.footer_elements.length} elements</span>
          <span>Zoom: {zoom}%</span>
        </div>
      </div>
    </div>
  );
};

export default LetterheadPreview;