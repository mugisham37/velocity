'use client';

import React, { useState, useEffect } from 'react';
import { PrintFormatDesigner, PrintFormat } from './PrintFormatDesigner';
import { PrintFormatList } from './PrintFormatList';
import { PrintPreview } from './PrintPreview';
import { LetterheadManager } from './LetterheadManager';
import { BatchPrintManager } from './BatchPrintManager';
import { EmailIntegration } from './EmailIntegration';
import { useNotifications } from '@/hooks/useNotifications';

interface PrintManagerProps {
  doctype: string;
  documentData?: Record<string, unknown>;
  mode?: 'list' | 'designer' | 'preview' | 'letterheads' | 'batch' | 'email';
  initialFormat?: PrintFormat;
  onClose?: () => void;
}

interface DocTypeField {
  fieldname: string;
  label: string;
  fieldtype: string;
}

export const PrintManager: React.FC<PrintManagerProps> = ({
  doctype,
  documentData,
  mode: initialMode = 'list',
  initialFormat,
  onClose,
}) => {
  const [mode, setMode] = useState<'list' | 'designer' | 'preview' | 'letterheads' | 'batch' | 'email'>(initialMode);
  const [formats, setFormats] = useState<PrintFormat[]>([]);
  const [currentFormat, setCurrentFormat] = useState<PrintFormat | undefined>(initialFormat);
  const [availableFields, setAvailableFields] = useState<DocTypeField[]>([]);
  const [availableLetterheads, setAvailableLetterheads] = useState<{ name: string; company: string }[]>([]);
  const [letterheadData] = useState<{ header_html?: string; footer_html?: string; logo?: string } | undefined>(undefined);

  const { showSuccess, showError } = useNotifications();

  // Load print formats for the doctype
  useEffect(() => {
    const loadData = async () => {
      await loadPrintFormats();
      await loadDocTypeFields();
      await loadLetterheads();
    };
    loadData();
  }, [doctype]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPrintFormats = async () => {
    try {
      
      // TODO: Replace with actual API call
      const mockFormats: PrintFormat[] = [
        {
          name: 'Standard',
          doctype,
          is_standard: true,
          page_size: 'A4',
          orientation: 'Portrait',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
          elements: [
            {
              id: 'title',
              type: 'text',
              x: 50,
              y: 50,
              width: 400,
              height: 30,
              content: doctype,
              style: {
                fontSize: 18,
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                fontStyle: 'normal',
                textAlign: 'center',
                color: '#000000',
                padding: { top: 5, right: 10, bottom: 5, left: 10 },
              },
            },
            {
              id: 'name_field',
              type: 'field',
              x: 50,
              y: 100,
              width: 200,
              height: 25,
              fieldname: 'name',
              style: {
                fontSize: 12,
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'normal',
                fontStyle: 'normal',
                textAlign: 'left',
                color: '#000000',
                padding: { top: 2, right: 4, bottom: 2, left: 4 },
              },
            },
          ],
        },
      ];

      setFormats(mockFormats);
    } catch (error) {
      console.error('Failed to load print formats:', error);
      showError('Failed to load print formats');
    }
  };

  const loadDocTypeFields = async () => {
    try {
      // TODO: Replace with actual API call to get DocType meta
      const mockFields: DocTypeField[] = [
        { fieldname: 'name', label: 'ID', fieldtype: 'Data' },
        { fieldname: 'title', label: 'Title', fieldtype: 'Data' },
        { fieldname: 'status', label: 'Status', fieldtype: 'Select' },
        { fieldname: 'creation', label: 'Created On', fieldtype: 'Datetime' },
        { fieldname: 'modified', label: 'Last Modified', fieldtype: 'Datetime' },
        { fieldname: 'owner', label: 'Created By', fieldtype: 'Link' },
      ];

      setAvailableFields(mockFields);
    } catch (error) {
      console.error('Failed to load DocType fields:', error);
    }
  };

  const loadLetterheads = async () => {
    try {
      // TODO: Replace with actual API call
      const mockLetterheads = [
        { name: 'Standard Company Letterhead', company: 'ABC Corporation' },
        { name: 'Invoice Letterhead', company: 'ABC Corporation' },
        { name: 'Official Letterhead', company: 'XYZ Ltd' },
      ];

      setAvailableLetterheads(mockLetterheads);
    } catch (error) {
      console.error('Failed to load letterheads:', error);
    }
  };

  const handleCreateFormat = () => {
    setCurrentFormat(undefined);
    setMode('designer');
  };

  const handleEditFormat = (format: PrintFormat) => {
    setCurrentFormat(format);
    setMode('designer');
  };

  const handleCopyFormat = (format: PrintFormat) => {
    const copiedFormat: PrintFormat = {
      ...format,
      name: `${format.name} Copy`,
      is_standard: false,
    };
    setCurrentFormat(copiedFormat);
    setMode('designer');
  };

  const handleDeleteFormat = async (formatName: string) => {
    try {
      // TODO: Replace with actual API call
      setFormats(formats.filter(f => f.name !== formatName));
      showSuccess(`Print format "${formatName}" deleted successfully`);
    } catch (error) {
      console.error('Failed to delete print format:', error);
      showError('Failed to delete print format');
    }
  };

  const handlePreviewFormat = (format: PrintFormat) => {
    setCurrentFormat(format);
    setMode('preview');
  };

  const handleSetDefault = async (formatName: string) => {
    try {
      // TODO: Replace with actual API call
      showSuccess(`"${formatName}" set as default print format`);
    } catch (error) {
      console.error('Failed to set default format:', error);
      showError('Failed to set default format');
    }
  };

  const handleSaveFormat = async (format: PrintFormat) => {
    try {
      
      // TODO: Replace with actual API call
      const existingIndex = formats.findIndex(f => f.name === format.name);
      if (existingIndex >= 0) {
        const updatedFormats = [...formats];
        updatedFormats[existingIndex] = format;
        setFormats(updatedFormats);
      } else {
        setFormats([...formats, format]);
      }

      showSuccess(`Print format "${format.name}" saved successfully`);
      setMode('list');
    } catch (error) {
      console.error('Failed to save print format:', error);
      showError('Failed to save print format');
    }
  };

  const handlePrint = async () => {
    try {
      // TODO: Implement actual printing
      window.print();
      showSuccess('Print job sent to printer');
    } catch (error) {
      console.error('Failed to print:', error);
      showError('Failed to print document');
    }
  };

  const handleDownload = async (format: 'PDF' | 'HTML') => {
    try {
      // TODO: Implement PDF/HTML generation and download
      showSuccess(`Document downloaded as ${format}`);
    } catch (error) {
      console.error('Failed to download:', error);
      showError('Failed to download document');
    }
  };

  const handleEmail = async () => {
    if (currentFormat) {
      setMode('email');
    }
  };

  const handleBatchPrint = () => {
    setMode('batch');
  };

  const handleBack = () => {
    if (mode === 'designer' || mode === 'preview' || mode === 'letterheads' || mode === 'batch' || mode === 'email') {
      setMode('list');
      setCurrentFormat(undefined);
    } else if (onClose) {
      onClose();
    }
  };

  // Render based on current mode
  switch (mode) {
    case 'designer':
      return (
        <PrintFormatDesigner
          printFormat={currentFormat}
          doctype={doctype}
          onSave={handleSaveFormat}
          onCancel={handleBack}
          availableFields={availableFields}
          availableLetterheads={availableLetterheads}
        />
      );

    case 'letterheads':
      return (
        <LetterheadManager
          mode="list"
          onClose={handleBack}
        />
      );

    case 'batch':
      return (
        <BatchPrintManager
          onClose={handleBack}
        />
      );

    case 'email':
      if (!currentFormat || !documentData) {
        return (
          <div className="p-8 text-center">
            <p className="text-gray-600">No format or document data available for email</p>
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
        <EmailIntegration
          format={currentFormat}
          documentData={documentData}
          letterheadData={letterheadData}
          onClose={handleBack}
          onSent={() => {
            showSuccess('Email sent successfully');
            handleBack();
          }}
        />
      );

    case 'preview':
      if (!currentFormat || !documentData) {
        return (
          <div className="p-8 text-center">
            <p className="text-gray-600">No format or document data available for preview</p>
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
        <PrintPreview
          format={currentFormat}
          documentData={documentData}
          letterheadData={letterheadData}
          onClose={handleBack}
          onPrint={handlePrint}
          onDownload={handleDownload}
          onEmail={handleEmail}
        />
      );

    case 'list':
    default:
      return (
        <div className="p-6">
          <PrintFormatList
            doctype={doctype}
            formats={formats}
            onEdit={handleEditFormat}
            onCreate={handleCreateFormat}
            onCopy={handleCopyFormat}
            onDelete={handleDeleteFormat}
            onPreview={handlePreviewFormat}
            onSetDefault={handleSetDefault}
            onManageLetterheads={() => setMode('letterheads')}
            onBatchPrint={handleBatchPrint}
          />
        </div>
      );
  }
};

export default PrintManager;