'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Mail, 
  Send, 
  Paperclip, 
  Users, 
  X,
  Plus,
  Trash2,
  Eye,
  Settings,
  Loader2
} from 'lucide-react';
import { PrintFormat } from './PrintFormatDesigner';
import { PDFGenerator } from '@/lib/pdf';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  isDefault: boolean;
}

export interface EmailRecipient {
  email: string;
  name?: string;
  type: 'to' | 'cc' | 'bcc';
}

interface EmailIntegrationProps {
  format: PrintFormat;
  documentData: Record<string, any>;
  letterheadData?: {
    header_html?: string;
    footer_html?: string;
    logo?: string;
  };
  onClose: () => void;
  onSent?: () => void;
}

export const EmailIntegration: React.FC<EmailIntegrationProps> = ({
  format,
  documentData,
  letterheadData,
  onClose,
  onSent,
}) => {
  const [recipients, setRecipients] = useState<EmailRecipient[]>([
    { email: '', type: 'to' }
  ]);
  const [subject, setSubject] = useState(`${format.doctype}: ${documentData.name || 'Document'}`);
  const [body, setBody] = useState('');
  const [attachPDF, setAttachPDF] = useState(true);
  const [attachHTML, setAttachHTML] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Mock email templates
  const [templates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Invoice Email',
      subject: 'Invoice {name} from {company}',
      body: `Dear {customer_name},

Please find attached your invoice {name} for the amount of {grand_total}.

Payment is due by {due_date}.

Thank you for your business!

Best regards,
{company}`,
      isDefault: true,
    },
    {
      id: '2',
      name: 'Purchase Order Email',
      subject: 'Purchase Order {name}',
      body: `Dear Supplier,

Please find attached our purchase order {name}.

Please confirm receipt and expected delivery date.

Best regards,
{company}`,
      isDefault: false,
    },
  ]);

  // Add recipient
  const addRecipient = () => {
    setRecipients([...recipients, { email: '', type: 'to' }]);
  };

  // Remove recipient
  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  // Update recipient
  const updateRecipient = (index: number, field: keyof EmailRecipient, value: string) => {
    const updated = [...recipients];
    updated[index] = { ...updated[index], [field]: value };
    setRecipients(updated);
  };

  // Apply email template
  const applyTemplate = (template: EmailTemplate) => {
    // Replace placeholders with actual data
    const replacePlaceholders = (text: string) => {
      return text.replace(/\{(\w+)\}/g, (match, key) => {
        return documentData[key] || match;
      });
    };

    setSubject(replacePlaceholders(template.subject));
    setBody(replacePlaceholders(template.body));
    setShowTemplates(false);
  };

  // Generate attachments
  const generateAttachments = async () => {
    const attachments: { name: string; content: Blob; type: string }[] = [];

    if (attachPDF) {
      const pdfGenerator = new PDFGenerator({
        format,
        documentData,
        letterheadData,
        quality: 2,
      });

      const pdfBlob = await pdfGenerator.generatePDF({ download: false });
      attachments.push({
        name: `${documentData.name || 'document'}.pdf`,
        content: pdfBlob,
        type: 'application/pdf',
      });
    }

    if (attachHTML) {
      // Generate HTML content (simplified version)
      const htmlContent = generateHTMLContent();
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      attachments.push({
        name: `${documentData.name || 'document'}.html`,
        content: htmlBlob,
        type: 'text/html',
      });
    }

    return attachments;
  };

  // Generate HTML content
  const generateHTMLContent = (): string => {
    // This would be similar to the HTML generation in PrintPreview
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${documentData.name || 'Document'}</title>
</head>
<body>
    <h1>${format.doctype}</h1>
    <p>Document: ${documentData.name}</p>
    <!-- Add more content based on format elements -->
</body>
</html>`;
  };

  // Send email
  const sendEmail = async () => {
    setIsSending(true);
    
    try {
      // Validate recipients
      const validRecipients = recipients.filter(r => r.email.trim() !== '');
      if (validRecipients.length === 0) {
        throw new Error('Please add at least one recipient');
      }

      // Generate attachments
      const attachments = await generateAttachments();

      // Prepare email data
      const emailData = {
        to: validRecipients.filter(r => r.type === 'to').map(r => r.email),
        cc: validRecipients.filter(r => r.type === 'cc').map(r => r.email),
        bcc: validRecipients.filter(r => r.type === 'bcc').map(r => r.email),
        subject,
        body,
        attachments: attachments.map(att => ({
          filename: att.name,
          content: att.content,
          contentType: att.type,
        })),
      };

      // TODO: Replace with actual email API call
      console.log('Sending email:', emailData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      onSent?.();
      onClose();
    } catch (error) {
      console.error('Failed to send email:', error);
      // TODO: Show error notification
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold">Send Email</h2>
            <p className="text-sm text-gray-600">
              {format.doctype}: {documentData.name || 'Document'}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowTemplates(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Templates
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Recipients */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Recipients</h3>
                <Button variant="outline" size="sm" onClick={addRecipient}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Recipient
                </Button>
              </div>
              
              <div className="space-y-3">
                {recipients.map((recipient, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <select
                      value={recipient.type}
                      onChange={(e) => updateRecipient(index, 'type', e.target.value)}
                      className="border border-gray-300 rounded px-3 py-2 text-sm w-16"
                    >
                      <option value="to">To</option>
                      <option value="cc">CC</option>
                      <option value="bcc">BCC</option>
                    </select>
                    
                    <input
                      type="email"
                      value={recipient.email}
                      onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                      placeholder="Enter email address"
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                    
                    <input
                      type="text"
                      value={recipient.name || ''}
                      onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                      placeholder="Name (optional)"
                      className="w-40 border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRecipient(index)}
                      disabled={recipients.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Subject */}
            <Card className="p-4">
              <h3 className="font-medium mb-3">Subject</h3>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter email subject"
              />
            </Card>

            {/* Message Body */}
            <Card className="p-4">
              <h3 className="font-medium mb-3">Message</h3>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 h-40 resize-none"
                placeholder="Enter your message..."
              />
            </Card>

            {/* Attachments */}
            <Card className="p-4">
              <h3 className="font-medium mb-3">Attachments</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="attach-pdf"
                    checked={attachPDF}
                    onChange={(e) => setAttachPDF(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="attach-pdf" className="text-sm">
                    Attach as PDF ({documentData.name || 'document'}.pdf)
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="attach-html"
                    checked={attachHTML}
                    onChange={(e) => setAttachHTML(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="attach-html" className="text-sm">
                    Attach as HTML ({documentData.name || 'document'}.html)
                  </label>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {recipients.filter(r => r.email.trim() !== '').length} recipient(s)
            {(attachPDF || attachHTML) && ' • With attachments'}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={sendEmail} disabled={isSending}>
              {isSending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Email
            </Button>
          </div>
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <Card className="p-6 w-96 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Email Templates</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowTemplates(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {templates.map(template => (
                <div
                  key={template.id}
                  className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => applyTemplate(template)}
                >
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{template.subject}</div>
                  {template.isDefault && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mt-2 inline-block">
                      Default
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <Card className="p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Email Preview</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700">To:</div>
                <div className="text-sm">
                  {recipients.filter(r => r.type === 'to' && r.email.trim() !== '').map(r => r.email).join(', ')}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">Subject:</div>
                <div className="text-sm">{subject}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">Message:</div>
                <div className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded border">
                  {body}
                </div>
              </div>
              
              {(attachPDF || attachHTML) && (
                <div>
                  <div className="text-sm font-medium text-gray-700">Attachments:</div>
                  <div className="text-sm">
                    {attachPDF && <div>📄 {documentData.name || 'document'}.pdf</div>}
                    {attachHTML && <div>🌐 {documentData.name || 'document'}.html</div>}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EmailIntegration;