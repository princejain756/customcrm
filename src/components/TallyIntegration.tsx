import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { notificationService } from '@/lib/notification-service';
import { 
  Database, 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  X,
  FileText,
  Download,
  Upload,
  Server,
  Globe,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { TallyConfig, TallyInvoice } from '@/lib/types';

interface TallyIntegrationProps {
  onClose?: () => void;
  onInvoiceSynced?: (invoice: TallyInvoice) => void;
}

const TallyIntegration = ({ onClose, onInvoiceSynced }: TallyIntegrationProps) => {
  const [config, setConfig] = useState<TallyConfig>({
    company_name: '',
    server_url: 'localhost',
    port: 9000,
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const { toast } = useToast();

  // Mock invoices data
  const mockInvoices: TallyInvoice[] = [
    {
      id: '1',
      voucher_type: 'Sales',
      voucher_number: 'INV-001',
      date: '2024-01-15',
      party_ledger_name: 'ABC Company',
      amount: 25000,
      narration: 'Invoice for goods supplied',
      items: [
        {
          stock_item_name: 'Product A',
          quantity: 10,
          rate: 2000,
          amount: 20000,
          gst_rate: 18,
          gst_amount: 3600,
        },
        {
          stock_item_name: 'Product B',
          quantity: 5,
          rate: 1000,
          amount: 5000,
          gst_rate: 18,
          gst_amount: 900,
        },
      ],
    },
    {
      id: '2',
      voucher_type: 'Sales',
      voucher_number: 'INV-002',
      date: '2024-01-16',
      party_ledger_name: 'XYZ Corp',
      amount: 15000,
      narration: 'Invoice for services rendered',
      items: [
        {
          stock_item_name: 'Service A',
          quantity: 1,
          rate: 15000,
          amount: 15000,
          gst_rate: 18,
          gst_amount: 2700,
        },
      ],
    },
  ];

  const testConnection = async () => {
    setIsConnecting(true);
    setConnectionStatus('connecting');
    
    try {
      // Mock connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate connection success/failure
      const isSuccess = Math.random() > 0.3; // 70% success rate
      
      if (isSuccess) {
        setConnectionStatus('connected');
        
        // Add real notification for successful Tally connection
        notificationService.addRealNotification(
          'Tally Connected Successfully',
          'Successfully connected to Tally ERP. You can now sync invoices.',
          'success'
        );
        
        toast({
          title: 'Success',
          description: 'Successfully connected to Tally',
        });
      } else {
        setConnectionStatus('error');
        
        // Add error notification for failed Tally connection
        notificationService.addRealNotification(
          'Tally Connection Failed',
          'Unable to connect to Tally ERP. Please check your connection settings.',
          'error'
        );
        
        toast({
          title: 'Connection Failed',
          description: 'Unable to connect to Tally. Please check your settings.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      
      // Add error notification for connection test failure
      notificationService.addRealNotification(
        'Tally Connection Test Failed',
        'Connection test to Tally ERP failed. Please check your network and settings.',
        'error'
      );
      
      toast({
        title: 'Error',
        description: 'Connection test failed',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const syncInvoices = async () => {
    if (selectedInvoices.length === 0) {
      toast({
        title: 'No Invoices Selected',
        description: 'Please select invoices to sync',
        variant: 'destructive',
      });
      return;
    }

    setIsSyncing(true);
    try {
      // Mock sync process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Add real notification for successful Tally sync
      notificationService.addRealNotification(
        'Tally Sync Complete',
        `Successfully synced ${selectedInvoices.length} invoices to Tally ERP.`,
        'success'
      );
      
      toast({
        title: 'Sync Complete',
        description: `Successfully synced ${selectedInvoices.length} invoices to Tally`,
      });
      
      // Clear selection
      setSelectedInvoices([]);
      
    } catch (error) {
      // Add error notification for failed Tally sync
      notificationService.addRealNotification(
        'Tally Sync Failed',
        'Failed to sync invoices to Tally ERP. Please check your connection and try again.',
        'error'
      );
      
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync invoices to Tally',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const selectAllInvoices = () => {
    setSelectedInvoices(mockInvoices.map(invoice => invoice.id));
  };

  const deselectAllInvoices = () => {
    setSelectedInvoices([]);
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'connecting': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Failed';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                Tally Configuration
              </CardTitle>
              <CardDescription>
                Configure connection settings for Tally ERP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={config.company_name}
                  onChange={(e) => setConfig(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="Enter Tally company name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="server-url">Server URL</Label>
                  <Input
                    id="server-url"
                    value={config.server_url}
                    onChange={(e) => setConfig(prev => ({ ...prev, server_url: e.target.value }))}
                    placeholder="localhost"
                  />
                </div>
                <div>
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    type="number"
                    value={config.port}
                    onChange={(e) => setConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 9000 }))}
                    placeholder="9000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="username">Username (Optional)</Label>
                <Input
                  id="username"
                  value={config.username}
                  onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter username if required"
                />
              </div>

              <div>
                <Label htmlFor="password">Password (Optional)</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={config.password}
                    onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password if required"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button 
                  onClick={testConnection}
                  disabled={isConnecting}
                  className="flex-1"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Server className="h-4 w-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>
                <Badge className={getConnectionStatusColor()}>
                  {getConnectionStatusText()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Selection Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                Available Invoices
              </CardTitle>
              <CardDescription>
                Select invoices to sync with Tally
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={selectAllInvoices}>
                    Select All
                  </Button>
                  <Button size="sm" variant="outline" onClick={deselectAllInvoices}>
                    Deselect All
                  </Button>
                </div>
                <Badge variant="outline">
                  {selectedInvoices.length} selected
                </Badge>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {mockInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedInvoices.includes(invoice.id)
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleInvoiceSelection(invoice.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                                                 <input
                           type="checkbox"
                           checked={selectedInvoices.includes(invoice.id)}
                           onChange={() => toggleInvoiceSelection(invoice.id)}
                           className="rounded"
                           aria-label={`Select invoice ${invoice.voucher_number}`}
                         />
                        <div>
                          <p className="font-medium">{invoice.voucher_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {invoice.party_ledger_name} • ₹{invoice.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">₹{invoice.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{invoice.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={syncInvoices}
          disabled={isSyncing || selectedInvoices.length === 0 || connectionStatus !== 'connected'}
        >
          {isSyncing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Selected ({selectedInvoices.length})
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default TallyIntegration; 