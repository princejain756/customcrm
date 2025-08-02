import { ocrService } from './ocr-service';

// Test the OCR parsing with sample data from the image description
export function testOCRParsing() {
  const sampleOCRText = `BILLED TO: Invoice No. 12345
Imani Olowe 16 June 2005
+123-456-7890
63 Ivy Road, Hawkville, CA, USA 31036
Eggshell Camisole Top 1 $123 $123
Cuban Collar Shirt 2 $127 $254
Floral Cotton Dress 1 $123 $123
Subtotal $500
Tax (0%) $0
Total $500
Thank you!
PAYMENT INFORMATION
Briard Bank
Account Name: Samira Hadid
Account No.: 123-456-7890
Samira Hadid
Pay by: 5 July 2025 123
Anywhere St., Any City, ST 12345`;

  console.log('Testing OCR parsing with sample data...');
  console.log('Sample OCR Text:');
  console.log(sampleOCRText);
  console.log('\n--- Parsed Results ---');
  
  const result = ocrService.testParseBillText(sampleOCRText);
  
  console.log('Customer Info:', result.customer_info);
  console.log('Bill Details:', {
    bill_number: result.bill_number,
    bill_date: result.bill_date,
    total_amount: result.total_amount,
    gst_amount: result.gst_amount,
  });
  console.log('Payment Info:', result.payment_info);
  console.log('Items:', result.items);
  
  return result;
}

// Run the test if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  (window as Record<string, unknown>).testOCRParsing = testOCRParsing;
} else {
  // Node.js environment
  testOCRParsing();
} 