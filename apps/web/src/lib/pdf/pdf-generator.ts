import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PrintFormat, PrintElement } from '@/components/print/PrintFormatDesigner';

export interface PDFGenerationOptions {
  format: PrintFormat;
  documentData: Record<string, any>;
  letterheadData?: {
    header_html?: string;
    footer_html?: string;
    logo?: string;
  };
  filename?: string;
  download?: boolean;
  quality?: number;
}

export class PDFGenerator {
  private format: PrintFormat;
  private documentData: Record<string, any>;
  private letterheadData?: PDFGenerationOptions['letterheadData'];
  private quality: number;

  constructor(options: PDFGenerationOptions) {
    this.format = options.format;
    this.documentData = options.documentData;
    this.letterheadData = options.letterheadData;
    this.quality = options.quality || 2;
  }

  /**
   * Generate PDF from print format
   */
  async generatePDF(options: { download?: boolean; filename?: string } = {}): Promise<Blob> {
    const { download = false, filename = 'document.pdf' } = options;

    // Create a temporary container for rendering
    const container = this.createRenderContainer();
    document.body.appendChild(container);

    try {
      // Render the document content
      await this.renderDocument(container);

      // Generate PDF from the rendered content
      const pdf = await this.createPDFFromElement(container);

      if (download) {
        pdf.save(filename);
      }

      // Return PDF as blob
      const pdfBlob = pdf.output('blob');
      return pdfBlob;
    } finally {
      // Clean up
      document.body.removeChild(container);
    }
  }

  /**
   * Create a temporary container for rendering
   */
  private createRenderContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = 'auto';
    container.style.height = 'auto';
    container.style.backgroundColor = 'white';
    container.style.fontFamily = 'Arial, sans-serif';
    
    return container;
  }

  /**
   * Render document content in the container
   */
  private async renderDocument(container: HTMLDivElement): Promise<void> {
    const { width, height } = this.getPageDimensions();
    
    // Set container dimensions
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.position = 'relative';
    container.style.overflow = 'hidden';

    // Add letterhead header
    if (this.letterheadData?.header_html) {
      const headerElement = document.createElement('div');
      headerElement.innerHTML = this.letterheadData.header_html;
      headerElement.style.position = 'absolute';
      headerElement.style.top = `${this.format.margins.top}px`;
      headerElement.style.left = `${this.format.margins.left}px`;
      headerElement.style.right = `${this.format.margins.right}px`;
      container.appendChild(headerElement);
    }

    // Render print elements
    for (const element of this.format.elements) {
      const elementDiv = this.renderElement(element);
      if (elementDiv) {
        container.appendChild(elementDiv);
      }
    }

    // Add letterhead footer
    if (this.letterheadData?.footer_html) {
      const footerElement = document.createElement('div');
      footerElement.innerHTML = this.letterheadData.footer_html;
      footerElement.style.position = 'absolute';
      footerElement.style.bottom = `${this.format.margins.bottom}px`;
      footerElement.style.left = `${this.format.margins.left}px`;
      footerElement.style.right = `${this.format.margins.right}px`;
      container.appendChild(footerElement);
    }

    // Wait for images to load
    await this.waitForImages(container);
  }

  /**
   * Render a single print element
   */
  private renderElement(element: PrintElement): HTMLDivElement | null {
    // Check conditions
    if (element.conditions && element.conditions.length > 0) {
      const conditionsMet = element.conditions.every(condition => {
        const fieldValue = this.documentData[condition.field];
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

    const elementDiv = document.createElement('div');
    elementDiv.style.position = 'absolute';
    elementDiv.style.left = `${element.x}px`;
    elementDiv.style.top = `${element.y}px`;
    elementDiv.style.width = `${element.width}px`;
    elementDiv.style.height = `${element.height}px`;
    elementDiv.style.fontSize = `${element.style.fontSize}px`;
    elementDiv.style.fontFamily = element.style.fontFamily || 'Arial, sans-serif';
    elementDiv.style.fontWeight = element.style.fontWeight || 'normal';
    elementDiv.style.fontStyle = element.style.fontStyle || 'normal';
    elementDiv.style.textAlign = element.style.textAlign || 'left';
    elementDiv.style.color = element.style.color || '#000000';
    elementDiv.style.backgroundColor = element.style.backgroundColor || 'transparent';
    elementDiv.style.padding = `${element.style.padding.top}px ${element.style.padding.right}px ${element.style.padding.bottom}px ${element.style.padding.left}px`;
    elementDiv.style.overflow = 'hidden';
    elementDiv.style.wordWrap = 'break-word';
    elementDiv.style.boxSizing = 'border-box';

    // Add border if specified
    if (element.style.border && element.style.border.width > 0) {
      elementDiv.style.border = `${element.style.border.width}px ${element.style.border.style} ${element.style.border.color}`;
    }

    // Set content based on element type
    const content = this.getElementContent(element);
    
    if (element.type === 'line') {
      elementDiv.style.borderTop = `${element.height}px solid ${element.style.color}`;
      elementDiv.style.height = '0px';
    } else if (element.type === 'image') {
      if (typeof content === 'string' && content) {
        const img = document.createElement('img');
        img.src = content;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        elementDiv.appendChild(img);
      }
    } else {
      elementDiv.textContent = String(content || '');
    }

    return elementDiv;
  }

  /**
   * Get content for an element based on its type and field mapping
   */
  private getElementContent(element: PrintElement): string | null {
    switch (element.type) {
      case 'text':
        return element.content || '';
        
      case 'field':
        if (!element.fieldname) return '';
        const fieldValue = this.documentData[element.fieldname];
        
        if (fieldValue === null || fieldValue === undefined) return '';
        if (typeof fieldValue === 'number') {
          return fieldValue.toLocaleString();
        }
        if (fieldValue instanceof Date) {
          return fieldValue.toLocaleDateString();
        }
        return String(fieldValue);
        
      case 'image':
        if (element.fieldname && this.documentData[element.fieldname]) {
          return this.documentData[element.fieldname];
        }
        return null;
        
      case 'table':
        // TODO: Implement table rendering
        return 'Table Data';
        
      case 'line':
        return null;
        
      default:
        return element.content || '';
    }
  }

  /**
   * Wait for all images in the container to load
   */
  private async waitForImages(container: HTMLElement): Promise<void> {
    const images = container.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
      return new Promise<void>((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Continue even if image fails to load
        }
      });
    });

    await Promise.all(imagePromises);
  }

  /**
   * Create PDF from rendered element using html2canvas and jsPDF
   */
  private async createPDFFromElement(element: HTMLElement): Promise<jsPDF> {
    const { width, height } = this.getPageDimensions();
    
    // Convert to canvas
    const canvas = await html2canvas(element, {
      width: width,
      height: height,
      scale: this.quality,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: this.format.orientation.toLowerCase() as 'portrait' | 'landscape',
      unit: 'px',
      format: [width, height],
    });

    // Add image to PDF
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);

    return pdf;
  }

  /**
   * Get page dimensions in pixels
   */
  private getPageDimensions(): { width: number; height: number } {
    const dpi = 96; // Screen DPI for consistent rendering
    const mmToPx = dpi / 25.4;
    
    let width, height;
    switch (this.format.page_size) {
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

    if (this.format.orientation === 'Landscape') {
      [width, height] = [height, width];
    }

    return { width, height };
  }

  /**
   * Generate PDF and return as base64 string
   */
  async generateBase64(): Promise<string> {
    const container = this.createRenderContainer();
    document.body.appendChild(container);

    try {
      await this.renderDocument(container);
      const pdf = await this.createPDFFromElement(container);
      return pdf.output('datauristring');
    } finally {
      document.body.removeChild(container);
    }
  }

  /**
   * Generate PDF and return as ArrayBuffer
   */
  async generateArrayBuffer(): Promise<ArrayBuffer> {
    const container = this.createRenderContainer();
    document.body.appendChild(container);

    try {
      await this.renderDocument(container);
      const pdf = await this.createPDFFromElement(container);
      return pdf.output('arraybuffer');
    } finally {
      document.body.removeChild(container);
    }
  }
}

/**
 * Utility function to generate PDF from print format
 */
export async function generatePDF(options: PDFGenerationOptions): Promise<Blob> {
  const generator = new PDFGenerator(options);
  return generator.generatePDF({
    download: options.download,
    filename: options.filename,
  });
}

/**
 * Utility function to download PDF
 */
export async function downloadPDF(options: PDFGenerationOptions): Promise<void> {
  const generator = new PDFGenerator(options);
  await generator.generatePDF({
    download: true,
    filename: options.filename || 'document.pdf',
  });
}