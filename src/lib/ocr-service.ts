import { createWorker } from 'tesseract.js';
import { ScannedBill, ScannedBillItem } from './types';

export interface OCRResult {
  bill_number?: string;
  bill_date?: string;
  total_amount?: number;
  gst_amount?: number;
  items?: ScannedBillItem[];
  customer_info?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    gstin?: string;
  };
  payment_info?: {
    bank_name?: string;
    account_name?: string;
    account_number?: string;
    payment_due_date?: string;
  };
  rawText: string;
}

export class OCRService {
  private worker: Tesseract.Worker | null = null;

  async initialize() {
    if (!this.worker) {
      this.worker = await createWorker('eng');
    }
  }

  async extractTextFromImage(imageFile: File): Promise<string> {
    await this.initialize();
    
    if (!this.worker) {
      throw new Error('OCR worker not initialized');
    }

    const { data: { text } } = await this.worker.recognize(imageFile);
    return text;
  }

  async extractBillData(imageFile: File): Promise<OCRResult> {
    const rawText = await this.extractTextFromImage(imageFile);
    
    // Parse the extracted text to find bill information
    const result = this.parseBillText(rawText);
    
    return {
      ...result,
      rawText,
    };
  }

  // Test function to verify OCR parsing with sample data
  testParseBillText(sampleText: string): Partial<OCRResult> {
    return this.parseBillText(sampleText);
  }

  private parseBillText(text: string): Partial<OCRResult> {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const result: Partial<OCRResult> = {};
    
    // Extract customer information
    result.customer_info = this.extractCustomerInfo(lines);
    
    // Extract bill details
    const billDetails = this.extractBillDetails(lines);
    Object.assign(result, billDetails);
    
    // Extract payment information
    result.payment_info = this.extractPaymentInfo(lines);
    
    // Extract line items
    result.items = this.extractLineItems(lines);
    
    return result;
  }

  private extractCustomerInfo(lines: string[]): OCRResult['customer_info'] {
    const customerInfo: OCRResult['customer_info'] = {};
    
    // Look for customer name patterns
    const namePatterns = [
      /billed\s+to[:\s]*(.+)/i,
      /customer[:\s]*(.+)/i,
      /client[:\s]*(.+)/i,
    ];
    
    for (const line of lines) {
      for (const pattern of namePatterns) {
        const match = line.match(pattern);
        if (match) {
          customerInfo.name = match[1].trim();
          break;
        }
      }
      if (customerInfo.name) break;
    }
    
    // Look for address patterns
    const addressPatterns = [
      /address[:\s]*(.+)/i,
      /(\d+\s+[A-Za-z\s]+(?:Road|Street|Avenue|Lane|Drive|Boulevard|Place|Court|Way|Terrace|Circle|Square|Plaza|Heights|Gardens|Park|Village|Town|City|State|Country|Postal|Zip|Pin)\s+\d{5,6})/i,
    ];
    
    for (const line of lines) {
      for (const pattern of addressPatterns) {
        const match = line.match(pattern);
        if (match) {
          customerInfo.address = match[1].trim();
          break;
        }
      }
      if (customerInfo.address) break;
    }
    
    // Look for phone patterns
    const phonePatterns = [
      /phone[:\s]*([+\d\s()]+)/i,
      /tel[:\s]*([+\d\s()]+)/i,
      /(\+\d{1,3}[\s]?\d{1,4}[\s]?\d{1,4}[\s]?\d{1,4})/,
    ];
    
    for (const line of lines) {
      for (const pattern of phonePatterns) {
        const match = line.match(pattern);
        if (match) {
          customerInfo.phone = match[1].trim();
          break;
        }
      }
      if (customerInfo.phone) break;
    }
    
    // Look for email patterns
    const emailPatterns = [
      /email[:\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
    ];
    
    for (const line of lines) {
      for (const pattern of emailPatterns) {
        const match = line.match(pattern);
        if (match) {
          customerInfo.email = match[1].trim();
          break;
        }
      }
      if (customerInfo.email) break;
    }
    
    // Look for GSTIN patterns
    const gstinPatterns = [
      /gstin[:\s]*([A-Z0-9]{15})/i,
      /gst[:\s]*([A-Z0-9]{15})/i,
    ];
    
    for (const line of lines) {
      for (const pattern of gstinPatterns) {
        const match = line.match(pattern);
        if (match) {
          customerInfo.gstin = match[1].trim();
          break;
        }
      }
      if (customerInfo.gstin) break;
    }
    
    return customerInfo;
  }

  private extractBillDetails(lines: string[]): Partial<OCRResult> {
    const billDetails: Partial<OCRResult> = {};
    
    // Extract bill number (look for patterns like "Bill No:", "Invoice No:", etc.)
    const billNumberPatterns = [
      /bill\s*no[:\s]*([A-Z0-9]+)/i,
      /invoice\s*no[:\s]*([A-Z0-9]+)/i,
      /bill[:\s]*([A-Z0-9]+)/i,
      /invoice[:\s]*([A-Z0-9]+)/i,
    ];
    
    for (const line of lines) {
      for (const pattern of billNumberPatterns) {
        const match = line.match(pattern);
        if (match) {
          billDetails.bill_number = match[1];
          break;
        }
      }
      if (billDetails.bill_number) break;
    }

    // Extract date (look for date patterns)
    const datePatterns = [
      /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
      /(\d{4}[/-]\d{1,2}[/-]\d{1,2})/,
      /date[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
      /date[:\s]*(\d{4}[/-]\d{1,2}[/-]\d{1,2})/i,
    ];
    
    for (const line of lines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          billDetails.bill_date = this.formatDate(match[1]);
          break;
        }
      }
      if (billDetails.bill_date) break;
    }

    // Extract total amount (look for "Total:", "Grand Total:", etc.)
    const totalPatterns = [
      /total[:\s]*₹?\s*([\d,]+\.?\d*)/i,
      /grand\s*total[:\s]*₹?\s*([\d,]+\.?\d*)/i,
      /amount[:\s]*₹?\s*([\d,]+\.?\d*)/i,
      /subtotal[:\s]*₹?\s*([\d,]+\.?\d*)/i,
    ];
    
    for (const line of lines) {
      for (const pattern of totalPatterns) {
        const match = line.match(pattern);
        if (match) {
          billDetails.total_amount = parseFloat(match[1].replace(/,/g, ''));
          break;
        }
      }
      if (billDetails.total_amount) break;
    }

    // Extract GST amount
    const gstPatterns = [
      /gst[:\s]*₹?\s*([\d,]+\.?\d*)/i,
      /tax[:\s]*₹?\s*([\d,]+\.?\d*)/i,
      /gst\s*\([^)]*\)[:\s]*₹?\s*([\d,]+\.?\d*)/i,
    ];
    
    for (const line of lines) {
      for (const pattern of gstPatterns) {
        const match = line.match(pattern);
        if (match) {
          billDetails.gst_amount = parseFloat(match[1].replace(/,/g, ''));
          break;
        }
      }
      if (billDetails.gst_amount) break;
    }

    return billDetails;
  }

  private extractPaymentInfo(lines: string[]): OCRResult['payment_info'] {
    const paymentInfo: OCRResult['payment_info'] = {};
    
    // Look for bank name patterns
    const bankPatterns = [
      /bank[:\s]*([A-Za-z\s]+)/i,
      /payment\s+information[:\s]*([A-Za-z\s]+)/i,
    ];
    
    for (const line of lines) {
      for (const pattern of bankPatterns) {
        const match = line.match(pattern);
        if (match) {
          paymentInfo.bank_name = match[1].trim();
          break;
        }
      }
      if (paymentInfo.bank_name) break;
    }
    
    // Look for account name patterns
    const accountNamePatterns = [
      /account\s+name[:\s]*([A-Za-z\s]+)/i,
      /account\s+holder[:\s]*([A-Za-z\s]+)/i,
    ];
    
    for (const line of lines) {
      for (const pattern of accountNamePatterns) {
        const match = line.match(pattern);
        if (match) {
          paymentInfo.account_name = match[1].trim();
          break;
        }
      }
      if (paymentInfo.account_name) break;
    }
    
    // Look for account number patterns
    const accountNumberPatterns = [
      /account\s+no[:\s]*([\d]+)/i,
      /account\s+number[:\s]*([\d]+)/i,
      /acc\s+no[:\s]*([\d]+)/i,
    ];
    
    for (const line of lines) {
      for (const pattern of accountNumberPatterns) {
        const match = line.match(pattern);
        if (match) {
          paymentInfo.account_number = match[1].trim();
          break;
        }
      }
      if (paymentInfo.account_number) break;
    }
    
    // Look for payment due date patterns
    const dueDatePatterns = [
      /pay\s+by[:\s]*(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i,
      /due\s+date[:\s]*(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i,
      /payment\s+due[:\s]*(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i,
    ];
    
    for (const line of lines) {
      for (const pattern of dueDatePatterns) {
        const match = line.match(pattern);
        if (match) {
          paymentInfo.payment_due_date = match[1].trim();
          break;
        }
      }
      if (paymentInfo.payment_due_date) break;
    }
    
    return paymentInfo;
  }

  private extractLineItems(lines: string[]): ScannedBillItem[] {
    const items: ScannedBillItem[] = [];
    
    // Look for line item patterns
    // Pattern: Product name, quantity, unit price, total price
    const itemPatterns = [
      /^([A-Za-z\s]+)\s+(\d+)\s+\$?(\d+\.?\d*)\s+\$?(\d+\.?\d*)$/,
      /^([A-Za-z\s]+)\s+(\d+)\s+₹?(\d+\.?\d*)\s+₹?(\d+\.?\d*)$/,
    ];
    
    for (const line of lines) {
      for (const pattern of itemPatterns) {
        const match = line.match(pattern);
        if (match) {
          const productName = match[1].trim();
          const quantity = parseInt(match[2]);
          const unitPrice = parseFloat(match[3]);
          const totalPrice = parseFloat(match[4]);
          
          // Calculate GST (assuming 18% if not specified)
          const gstRate = 18;
          const gstAmount = (totalPrice * gstRate) / 100;
          
          items.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            product_name: productName,
            quantity: quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
            gst_rate: gstRate,
            gst_amount: gstAmount,
          });
        }
      }
    }
    
    // If no structured items found, try to extract from subtotal/total sections
    if (items.length === 0) {
      // Look for subtotal patterns and create a single item
      const subtotalPatterns = [
        /subtotal[:\s]*₹?\s*([\d,]+\.?\d*)/i,
        /subtotal[:\s]*\$?\s*([\d,]+\.?\d*)/i,
      ];
      
      for (const line of lines) {
        for (const pattern of subtotalPatterns) {
          const match = line.match(pattern);
          if (match) {
            const totalAmount = parseFloat(match[1].replace(/,/g, ''));
            items.push({
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              product_name: 'Extracted Item',
              quantity: 1,
              unit_price: totalAmount,
              total_price: totalAmount,
              gst_rate: 18,
              gst_amount: 0,
            });
            break;
          }
        }
        if (items.length > 0) break;
      }
    }
    
    return items;
  }

  private formatDate(dateString: string): string {
    // Convert various date formats to YYYY-MM-DD
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

export const ocrService = new OCRService(); 