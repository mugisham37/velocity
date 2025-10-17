'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Printer, 
  Download, 
  Mail, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Settings,
  X,
  Maximize,
  Minimize,
  Loader2
} from 'lucide-react';
import { PrintFormat, PrintElement } from './PrintFormatDesigner';
import { PDFGenerator } from '@/lib/pdf';

interface PrintPreviewProps {
  format: PrintFormat;
  documentData: Record<string, any>;
  letterheadData?: {
    header_html?: string;
    footer_html?: string;
    logo?: string;
  };
  onClose: () => void;
  onPrint: () => void;
  onDownload: (format: 'PDF' | 'HTML') => void;
  onEmail: () => void;
}

export const PrintPreview: React.FC<PrintPreviewProps> = ({
  format,
  documentData,
  letterheadData,
  onClose,
  onPrint,
  onDownload,
  onEmail,
}) => {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

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

  // Render element content with actual data
  const renderElementContent = (element: PrintElement) => {
    // Check conditions
    if (element.conditions && element.conditions.length > 0) {
      const conditionsMet = element.conditions.every(condition => {
        const fieldValue = documentData[condition.field];
        const conditionValue = condition.value;
        
        switch (condition.operator) {
          case 'equals':
            return fieldValue === conditionValue;
          case 'not_equals':
            return fieldValue !== conditionValue;
          case 'contains':
            return String(fieldValue).includes(conditionValue);
          case 'not_contains':
            return !String(fieldValue).includes(conditionValue);
          default:
            return true;
        }
      });
      
      if (!conditionsMet) {
        return null;
      }
    }

    switch (element.type) {
      case 'text':
        return element.content || '';
        
      case 'field':
        if (!element.fieldname) return '';
        const fieldValue = documentData[element.fieldname];
        
        // Format field value based on type
        if (fieldValue === null || fieldValue === undefined) return '';
        if (typeof fieldValue === 'number') {
          // Format numbers with appropriate decimal places
          return fieldValue.toLocaleString();
        }
        if (fieldValue instanceof Date) {
          return fieldValue.toLocaleDateString();
        }
        return String(fieldValue);
        
      case 'image':
        if (element.fieldname && documentData[element.fieldname]) {
          return (
            <img 
              src={documentData[element.fieldname]} 
              alt="Document Image"
              className="w-full h-full object-contain"
            />
          );
        }
        return (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
            No Image
          </div>
        );
        
      case 'table':
        // TODO: Implement table rendering for child tables
        return (
          <div className="w-full h-full border border-gray-300">
            <div className="text-xs text-gray-600 p-2">Table Data</div>
          </div>
        );
        
      case 'line':
        return null; // Lines are rendered as borders
        
      default:
        return element.content || '';
    }
  };

  // Render print element
  const renderElement = (element: PrintElement) => {
    const content = renderElementContent(element);
    
    if (content === null) return null;

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
      textAlign: element.style.textAlign,
      color: element.style.color,
      backgroundColor: element.style.backgroundColor,
      padding: `${element.style.padding.top}px ${element.style.padding.right}px ${element.style.padding.bottom}px ${element.style.padding.left}px`,
      overflow: 'hidden',
      wordWrap: 'break-word',
    };

    // Add border if specified
    if (element.style.border && element.style.border.width > 0) {
      elementStyle.border = `${element.style.border.width}px ${element.style.border.style} ${element.style.border.color}`;
    }

    // Special handling for line elements
    if (element.type === 'line') {
      elementStyle.borderTop = `${element.height}px solid ${element.style.color}`;
      elementStyle.height = 0;
    }

    return (
      <div key={element.id} style={elementStyle}>
        {element.type !== 'line' && content}
      </div>
    );
  };

  const handleZoomIn = () => setZoom(Math.min(zoom + 25, 200));
  const handleZoomOut = () => setZoom(Math.max(zoom - 25, 25));
  const handleResetZoom = () => setZoom(100);

  // Handle PDF generation and download
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const pdfGenerator = new PDFGenerator({
        format,
        documentData,
        letterheadData,
        filename: `${documentData.name || 'document'}.pdf`,
        quality: 2,
      });

      await pdfGenerator.generatePDF({ download: true });
      onDownload('PDF');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      // TODO: Show error notification
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Handle HTML download
  const handleDownloadHTML = async () => {
    try {
      // Generate HTML content
      const htmlContent = generateHTMLContent();
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentData.name || 'document'}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      onDownload('HTML');
    } catch (error) {
      console.error('Failed to generate HTML:', error);
    }
  };

  // Generate HTML content for download
  const generateHTMLContent = (): string => {
    const { width, height } = getCanvasDimensions();
    
    let elementsHTML = '';
    format.elements.forEach(element => {
      const content = renderElementContentAsString(element);
      if (content !== null) {
        const elementStyle = `
          position: absolute;
          left: ${element.x}px;
          top: ${element.y}px;
          width: ${element.width}px;
          height: ${element.height}px;
          font-size: ${element.style.fontSize}px;
          font-family: ${element.style.fontFamily || 'Arial, sans-serif'};
          font-weight: ${element.style.fontWeight || 'normal'};
          font-style: ${element.style.fontStyle || 'normal'};
          text-align: ${element.style.textAlign || 'left'};
          color: ${element.style.color || '#000000'};
          background-color: ${element.style.backgroundColor || 'transparent'};
          padding: ${element.style.padding.top}px ${element.style.padding.right}px ${element.style.padding.bottom}px ${element.style.padding.left}px;
          overflow: hidden;
          word-wrap: break-word;
          box-sizing: border-box;
          ${element.style.border && element.style.border.width > 0 ? 
            `border: ${element.style.border.width}px ${element.style.border.style} ${element.style.border.color};` : ''}
          ${element.type === 'line' ? 
            `border-top: ${element.height}px solid ${element.style.color}; height: 0px;` : ''}
        `;
        
        if (element.type === 'image' && typeof content === 'string') {
          elementsHTML += `<div style="${elementStyle}"><img src="${content}" style="width: 100%; height: 100%; object-fit: contain;" /></div>`;
        } else if (element.type !== 'line') {
          elementsHTML += `<div style="${elementStyle}">${content}</div>`;
        } else {
          elementsHTML += `<div style="${elementStyle}"></div>`;
        }
      }
    });

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${documentData.name || 'Document'}</title>
    <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
        .document { 
            width: ${width}px; 
            height: ${height}px; 
            position: relative; 
            background: white; 
            margin: 0 auto;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        @media print {
            body { padding: 0; }
            .document { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="document">
        ${letterheadData?.header_html ? 
          `<div style="position: absolute; top: ${format.margins.top}px; left: ${format.margins.left}px; right: ${format.margins.right}px;">${letterheadData.header_html}</div>` : ''}
        ${elementsHTML}
        ${letterheadData?.footer_html ? 
          `<div style="position: absolute; bottom: ${format.margins.bottom}px; left: ${format.margins.left}px; right: ${format.margins.right}px;">${letterheadData.footer_html}</div>` : ''}
    </div>
</body>
</html>`;
  };

  // Render element content as string for HTML generation
  const renderElementContentAsString = (element: PrintElement): string | null => {
    // Check conditions
    if (element.conditions && element.conditions.length > 0) {
      const conditionsMet = element.conditions.every(condition => {
        const fieldValue = documentData[condition.field];
        const conditionValue = condition.value;
        
        switch (condition.operator) {
          case 'equals':
            return fieldValue === conditionValue;
          case 'not_equals':
            return fieldValue !== conditionValue;
          case 'contains':
            return String(fieldValue).includes(conditionValue);
          case 'not_contains':
            return !String(fieldValue).includes(conditionValue);
          default:
            return true;
        }
      });
      
      if (!conditionsMet) {
        return null;
      }
    }

    switch (element.type) {
      case 'text':
        return element.content || '';
        
      case 'field':
        if (!element.fieldname) return '';
        const fieldValue = documentData[element.fieldname];
        
        if (fieldValue === null || fieldValue === undefined) return '';
        if (typeof fieldValue === 'number') {
          return fieldValue.toLocaleString();
        }
        if (fieldValue instanceof Date) {
          return fieldValue.toLocaleDateString();
        }
        return String(fieldValue);
        
      case 'image':
        if (element.fieldname && documentData[element.fieldname]) {
          return documentData[element.fieldname];
        }
        return null;
        
      case 'table':
        return 'Table Data';
        
      case 'line':
        return null;
        
      default:
        return element.content || '';
    }
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'relative'} bg-white`}>
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium">Print Preview</h3>
          <span className="text-sm text-gray-600">
            {format.name} - {format.page_size} {format.orientation}
          </span>
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
          <Button variant="outline" size="sm" onClick={onPrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>

          <div className="flex items-center space-x-1">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              PDF
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleDownloadHTML}>
              <Download className="w-4 h-4 mr-2" />
              HTML
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={onEmail}>
            <Mail className="w-4 h-4 mr-2" />
            Email
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
      <div className="flex-1 bg-gray-100 p-8 overflow-auto" style={{ height: isFullscreen ? 'calc(100vh - 73px)' : '600px' }}>
        <div className="flex justify-center">
          <div
            ref={previewRef}
            className="bg-white shadow-lg relative"
            style={{
              width: (canvasDimensions.width * zoom) / 100,
              height: (canvasDimensions.height * zoom) / 100,
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
            }}
          >
            {/* Letterhead Header */}
            {letterheadData?.header_html && (
              <div 
                className="absolute top-0 left-0 right-0"
                style={{ 
                  marginTop: format.margins.top,
                  marginLeft: format.margins.left,
                  marginRight: format.margins.right,
                }}
                dangerouslySetInnerHTML={{ __html: letterheadData.header_html }}
              />
            )}

            {/* Print Elements */}
            <div className="relative w-full h-full">
              {format.elements.map(renderElement)}
            </div>

            {/* Letterhead Footer */}
            {letterheadData?.footer_html && (
              <div 
                className="absolute bottom-0 left-0 right-0"
                style={{ 
                  marginBottom: format.margins.bottom,
                  marginLeft: format.margins.left,
                  marginRight: format.margins.right,
                }}
                dangerouslySetInnerHTML={{ __html: letterheadData.footer_html }}
              />
            )}

            {/* Page Margins (for reference) */}
            <div
              className="absolute border border-dashed border-gray-300 pointer-events-none opacity-30"
              style={{
                top: format.margins.top,
                left: format.margins.left,
                right: format.margins.right,
                bottom: format.margins.bottom,
              }}
            />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex items-center justify-between text-sm text-gray-600">
        <div>
          Document: {documentData.name || 'Preview'}
        </div>
        <div>
          Page 1 of 1 • {format.elements.length} elements
        </div>
      </div>
    </div>
  );
};

export default PrintPreview;