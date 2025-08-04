import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Camera, 
  Upload, 
  FileText, 
  Download, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  X,
  Edit,
  Trash2,
  Plus,
  Receipt,
  Eye,
  Settings,
  Palette,
  User,
  CreditCard,
  Building
} from 'lucide-react';
import { ScannedBill, ScannedBillItem, Lead, Organisation } from '@/lib/types';
import { ocrService } from '@/lib/ocr-service';
import { invoiceService, InvoiceData } from '@/lib/invoice-service';
import { billStorageService } from '@/lib/bill-storage-service';
import { notificationService } from '@/lib/notification-service';
import { useAuth } from '../contexts/AuthContext';

interface BillScannerProps {
  leadId?: string;
  lead?: Lead;
  organisation?: Organisation;
  onBillScanned?: (bill: ScannedBill) => void;
  onClose?: () => void;
}

const BillScanner = ({ leadId, lead, organisation, onBillScanned, onClose }: BillScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<Partial<ScannedBill>>({});
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    gstin: '',
  });
  const [paymentInfo, setPaymentInfo] = useState({
    bank_name: '',
    account_name: '',
    account_number: '',
    payment_due_date: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [rawOcrText, setRawOcrText] = useState<string>('');
  const [showOcrDebug, setShowOcrDebug] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('professional');
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [invoicePreviewUrl, setInvoicePreviewUrl] = useState<string>('');
  const [companyInfo, setCompanyInfo] = useState({
    name: 'Your Company Name',
    address: 'Your Company Address',
    phone: '+91 1234567890',
    email: 'info@yourcompany.com',
    gstin: 'GSTIN123456789',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Cleanup OCR worker on unmount
  useEffect(() => {
    return () => {
      ocrService.terminate();
    };
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setScannedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage using the new service
      const uploadResult = await billStorageService.uploadBillImage(file, leadId);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // Extract data using OCR
      await extractBillData(file, uploadResult.extractedData);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload bill image',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const extractBillData = async (file: File, uploadData?: Partial<ScannedBill>) => {
    setIsProcessing(true);
    try {
      // Show progress message
      toast({
        title: 'Processing',
        description: 'Extracting text from bill image...',
      });

      // Use real OCR processing
      const ocrResult = await ocrService.extractBillData(file);
      
      // Store raw OCR text for debugging
      setRawOcrText(ocrResult.rawText);
      
      // Create extracted data from OCR result
      const extractedData: Partial<ScannedBill> = {
        bill_number: ocrResult.bill_number || `BILL-${Date.now()}`,
        bill_date: ocrResult.bill_date || new Date().toISOString().split('T')[0],
        total_amount: ocrResult.total_amount || 0,
        gst_amount: ocrResult.gst_amount || 0,
        items: ocrResult.items || [],
        scanned_image_url: uploadData?.scanned_image_url || `bills/${Date.now()}_${file.name}`,
        lead_id: leadId,
      };

      setExtractedData(extractedData);
      
      // Set customer information from OCR
      if (ocrResult.customer_info) {
        setCustomerInfo({
          name: ocrResult.customer_info.name || '',
          address: ocrResult.customer_info.address || '',
          phone: ocrResult.customer_info.phone || '',
          email: ocrResult.customer_info.email || '',
          gstin: ocrResult.customer_info.gstin || '',
        });
      }
      
      // Set payment information from OCR
      if (ocrResult.payment_info) {
        setPaymentInfo({
          bank_name: ocrResult.payment_info.bank_name || '',
          account_name: ocrResult.payment_info.account_name || '',
          account_number: ocrResult.payment_info.account_number || '',
          payment_due_date: ocrResult.payment_info.payment_due_date || '',
        });
      }
      
      // Show success with details
      const extractedFields = [];
      if (ocrResult.bill_number) extractedFields.push('Bill Number');
      if (ocrResult.bill_date) extractedFields.push('Date');
      if (ocrResult.total_amount) extractedFields.push('Total Amount');
      if (ocrResult.gst_amount) extractedFields.push('GST Amount');
      if (ocrResult.customer_info?.name) extractedFields.push('Customer Info');
      if (ocrResult.payment_info?.bank_name) extractedFields.push('Payment Info');
      if (ocrResult.items?.length) extractedFields.push(`${ocrResult.items.length} Items`);
      
      // Add real notification for successful OCR extraction
      notificationService.addRealNotification(
        'Bill Scanned Successfully',
        `Successfully extracted ${extractedFields.length} fields from the bill image.`,
        'success'
      );
      
      toast({
        title: 'OCR Success',
        description: extractedFields.length > 0 
          ? `Extracted: ${extractedFields.join(', ')}. Please review and edit as needed.`
          : 'Text extracted. Please manually enter bill details.',
      });
    } catch (error) {
      console.error('Error extracting data:', error);
      
      // Add error notification for failed OCR extraction
      notificationService.addRealNotification(
        'Bill Scanning Failed',
        'Failed to extract data from the bill image. Please try manual entry or upload a clearer image.',
        'error'
      );
      
      toast({
        title: 'OCR Error',
        description: 'Failed to extract bill data. Please try manual entry or upload a clearer image.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualEntry = () => {
    setShowManualEntry(true);
    setExtractedData({
      bill_number: '',
      bill_date: new Date().toISOString().split('T')[0],
      total_amount: 0,
      gst_amount: 0,
      items: [],
    });
    setCustomerInfo({
      name: '',
      address: '',
      phone: '',
      email: '',
      gstin: '',
    });
    setPaymentInfo({
      bank_name: '',
      account_name: '',
      account_number: '',
      payment_due_date: '',
    });
  };

  const addBillItem = () => {
    const newItem: ScannedBillItem = {
      id: Date.now().toString(),
      product_name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      gst_rate: 18,
      gst_amount: 0,
    };

    setExtractedData(prev => {
      const items = [...(prev.items || []), newItem];
      
      // Recalculate overall totals
      const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);
      const totalGST = items.reduce((sum, item) => sum + item.gst_amount, 0);
      
      return {
        ...prev,
        items,
        total_amount: totalAmount,
        gst_amount: totalGST,
      };
    });
  };

  const updateBillItem = (index: number, field: keyof ScannedBillItem, value: string | number) => {
    setExtractedData(prev => {
      const items = [...(prev.items || [])];
      items[index] = { ...items[index], [field]: value };
      
      // Recalculate totals for this item
      const totalPrice = items[index].unit_price * items[index].quantity;
      const gstAmount = (totalPrice * items[index].gst_rate) / 100;
      items[index].total_price = totalPrice;
      items[index].gst_amount = gstAmount;
      
      // Recalculate overall totals
      const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);
      const totalGST = items.reduce((sum, item) => sum + item.gst_amount, 0);
      
      return { 
        ...prev, 
        items,
        total_amount: totalAmount,
        gst_amount: totalGST,
      };
    });
  };

  const removeBillItem = (index: number) => {
    setExtractedData(prev => {
      const items = prev.items?.filter((_, i) => i !== index) || [];
      
      // Recalculate overall totals
      const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);
      const totalGST = items.reduce((sum, item) => sum + item.gst_amount, 0);
      
      return {
        ...prev,
        items,
        total_amount: totalAmount,
        gst_amount: totalGST,
      };
    });
  };

  const saveBill = async () => {
    if (!extractedData.bill_number || !extractedData.items?.length) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Use the new bill storage service
      const saveResult = await billStorageService.saveBillData({
        lead_id: leadId || '',
        bill_number: extractedData.bill_number,
        bill_date: extractedData.bill_date || new Date().toISOString().split('T')[0],
        total_amount: extractedData.total_amount || 0,
        gst_amount: extractedData.gst_amount || 0,
        scanned_image_url: extractedData.scanned_image_url,
        items: extractedData.items,
      });

      if (!saveResult.success) {
        throw new Error(saveResult.error);
      }

      // Add real notification for successful bill save
      notificationService.addRealNotification(
        'Bill Saved Successfully',
        `Bill ${extractedData.bill_number} has been saved and is ready for processing.`,
        'success'
      );

      toast({
        title: 'Success',
        description: 'Bill saved successfully',
      });

      // Create the complete bill object for callback
      const completeBill: ScannedBill = {
        id: saveResult.billId!,
        lead_id: leadId || '',
        bill_number: extractedData.bill_number!,
        bill_date: extractedData.bill_date!,
        total_amount: extractedData.total_amount || 0,
        gst_amount: extractedData.gst_amount || 0,
        items: extractedData.items || [],
        scanned_image_url: extractedData.scanned_image_url,
        created_at: new Date().toISOString(),
      };

      onBillScanned?.(completeBill);
      onClose?.();
    } catch (error) {
      console.error('Error saving bill:', error);
      
      // Add error notification for failed bill save
      notificationService.addRealNotification(
        'Bill Save Failed',
        'There was an error saving the bill. Please try again.',
        'error'
      );
      
      toast({
        title: 'Error',
        description: 'Failed to save bill',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const generateInvoice = async () => {
    if (!extractedData.bill_number || !extractedData.items?.length) {
      toast({
        title: 'Error',
        description: 'Please scan or enter complete bill data first',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Create complete bill object
      const completeBill: ScannedBill = {
        id: Date.now().toString(),
        lead_id: leadId || '',
        bill_number: extractedData.bill_number,
        bill_date: extractedData.bill_date || new Date().toISOString().split('T')[0],
        total_amount: extractedData.total_amount || 0,
        gst_amount: extractedData.gst_amount || 0,
        items: extractedData.items || [],
        scanned_image_url: extractedData.scanned_image_url,
        created_at: new Date().toISOString(),
      };

      // Generate invoice data with real customer and company info
      const invoiceData: InvoiceData = {
        bill: completeBill,
        companyInfo: {
          name: companyInfo.name,
          address: companyInfo.address,
          phone: companyInfo.phone,
          email: companyInfo.email,
          gstin: companyInfo.gstin,
        },
        customerInfo: {
          name: customerInfo.name || lead?.name || 'Customer Name',
          address: customerInfo.address || lead?.address || 'Customer Address',
          phone: customerInfo.phone || lead?.phone || '+91 9876543210',
          email: customerInfo.email || lead?.email || 'customer@email.com',
          gstin: customerInfo.gstin || lead?.gstin || 'CUSTGSTIN123',
        },
        lead: lead,
        organisation: organisation,
      };

      // Generate and download invoice with selected template
      invoiceService.downloadInvoice(invoiceData, selectedTemplate);
      
      // Add real notification for successful invoice generation
      notificationService.addRealNotification(
        'Invoice Generated Successfully',
        `Invoice for bill ${extractedData.bill_number} has been generated and downloaded.`,
        'success'
      );
      
      toast({
        title: 'Success',
        description: `Invoice generated with ${selectedTemplate} template and downloaded successfully`,
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
      
      // Add error notification for failed invoice generation
      notificationService.addRealNotification(
        'Invoice Generation Failed',
        'There was an error generating the invoice. Please try again.',
        'error'
      );
      
      toast({
        title: 'Error',
        description: 'Failed to generate invoice',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const previewInvoice = async () => {
    if (!extractedData.bill_number || !extractedData.items?.length) {
      toast({
        title: 'Error',
        description: 'Please scan or enter complete bill data first',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create complete bill object
      const completeBill: ScannedBill = {
        id: Date.now().toString(),
        lead_id: leadId || '',
        bill_number: extractedData.bill_number,
        bill_date: extractedData.bill_date || new Date().toISOString().split('T')[0],
        total_amount: extractedData.total_amount || 0,
        gst_amount: extractedData.gst_amount || 0,
        items: extractedData.items || [],
        scanned_image_url: extractedData.scanned_image_url,
        created_at: new Date().toISOString(),
      };

      // Generate invoice data
      const invoiceData: InvoiceData = {
        bill: completeBill,
        companyInfo: {
          name: companyInfo.name,
          address: companyInfo.address,
          phone: companyInfo.phone,
          email: companyInfo.email,
          gstin: companyInfo.gstin,
        },
        customerInfo: {
          name: customerInfo.name || lead?.name || 'Customer Name',
          address: customerInfo.address || lead?.address || 'Customer Address',
          phone: customerInfo.phone || lead?.phone || '+91 9876543210',
          email: customerInfo.email || lead?.email || 'customer@email.com',
          gstin: customerInfo.gstin || lead?.gstin || 'CUSTGSTIN123',
        },
        lead: lead,
        organisation: organisation,
      };

      // Generate invoice URL for preview
      const invoiceUrl = invoiceService.generateInvoiceUrl(invoiceData, selectedTemplate);
      setInvoicePreviewUrl(invoiceUrl);
      setShowInvoicePreview(true);
      
    } catch (error) {
      console.error('Error previewing invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to preview invoice',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Scanning Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Camera className="h-5 w-5" />
                Scan Bill
              </CardTitle>
              <CardDescription>
                Upload a bill image to extract data automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 lg:p-6 text-center">
                {scannedImage ? (
                  <div className="space-y-4">
                    <img 
                      src={'D:/CUSTOM CRM/scanbill-to-tally/public/logo'} 
                      alt="Scanned bill" 
                      className="max-w-full h-48 lg:h-64 object-contain mx-auto"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => setScannedImage(null)}
                      size="sm"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium">Upload Bill Image</p>
                      <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button onClick={() => fileInputRef.current?.click()} size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </Button>
                      <Button variant="outline" onClick={handleManualEntry} size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Manual Entry
                      </Button>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  aria-label="Upload bill image"
                />
              </div>
              
              {(isScanning || isProcessing) && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">{isScanning ? 'Scanning bill...' : 'Processing bill data...'}</span>
                </div>
              )}
              
              {rawOcrText && (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowOcrDebug(!showOcrDebug)}
                  >
                    {showOcrDebug ? 'Hide' : 'Show'} OCR Debug Info
                  </Button>
                  {showOcrDebug && (
                    <div className="p-3 bg-gray-50 rounded border text-xs max-h-32 overflow-y-auto">
                      <p className="font-semibold mb-2">Raw OCR Text:</p>
                      <pre className="whitespace-pre-wrap text-gray-700">{rawOcrText}</pre>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Data Entry Section */}
        <div className="space-y-4">
          {/* Customer Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
              <CardDescription>
                Customer details extracted from bill
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <div>
                  <Label htmlFor="customer-name" className="text-sm">Customer Name</Label>
                  <Input
                    id="customer-name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter customer name"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-phone" className="text-sm">Phone</Label>
                  <Input
                    id="customer-phone"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-email" className="text-sm">Email</Label>
                  <Input
                    id="customer-email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-gstin" className="text-sm">GSTIN</Label>
                  <Input
                    id="customer-gstin"
                    value={customerInfo.gstin}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, gstin: e.target.value }))}
                    placeholder="Enter GSTIN"
                    className="text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="customer-address" className="text-sm">Address</Label>
                  <Textarea
                    id="customer-address"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter customer address"
                    className="text-sm"
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bill Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <FileText className="h-5 w-5" />
                Bill Details
              </CardTitle>
              <CardDescription>
                Review and edit extracted bill information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <div>
                  <Label htmlFor="bill-number" className="text-sm">Bill Number</Label>
                  <Input
                    id="bill-number"
                    value={extractedData.bill_number || ''}
                    onChange={(e) => setExtractedData(prev => ({ ...prev, bill_number: e.target.value }))}
                    placeholder="Enter bill number"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="bill-date" className="text-sm">Bill Date</Label>
                  <Input
                    id="bill-date"
                    type="date"
                    value={extractedData.bill_date || ''}
                    onChange={(e) => setExtractedData(prev => ({ ...prev, bill_date: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <div>
                  <Label htmlFor="total-amount" className="text-sm">Total Amount</Label>
                  <Input
                    id="total-amount"
                    type="number"
                    value={extractedData.total_amount || ''}
                    onChange={(e) => setExtractedData(prev => ({ ...prev, total_amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="gst-amount" className="text-sm">GST Amount</Label>
                  <Input
                    id="gst-amount"
                    type="number"
                    value={extractedData.gst_amount || ''}
                    onChange={(e) => setExtractedData(prev => ({ ...prev, gst_amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Bill Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Bill Items</Label>
                  <Button size="sm" onClick={addBillItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {extractedData.items?.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 border rounded text-sm">
                      <Input
                        placeholder="Product name"
                        value={item.product_name || ''}
                        onChange={(e) => updateBillItem(index, 'product_name', e.target.value)}
                        className="flex-1 text-xs"
                        aria-label="Product name"
                      />
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity || ''}
                        onChange={(e) => updateBillItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-16 text-xs"
                        aria-label="Quantity"
                      />
                      <Input
                        type="number"
                        placeholder="Unit Price"
                        value={item.unit_price || ''}
                        onChange={(e) => updateBillItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-20 text-xs"
                        aria-label="Unit price"
                      />
                      <Input
                        type="number"
                        placeholder="Total"
                        value={item.total_price || ''}
                        onChange={(e) => updateBillItem(index, 'total_price', parseFloat(e.target.value) || 0)}
                        className="w-20 text-xs"
                        aria-label="Total price"
                      />
                      <Input
                        type="number"
                        placeholder="GST %"
                        value={item.gst_rate || ''}
                        onChange={(e) => updateBillItem(index, 'gst_rate', parseFloat(e.target.value) || 0)}
                        className="w-16 text-xs"
                        aria-label="GST rate"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeBillItem(index)}
                        className="px-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
              <CardDescription>
                Payment details extracted from bill
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <div>
                  <Label htmlFor="bank-name" className="text-sm">Bank Name</Label>
                  <Input
                    id="bank-name"
                    value={paymentInfo.bank_name}
                    onChange={(e) => setPaymentInfo(prev => ({ ...prev, bank_name: e.target.value }))}
                    placeholder="Enter bank name"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="account-name" className="text-sm">Account Name</Label>
                  <Input
                    id="account-name"
                    value={paymentInfo.account_name}
                    onChange={(e) => setPaymentInfo(prev => ({ ...prev, account_name: e.target.value }))}
                    placeholder="Enter account holder name"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="account-number" className="text-sm">Account Number</Label>
                  <Input
                    id="account-number"
                    value={paymentInfo.account_number}
                    onChange={(e) => setPaymentInfo(prev => ({ ...prev, account_number: e.target.value }))}
                    placeholder="Enter account number"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="payment-due-date" className="text-sm">Payment Due Date</Label>
                  <Input
                    id="payment-due-date"
                    value={paymentInfo.payment_due_date}
                    onChange={(e) => setPaymentInfo(prev => ({ ...prev, payment_due_date: e.target.value }))}
                    placeholder="Enter payment due date"
                    className="text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invoice Generation Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Palette className="h-5 w-5" />
            Invoice Generation
          </CardTitle>
          <CardDescription>
            Configure and generate professional invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template" className="text-sm">Invoice Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="simple">Simple</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm">Template Preview</Label>
              <div className="flex space-x-2 mt-2">
                <Button
                  size="sm"
                  variant={selectedTemplate === 'professional' ? 'default' : 'outline'}
                  onClick={() => setSelectedTemplate('professional')}
                  className="text-xs"
                >
                  Professional
                </Button>
                <Button
                  size="sm"
                  variant={selectedTemplate === 'modern' ? 'default' : 'outline'}
                  onClick={() => setSelectedTemplate('modern')}
                  className="text-xs"
                >
                  Modern
                </Button>
                <Button
                  size="sm"
                  variant={selectedTemplate === 'simple' ? 'default' : 'outline'}
                  onClick={() => setSelectedTemplate('simple')}
                  className="text-xs"
                >
                  Simple
                </Button>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <Label className="text-sm">Company Information</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
              <div>
                <Label htmlFor="company-name" className="text-sm">Company Name</Label>
                <Input
                  id="company-name"
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter company name"
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="company-gstin" className="text-sm">GSTIN</Label>
                <Input
                  id="company-gstin"
                  value={companyInfo.gstin}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, gstin: e.target.value }))}
                  placeholder="Enter GSTIN"
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="company-phone" className="text-sm">Phone</Label>
                <Input
                  id="company-phone"
                  value={companyInfo.phone}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="company-email" className="text-sm">Email</Label>
                <Input
                  id="company-email"
                  value={companyInfo.email}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email"
                  className="text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="company-address" className="text-sm">Address</Label>
                <Textarea
                  id="company-address"
                  value={companyInfo.address}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter company address"
                  className="text-sm"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
            <Button variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button onClick={saveBill} disabled={isProcessing} size="sm">
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Bill
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={previewInvoice} 
              disabled={isProcessing || !extractedData.bill_number}
              size="sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Invoice
            </Button>
            <Button 
              onClick={generateInvoice} 
              disabled={isProcessing || !extractedData.bill_number}
              size="sm"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Invoice
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Preview Modal */}
      {showInvoicePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 lg:p-6 max-w-4xl w-full h-5/6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Invoice Preview</h3>
              <Button variant="outline" onClick={() => setShowInvoicePreview(false)} size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={invoicePreviewUrl}
                className="w-full h-full border-0"
                title="Invoice Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillScanner; 