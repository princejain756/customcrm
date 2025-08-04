import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  Search, 
  Filter,
  Calendar,
  DollarSign,
  Receipt,
  Loader2,
  X,
  Plus,
  Settings
} from 'lucide-react';
import { ScannedBill, Lead, Organisation } from '@/lib/types';
import { invoiceService, InvoiceData } from '@/lib/invoice-service';
import { billStorageService } from '@/lib/bill-storage-service';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface InvoiceManagerProps {
  leadId?: string;
  lead?: Lead;
  organisation?: Organisation;
  onClose?: () => void;
}

const InvoiceManager = ({ leadId, lead, organisation, onClose }: InvoiceManagerProps) => {
  const [bills, setBills] = useState<ScannedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('professional');
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [previewBill, setPreviewBill] = useState<ScannedBill | null>(null);
  const [invoicePreviewUrl, setInvoicePreviewUrl] = useState<string>('');
  const [companyInfo, setCompanyInfo] = useState({
    name: 'Your Company Name',
    address: 'Your Company Address',
    phone: '+91 1234567890',
    email: 'info@yourcompany.com',
    gstin: 'GSTIN123456789',
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadBills();
  }, [leadId]);

  const loadBills = async () => {
    setLoading(true);
    try {
      if (leadId) {
        const billsData = await billStorageService.getBillsByLead(leadId);
        setBills(billsData);
      } else {
        // Load all bills for the organisation
        const { data, error } = await supabase
          .from('scanned_bills')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const billsData = data.map(bill => ({
          id: bill.id,
          lead_id: bill.lead_id,
          bill_number: bill.bill_number,
          bill_date: bill.bill_date,
          total_amount: bill.total_amount,
          gst_amount: bill.gst_amount,
          scanned_image_url: bill.scanned_image_url,
          items: bill.items ? JSON.parse(bill.items) : [],
          created_at: bill.created_at
        }));

        setBills(billsData);
      }
    } catch (error) {
      console.error('Error loading bills:', error);
      toast({
        title: 'Error',
        description: 'Failed to load bills',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredBills = bills.filter(bill => 
    bill.bill_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bill.bill_date.includes(searchQuery)
  );

  const generateInvoice = async (bill: ScannedBill) => {
    try {
      const invoiceData: InvoiceData = {
        bill: bill,
        companyInfo: {
          name: companyInfo.name,
          address: companyInfo.address,
          phone: companyInfo.phone,
          email: companyInfo.email,
          gstin: companyInfo.gstin,
        },
        customerInfo: {
          name: lead?.name || 'Customer Name',
          address: lead?.address || 'Customer Address',
          phone: lead?.phone || '+91 9876543210',
          email: lead?.email || 'customer@email.com',
          gstin: lead?.gstin || 'CUSTGSTIN123',
        },
        lead: lead,
        organisation: organisation,
      };

      invoiceService.downloadInvoice(invoiceData, selectedTemplate);
      
      toast({
        title: 'Success',
        description: `Invoice generated with ${selectedTemplate} template`,
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate invoice',
        variant: 'destructive',
      });
    }
  };

  const previewInvoice = async (bill: ScannedBill) => {
    try {
      const invoiceData: InvoiceData = {
        bill: bill,
        companyInfo: {
          name: companyInfo.name,
          address: companyInfo.address,
          phone: companyInfo.phone,
          email: companyInfo.email,
          gstin: companyInfo.gstin,
        },
        customerInfo: {
          name: lead?.name || 'Customer Name',
          address: lead?.address || 'Customer Address',
          phone: lead?.phone || '+91 9876543210',
          email: lead?.email || 'customer@email.com',
          gstin: lead?.gstin || 'CUSTGSTIN123',
        },
        lead: lead,
        organisation: organisation,
      };

      const invoiceUrl = invoiceService.generateInvoiceUrl(invoiceData, selectedTemplate);
      setInvoicePreviewUrl(invoiceUrl);
      setPreviewBill(bill);
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

  const deleteBill = async (billId: string) => {
    try {
      const success = await billStorageService.deleteBill(billId);
      if (success) {
        setBills(bills.filter(bill => bill.id !== billId));
        toast({
          title: 'Success',
          description: 'Bill deleted successfully',
        });
      } else {
        throw new Error('Failed to delete bill');
      }
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete bill',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Invoice Manager</h2>
          <p className="text-gray-600">
            {leadId ? `Managing invoices for ${lead?.name || 'Lead'}` : 'All invoices'}
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          <X className="h-4 w-4 mr-2" />
          Close
        </Button>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            Invoice Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template">Default Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
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
              <Label htmlFor="search">Search Bills</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search by bill number or date..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <Label>Company Information</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <Label htmlFor="company-gstin">GSTIN</Label>
                <Input
                  id="company-gstin"
                  value={companyInfo.gstin}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, gstin: e.target.value }))}
                  placeholder="Enter GSTIN"
                />
              </div>
              <div>
                <Label htmlFor="company-phone">Phone</Label>
                <Input
                  id="company-phone"
                  value={companyInfo.phone}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="company-email">Email</Label>
                <Input
                  id="company-email"
                  value={companyInfo.email}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bills List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5" />
            Bills & Invoices
          </CardTitle>
          <CardDescription>
            {filteredBills.length} bills found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading bills...</span>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No bills found</p>
              <p className="text-sm">Upload bills to generate invoices</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{bill.bill_number}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(bill.bill_date).toLocaleDateString()}</span>
                        <DollarSign className="h-3 w-3" />
                        <span>₹{bill.total_amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => previewInvoice(bill)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => generateInvoice(bill)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteBill(bill.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Preview Modal */}
      {showInvoicePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full h-5/6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Invoice Preview - {previewBill?.bill_number}
              </h3>
              <Button variant="outline" onClick={() => setShowInvoicePreview(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={invoicePreviewUrl || 'D:/CUSTOM CRM/scanbill-to-tally/public/logo'}
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

export default InvoiceManager; 