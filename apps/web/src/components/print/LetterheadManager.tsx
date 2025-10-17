'use client';

import React, { useState, useEffect } from 'react';
import { LetterheadDesigner, Letterhead } from './LetterheadDesigner';
import { LetterheadList } from './LetterheadList';
import { LetterheadPreview } from './LetterheadPreview';
import { useNotifications } from '@/hooks/useNotifications';

interface LetterheadManagerProps {
  mode?: 'list' | 'designer' | 'preview';
  initialLetterhead?: Letterhead;
  onClose?: () => void;
}

export const LetterheadManager: React.FC<LetterheadManagerProps> = ({
  mode: initialMode = 'list',
  initialLetterhead,
  onClose,
}) => {
  const [mode, setMode] = useState<'list' | 'designer' | 'preview'>(initialMode);
  const [letterheads, setLetterheads] = useState<Letterhead[]>([]);
  const [currentLetterhead, setCurrentLetterhead] = useState<Letterhead | undefined>(initialLetterhead);

  const { showSuccess, showError } = useNotifications();

  // Load letterheads
  useEffect(() => {
    loadLetterheads();
  }, []);

  const loadLetterheads = async () => {
    try {
      // TODO: Replace with actual API call
      const mockLetterheads: Letterhead[] = [
        {
          name: 'Standard Company Letterhead',
          company: 'ABC Corporation',
          is_default: true,
          disabled: false,
          header_elements: [
            {
              id: 'company_name',
              type: 'text',
              content: 'ABC Corporation',
              x: 50,
              y: 20,
              width: 300,
              height: 30,
              style: {
                fontSize: 24,
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                textAlign: 'left',
                color: '#2563eb',
              },
            },
            {
              id: 'address',
              type: 'text',
              content: '123 Business Street, City, State 12345\nPhone: (555) 123-4567 | Email: info@abc.com',
              x: 50,
              y: 55,
              width: 400,
              height: 35,
              style: {
                fontSize: 12,
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'normal',
                textAlign: 'left',
                color: '#374151',
              },
            },
          ],
          footer_elements: [
            {
              id: 'footer_line',
              type: 'line',
              x: 50,
              y: 10,
              width: 694,
              height: 1,
              style: {
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: '#d1d5db',
              },
            },
            {
              id: 'footer_text',
              type: 'text',
              content: 'ABC Corporation - Confidential and Proprietary',
              x: 50,
              y: 20,
              width: 694,
              height: 20,
              style: {
                fontSize: 10,
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'normal',
                textAlign: 'center',
                color: '#6b7280',
              },
            },
          ],
          header_height: 100,
          footer_height: 50,
          logo: '/api/placeholder/120/60', // Placeholder logo
          logo_width: 120,
          logo_height: 60,
        },
      ];

      setLetterheads(mockLetterheads);
    } catch (error) {
      console.error('Failed to load letterheads:', error);
      showError('Failed to load letterheads');
    }
  };

  const handleCreateLetterhead = () => {
    setCurrentLetterhead(undefined);
    setMode('designer');
  };

  const handleEditLetterhead = (letterhead: Letterhead) => {
    setCurrentLetterhead(letterhead);
    setMode('designer');
  };

  const handleCopyLetterhead = (letterhead: Letterhead) => {
    const copiedLetterhead: Letterhead = {
      ...letterhead,
      name: `${letterhead.name} Copy`,
      is_default: false,
    };
    setCurrentLetterhead(copiedLetterhead);
    setMode('designer');
  };

  const handleDeleteLetterhead = async (letterheadName: string) => {
    try {
      // TODO: Replace with actual API call
      setLetterheads(letterheads.filter(l => l.name !== letterheadName));
      showSuccess(`Letterhead "${letterheadName}" deleted successfully`);
    } catch (error) {
      console.error('Failed to delete letterhead:', error);
      showError('Failed to delete letterhead');
    }
  };

  const handlePreviewLetterhead = (letterhead: Letterhead) => {
    setCurrentLetterhead(letterhead);
    setMode('preview');
  };

  const handleSetDefault = async (letterheadName: string) => {
    try {
      // TODO: Replace with actual API call
      const updatedLetterheads = letterheads.map(l => ({
        ...l,
        is_default: l.name === letterheadName,
      }));
      setLetterheads(updatedLetterheads);
      showSuccess(`"${letterheadName}" set as default letterhead`);
    } catch (error) {
      console.error('Failed to set default letterhead:', error);
      showError('Failed to set default letterhead');
    }
  };

  const handleToggleStatus = async (letterheadName: string, disabled: boolean) => {
    try {
      // TODO: Replace with actual API call
      const updatedLetterheads = letterheads.map(l =>
        l.name === letterheadName ? { ...l, disabled } : l
      );
      setLetterheads(updatedLetterheads);
      showSuccess(`Letterhead "${letterheadName}" ${disabled ? 'disabled' : 'enabled'}`);
    } catch (error) {
      console.error('Failed to update letterhead status:', error);
      showError('Failed to update letterhead status');
    }
  };

  const handleSaveLetterhead = async (letterhead: Letterhead) => {
    try {
      // TODO: Replace with actual API call
      const existingIndex = letterheads.findIndex(l => l.name === letterhead.name);
      if (existingIndex >= 0) {
        const updatedLetterheads = [...letterheads];
        updatedLetterheads[existingIndex] = letterhead;
        setLetterheads(updatedLetterheads);
      } else {
        setLetterheads([...letterheads, letterhead]);
      }

      showSuccess(`Letterhead "${letterhead.name}" saved successfully`);
      setMode('list');
    } catch (error) {
      console.error('Failed to save letterhead:', error);
      showError('Failed to save letterhead');
    }
  };

  const handleBack = () => {
    if (mode === 'designer' || mode === 'preview') {
      setMode('list');
      setCurrentLetterhead(undefined);
    } else if (onClose) {
      onClose();
    }
  };

  // Render based on current mode
  switch (mode) {
    case 'designer':
      return (
        <LetterheadDesigner
          letterhead={currentLetterhead}
          onSave={handleSaveLetterhead}
          onCancel={handleBack}
        />
      );

    case 'preview':
      if (!currentLetterhead) {
        return (
          <div className="p-8 text-center">
            <p className="text-gray-600">No letterhead available for preview</p>
            <button 
              onClick={handleBack}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Back to List
            </button>
          </div>
        );
      }

      return (
        <LetterheadPreview
          letterhead={currentLetterhead}
          onClose={handleBack}
          onEdit={() => {
            setMode('designer');
          }}
        />
      );

    case 'list':
    default:
      return (
        <div className="p-6">
          <LetterheadList
            letterheads={letterheads}
            onEdit={handleEditLetterhead}
            onCreate={handleCreateLetterhead}
            onCopy={handleCopyLetterhead}
            onDelete={handleDeleteLetterhead}
            onPreview={handlePreviewLetterhead}
            onSetDefault={handleSetDefault}
            onToggleStatus={handleToggleStatus}
          />
        </div>
      );
  }
};

export default LetterheadManager;