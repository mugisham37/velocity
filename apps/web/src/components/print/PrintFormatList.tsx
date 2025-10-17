'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Plus, 
  Edit, 
  Copy, 
  Trash2, 
  Eye, 
  Download,
  Settings,
  FileText,
  Search,
  Printer
} from 'lucide-react';
import { PrintFormat } from './PrintFormatDesigner';

interface PrintFormatListProps {
  doctype: string;
  formats: PrintFormat[];
  onEdit: (format: PrintFormat) => void;
  onCreate: () => void;
  onCopy: (format: PrintFormat) => void;
  onDelete: (formatName: string) => void;
  onPreview: (format: PrintFormat) => void;
  onSetDefault: (formatName: string) => void;
  onManageLetterheads?: () => void;
  onBatchPrint?: () => void;
}

export const PrintFormatList: React.FC<PrintFormatListProps> = ({
  doctype,
  formats,
  onEdit,
  onCreate,
  onCopy,
  onDelete,
  onPreview,
  onSetDefault,
  onManageLetterheads,
  onBatchPrint,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);

  const filteredFormats = formats.filter(format =>
    format.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    format.doctype.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const standardFormats = filteredFormats.filter(f => f.is_standard);
  const customFormats = filteredFormats.filter(f => !f.is_standard);

  const FormatCard: React.FC<{ format: PrintFormat; isDefault?: boolean }> = ({ 
    format, 
    isDefault = false 
  }) => (
    <Card 
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        selectedFormat === format.name ? 'ring-2 ring-blue-500' : ''
      } ${isDefault ? 'border-green-500 bg-green-50' : ''}`}
      onClick={() => setSelectedFormat(format.name)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <h3 className="font-medium text-sm">{format.name}</h3>
            {isDefault && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Default
              </span>
            )}
            {format.is_standard && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Standard
              </span>
            )}
          </div>
          
          <div className="mt-2 text-xs text-gray-600 space-y-1">
            <div>DocType: {format.doctype}</div>
            <div>Page: {format.page_size} ({format.orientation})</div>
            <div>Elements: {format.elements.length}</div>
            {format.letterhead && (
              <div>Letterhead: {format.letterhead}</div>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-1">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(format);
            }}
            className="px-2"
          >
            <Eye className="w-3 h-3" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(format);
            }}
            className="px-2"
          >
            <Edit className="w-3 h-3" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onCopy(format);
            }}
            className="px-2"
          >
            <Copy className="w-3 h-3" />
          </Button>
          
          {!format.is_standard && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete "${format.name}"?`)) {
                  onDelete(format.name);
                }
              }}
              className="px-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {selectedFormat === format.name && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            {!isDefault && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetDefault(format.name);
                }}
              >
                Set as Default
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement download functionality
                console.log('Download format:', format.name);
              }}
            >
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
          </div>
        </div>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Print Formats</h2>
          <p className="text-sm text-gray-600">
            Manage print formats for {doctype}
          </p>
        </div>
        
        <div className="flex space-x-2">
          {onBatchPrint && (
            <Button variant="outline" onClick={onBatchPrint}>
              <Printer className="w-4 h-4 mr-2" />
              Batch Print
            </Button>
          )}
          {onManageLetterheads && (
            <Button variant="outline" onClick={onManageLetterheads}>
              <Settings className="w-4 h-4 mr-2" />
              Letterheads
            </Button>
          )}
          <Button onClick={onCreate}>
            <Plus className="w-4 h-4 mr-2" />
            New Print Format
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search print formats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Standard Formats */}
      {standardFormats.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Standard Formats
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {standardFormats.map((format) => (
              <FormatCard 
                key={format.name} 
                format={format}
                isDefault={format.name === 'Standard'} // TODO: Get actual default from API
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom Formats */}
      {customFormats.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Custom Formats
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customFormats.map((format) => (
              <FormatCard 
                key={format.name} 
                format={format}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredFormats.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No formats found' : 'No print formats'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? `No print formats match "${searchTerm}"`
              : `Create your first print format for ${doctype}`
            }
          </p>
          {!searchTerm && (
            <Button onClick={onCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Create Print Format
            </Button>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h4>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            Import Format
          </Button>
          <Button variant="outline" size="sm">
            Export All
          </Button>
          <Button variant="outline" size="sm">
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrintFormatList;