import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ScannedBill, ScannedBillItem, Lead, Organisation } from './types';

export interface InvoiceData {
  bill: ScannedBill;
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    gstin: string;
    logo?: string;
  };
  customerInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    gstin: string;
  };
  lead?: Lead;
  organisation?: Organisation;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  generate: (data: InvoiceData) => jsPDF;
}

export class InvoiceService {
  private templates: Map<string, InvoiceTemplate> = new Map();

  constructor() {
    this.registerDefaultTemplates();
  }

  private registerDefaultTemplates() {
    // Professional template
    this.templates.set('professional', {
      id: 'professional',
      name: 'Professional',
      description: 'Clean and professional invoice design',
      generate: (data: InvoiceData) => this.generateProfessionalInvoice(data)
    });

    // Modern template
    this.templates.set('modern', {
      id: 'modern',
      name: 'Modern',
      description: 'Modern design with accent colors',
      generate: (data: InvoiceData) => this.generateModernInvoice(data)
    });

    // Simple template
    this.templates.set('simple', {
      id: 'simple',
      name: 'Simple',
      description: 'Simple and clean design',
      generate: (data: InvoiceData) => this.generateSimpleInvoice(data)
    });
  }

  getTemplates(): InvoiceTemplate[] {
    return Array.from(this.templates.values());
  }

  generateInvoice(invoiceData: InvoiceData, templateId: string = 'professional'): jsPDF {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    return template.generate(invoiceData);
  }

  private generateProfessionalInvoice(data: InvoiceData): jsPDF {
    const doc = new jsPDF();
    
    // Add company header with logo
    this.addProfessionalHeader(doc, data.companyInfo);
    
    // Add customer information
    this.addCustomerInfo(doc, data.customerInfo);
    
    // Add invoice details
    this.addInvoiceDetails(doc, data.bill);
    
    // Add items table
    this.addProfessionalItemsTable(doc, data.bill.items);
    
    // Add totals
    this.addProfessionalTotals(doc, data.bill);
    
    // Add footer
    this.addProfessionalFooter(doc, data.companyInfo);
    
    return doc;
  }

  private generateModernInvoice(data: InvoiceData): jsPDF {
    const doc = new jsPDF();
    
    // Add modern header
    this.addModernHeader(doc, data.companyInfo);
    
    // Add customer information
    this.addModernCustomerInfo(doc, data.customerInfo);
    
    // Add invoice details
    this.addModernInvoiceDetails(doc, data.bill);
    
    // Add items table
    this.addModernItemsTable(doc, data.bill.items);
    
    // Add totals
    this.addModernTotals(doc, data.bill);
    
    // Add footer
    this.addModernFooter(doc);
    
    return doc;
  }

  private generateSimpleInvoice(data: InvoiceData): jsPDF {
    const doc = new jsPDF();
    
    // Add simple header
    this.addSimpleHeader(doc, data.companyInfo);
    
    // Add customer information
    this.addSimpleCustomerInfo(doc, data.customerInfo);
    
    // Add invoice details
    this.addSimpleInvoiceDetails(doc, data.bill);
    
    // Add items table
    this.addSimpleItemsTable(doc, data.bill.items);
    
    // Add totals
    this.addSimpleTotals(doc, data.bill);
    
    // Add footer
    this.addSimpleFooter(doc);
    
    return doc;
  }

  // Professional template methods
  private addProfessionalHeader(doc: jsPDF, companyInfo: InvoiceData['companyInfo']) {
    // Add logo if available
    if (companyInfo.logo) {
      try {
        doc.addImage(companyInfo.logo, 'JPEG', 20, 20, 40, 20);
      } catch (error) {
        console.warn('Could not add logo to invoice');
      }
    }

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text(companyInfo.name, 20, 50);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(52, 73, 94);
    doc.text(companyInfo.address, 20, 60);
    doc.text(`Phone: ${companyInfo.phone}`, 20, 70);
    doc.text(`Email: ${companyInfo.email}`, 20, 75);
    doc.text(`GSTIN: ${companyInfo.gstin}`, 20, 80);
  }

  private addCustomerInfo(doc: jsPDF, customerInfo: InvoiceData['customerInfo']) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('Bill To:', 120, 50);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(52, 73, 94);
    doc.text(customerInfo.name, 120, 60);
    doc.text(customerInfo.address, 120, 70);
    doc.text(`Phone: ${customerInfo.phone}`, 120, 80);
    doc.text(`Email: ${customerInfo.email}`, 120, 85);
    doc.text(`GSTIN: ${customerInfo.gstin}`, 120, 90);
  }

  private addInvoiceDetails(doc: jsPDF, bill: ScannedBill) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('INVOICE', 20, 110);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(52, 73, 94);
    doc.text(`Invoice No: ${bill.bill_number}`, 20, 120);
    doc.text(`Date: ${new Date(bill.bill_date).toLocaleDateString()}`, 20, 125);
  }

  private addProfessionalItemsTable(doc: jsPDF, items: ScannedBillItem[]) {
    const tableData = items.map(item => [
      item.product_name,
      item.quantity.toString(),
      `₹${item.unit_price.toFixed(2)}`,
      `${item.gst_rate}%`,
      `₹${item.gst_amount.toFixed(2)}`,
      `₹${item.total_price.toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [['Item', 'Qty', 'Unit Price', 'GST %', 'GST Amount', 'Total']],
      body: tableData,
      startY: 140,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: [52, 73, 94],
      },
      headStyles: {
        fillColor: [44, 62, 80],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      margin: { top: 10, right: 20, bottom: 10, left: 20 },
    });
  }

  private addProfessionalTotals(doc: jsPDF, bill: ScannedBill) {
    const finalY = (doc as any).lastAutoTable.finalY || 200;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('Totals:', 150, finalY + 15);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(52, 73, 94);
    const subtotal = bill.total_amount - bill.gst_amount;
    doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`, 150, finalY + 25);
    doc.text(`GST: ₹${bill.gst_amount.toFixed(2)}`, 150, finalY + 30);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`Total: ₹${bill.total_amount.toFixed(2)}`, 150, finalY + 40);
  }

  private addProfessionalFooter(doc: jsPDF, companyInfo: InvoiceData['companyInfo']) {
    const pageHeight = doc.internal.pageSize.height;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(149, 165, 166);
    doc.text('Thank you for your business!', 20, pageHeight - 25);
    doc.text('This is a computer generated invoice.', 20, pageHeight - 20);
    doc.text(`Generated by ${companyInfo.name}`, 20, pageHeight - 15);
  }

  // Modern template methods
  private addModernHeader(doc: jsPDF, companyInfo: InvoiceData['companyInfo']) {
    // Add colored header bar
    doc.setFillColor(52, 152, 219);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(companyInfo.name, 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(companyInfo.address, 20, 35);
    doc.text(`Phone: ${companyInfo.phone} | Email: ${companyInfo.email}`, 20, 42);
  }

  private addModernCustomerInfo(doc: jsPDF, customerInfo: InvoiceData['customerInfo']) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 73, 94);
    doc.text('Bill To:', 120, 50);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(customerInfo.name, 120, 60);
    doc.text(customerInfo.address, 120, 70);
    doc.text(`Phone: ${customerInfo.phone}`, 120, 80);
    doc.text(`Email: ${customerInfo.email}`, 120, 85);
  }

  private addModernInvoiceDetails(doc: jsPDF, bill: ScannedBill) {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 152, 219);
    doc.text('INVOICE', 20, 100);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(52, 73, 94);
    doc.text(`Invoice No: ${bill.bill_number}`, 20, 110);
    doc.text(`Date: ${new Date(bill.bill_date).toLocaleDateString()}`, 20, 115);
  }

  private addModernItemsTable(doc: jsPDF, items: ScannedBillItem[]) {
    const tableData = items.map(item => [
      item.product_name,
      item.quantity.toString(),
      `₹${item.unit_price.toFixed(2)}`,
      `${item.gst_rate}%`,
      `₹${item.gst_amount.toFixed(2)}`,
      `₹${item.total_price.toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [['Item', 'Qty', 'Unit Price', 'GST %', 'GST Amount', 'Total']],
      body: tableData,
      startY: 130,
      styles: {
        fontSize: 9,
        cellPadding: 4,
        textColor: [52, 73, 94],
      },
      headStyles: {
        fillColor: [52, 152, 219],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [236, 240, 241],
      },
    });
  }

  private addModernTotals(doc: jsPDF, bill: ScannedBill) {
    const finalY = (doc as any).lastAutoTable.finalY || 200;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 73, 94);
    doc.text('Totals:', 150, finalY + 15);
    
    doc.setFont('helvetica', 'normal');
    const subtotal = bill.total_amount - bill.gst_amount;
    doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`, 150, finalY + 25);
    doc.text(`GST: ₹${bill.gst_amount.toFixed(2)}`, 150, finalY + 30);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(52, 152, 219);
    doc.text(`Total: ₹${bill.total_amount.toFixed(2)}`, 150, finalY + 40);
  }

  private addModernFooter(doc: jsPDF) {
    const pageHeight = doc.internal.pageSize.height;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(149, 165, 166);
    doc.text('Thank you for your business!', 20, pageHeight - 20);
    doc.text('This is a computer generated invoice.', 20, pageHeight - 15);
  }

  // Simple template methods
  private addSimpleHeader(doc: jsPDF, companyInfo: InvoiceData['companyInfo']) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(companyInfo.name, 20, 30);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(companyInfo.address, 20, 40);
    doc.text(`Phone: ${companyInfo.phone}`, 20, 50);
    doc.text(`Email: ${companyInfo.email}`, 20, 55);
    doc.text(`GSTIN: ${companyInfo.gstin}`, 20, 60);
  }

  private addSimpleCustomerInfo(doc: jsPDF, customerInfo: InvoiceData['customerInfo']) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 120, 30);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(customerInfo.name, 120, 40);
    doc.text(customerInfo.address, 120, 50);
    doc.text(`Phone: ${customerInfo.phone}`, 120, 60);
    doc.text(`Email: ${customerInfo.email}`, 120, 65);
    doc.text(`GSTIN: ${customerInfo.gstin}`, 120, 70);
  }

  private addSimpleInvoiceDetails(doc: jsPDF, bill: ScannedBill) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice', 20, 90);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: ${bill.bill_number}`, 20, 100);
    doc.text(`Date: ${new Date(bill.bill_date).toLocaleDateString()}`, 20, 105);
  }

  private addSimpleItemsTable(doc: jsPDF, items: ScannedBillItem[]) {
    const tableData = items.map(item => [
      item.product_name,
      item.quantity.toString(),
      `₹${item.unit_price.toFixed(2)}`,
      `${item.gst_rate}%`,
      `₹${item.gst_amount.toFixed(2)}`,
      `₹${item.total_price.toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [['Item', 'Qty', 'Unit Price', 'GST %', 'GST Amount', 'Total']],
      body: tableData,
      startY: 120,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [128, 128, 128],
        textColor: 255,
        fontStyle: 'bold',
      },
    });
  }

  private addSimpleTotals(doc: jsPDF, bill: ScannedBill) {
    const finalY = (doc as any).lastAutoTable.finalY || 200;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Totals:', 150, finalY + 10);
    
    doc.setFont('helvetica', 'normal');
    const subtotal = bill.total_amount - bill.gst_amount;
    doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`, 150, finalY + 20);
    doc.text(`GST: ₹${bill.gst_amount.toFixed(2)}`, 150, finalY + 25);
    doc.text(`Total: ₹${bill.total_amount.toFixed(2)}`, 150, finalY + 30);
  }

  private addSimpleFooter(doc: jsPDF) {
    const pageHeight = doc.internal.pageSize.height;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your business!', 20, pageHeight - 20);
    doc.text('This is a computer generated invoice.', 20, pageHeight - 15);
  }

  downloadInvoice(invoiceData: InvoiceData, templateId: string = 'professional', filename?: string): void {
    const doc = this.generateInvoice(invoiceData, templateId);
    const defaultFilename = `invoice_${invoiceData.bill.bill_number}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename || defaultFilename);
  }

  generateInvoiceBlob(invoiceData: InvoiceData, templateId: string = 'professional'): Blob {
    const doc = this.generateInvoice(invoiceData, templateId);
    return doc.output('blob');
  }

  generateInvoiceUrl(invoiceData: InvoiceData, templateId: string = 'professional'): string {
    const doc = this.generateInvoice(invoiceData, templateId);
    return doc.output('datauristring');
  }
}

export const invoiceService = new InvoiceService(); 