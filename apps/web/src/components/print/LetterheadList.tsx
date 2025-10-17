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
  Star,
  StarOff,
  Search,
  Building,
  FileText,
  Image as ImageIcon,
  Settings
} from 'lucide-react';
import { Letterhead } from './LetterheadDesigner';

interface LetterheadListProps {
  letterheads: Letterhead[];
  onEdit: (letterhead: Letterhead) => void;
  onCreate: () => void;
  onCopy: (letterhead: Letterhead) => void;
  onDelete: (letterheadName: string) => void;
  onPreview: (letterhead: Letterhead) => void;
  onSetDefault: (letterheadName: string) => void;
  onToggleStatus: (letterheadName: string, disabled: boolean) => void;
}

export const LetterheadList: React.FC<LetterheadListProps> = ({
  letterheads,
  onEdit,
  onCreate,
  onCopy,
  onDelete,
  onPreview,
  onSetDefault,
  onToggleStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedLetterhead, setSelectedLetterhead] = useState<string | null>(null);

  const companies = Array.from(new Set(letterheads.map(l => l.company).filter(Boolean)));
  
  const filteredLetterheads = letterheads.filter(letterhead => {
    const matchesSearch = letterhead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         letterhead.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = !selectedCompany || letterhead.company === selectedCompany;
    return matchesSearch && matchesCompany;
  });

  const LetterheadCard: React.FC<{ letterhead: Letterhead }> = ({ letterhead }) => (
    <Card 
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        selectedLetterhead === letterhead.name ? 'ring-2 ring-blue-500' : ''
      } ${letterhead.is_default ? 'border-green-500 bg-green-50' : ''} ${
        letterhead.disabled ? 'opacity-60 bg-gray-50' : ''
      }`}
      onClick={() => setSelectedLetterhead(letterhead.name)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <h3 className="font-medium text-sm">{letterhead.name}</h3>
            
            {letterhead.is_default && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                <Star className="w-3 h-3 mr-1" />
                Default
              </span>
            )}
            
            {letterhead.disabled && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                Disabled
              </span>
            )}
          </div>
          
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex items-center">
              <Building className="w-3 h-3 mr-1" />
              {letterhead.company || 'No Company'}
            </div>
            
            <div className="flex items-center space-x-4">
              <span>Header: {letterhead.header_elements.length} elements</span>
              <span>Footer: {letterhead.footer_elements.length} elements</span>
            </div>
            
            {letterhead.logo && (
              <div className="flex items-center">
                <ImageIcon className="w-3 h-3 mr-1" />
                Logo included
              </div>
            )}
          </div>

          {/* Logo Preview */}
          {letterhead.logo && (
            <div className="mt-2 p-2 bg-white border border-gray-200 rounded">
              <img 
                src={letterhead.logo} 
                alt="Company logo"
                className="h-8 object-contain"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-1 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(letterhead);
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
              onEdit(letterhead);
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
              onCopy(letterhead);
            }}
            className="px-2"
          >
            <Copy className="w-3 h-3" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (letterhead.is_default) {
                return; // Can't delete default letterhead
              }
              if (confirm(`Are you sure you want to delete "${letterhead.name}"?`)) {
                onDelete(letterhead.name);
              }
            }}
            className="px-2 text-red-600 hover:text-red-700"
            disabled={letterhead.is_default}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {selectedLetterhead === letterhead.name && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {!letterhead.is_default && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetDefault(letterhead.name);
                }}
              >
                <Star className="w-3 h-3 mr-1" />
                Set as Default
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus(letterhead.name, !letterhead.disabled);
              }}
            >
              {letterhead.disabled ? (
                <>
                  <StarOff className="w-3 h-3 mr-1" />
                  Enable
                </>
              ) : (
                <>
                  <StarOff className="w-3 h-3 mr-1" />
                  Disable
                </>
              )}
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
          <h2 className="text-lg font-semibold">Letterheads</h2>
          <p className="text-sm text-gray-600">
            Manage company letterheads and branding
          </p>
        </div>
        
        <Button onClick={onCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Letterhead
        </Button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search letterheads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Company Filter */}
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Companies</option>
          {companies.map((company) => (
            <option key={company} value={company}>
              {company}
            </option>
          ))}
        </select>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <div className="text-2xl font-bold">{letterheads.length}</div>
              <div className="text-sm text-gray-600">Total Letterheads</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <Star className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <div className="text-2xl font-bold">
                {letterheads.filter(l => l.is_default).length}
              </div>
              <div className="text-sm text-gray-600">Default</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <Building className="w-8 h-8 text-purple-500 mr-3" />
            <div>
              <div className="text-2xl font-bold">{companies.length}</div>
              <div className="text-sm text-gray-600">Companies</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <ImageIcon className="w-8 h-8 text-orange-500 mr-3" />
            <div>
              <div className="text-2xl font-bold">
                {letterheads.filter(l => l.logo).length}
              </div>
              <div className="text-sm text-gray-600">With Logo</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Letterheads Grid */}
      {filteredLetterheads.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLetterheads.map((letterhead) => (
            <LetterheadCard key={letterhead.name} letterhead={letterhead} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || selectedCompany ? 'No letterheads found' : 'No letterheads'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCompany 
              ? 'No letterheads match your current filters'
              : 'Create your first letterhead to get started'
            }
          </p>
          {!searchTerm && !selectedCompany && (
            <Button onClick={onCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Create Letterhead
            </Button>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
          <Settings className="w-4 h-4 mr-2" />
          Quick Actions
        </h4>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            Import Letterhead
          </Button>
          <Button variant="outline" size="sm">
            Export All
          </Button>
          <Button variant="outline" size="sm">
            Bulk Edit
          </Button>
          <Button variant="outline" size="sm">
            Company Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LetterheadList;