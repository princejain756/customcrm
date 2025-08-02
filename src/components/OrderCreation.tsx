import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { notificationService } from '@/lib/notification-service';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  Calendar,
  Save,
  Plus,
  X,
  ShoppingCart,
  Package,
  DollarSign,
  Truck,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Download,
  Share2,
  Edit,
  Trash2,
  Eye,
  Printer
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  sku: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  gstin?: string;
}

const OrderCreation: React.FC = () => {
  // Order state
  const [orderData, setOrderData] = useState({
    orderNumber: '',
    customerId: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    status: 'draft',
    priority: 'medium',
    paymentTerms: 'net30',
    shippingAddress: '',
    billingAddress: '',
    notes: '',
    items: [] as OrderItem[],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Sample data
  const [products] = useState<Product[]>([
    { id: '1', name: 'Premium Laptop', description: 'High-performance laptop with latest specs', price: 75000, stock: 15, category: 'Electronics', sku: 'LAP-001' },
    { id: '2', name: 'Wireless Mouse', description: 'Ergonomic wireless mouse', price: 1200, stock: 50, category: 'Accessories', sku: 'ACC-002' },
    { id: '3', name: 'Office Chair', description: 'Comfortable office chair with lumbar support', price: 8500, stock: 8, category: 'Furniture', sku: 'FUR-003' },
    { id: '4', name: 'Monitor Stand', description: 'Adjustable monitor stand', price: 2500, stock: 25, category: 'Accessories', sku: 'ACC-004' },
    { id: '5', name: 'Desk Lamp', description: 'LED desk lamp with adjustable brightness', price: 1800, stock: 30, category: 'Lighting', sku: 'LIT-005' }
  ]);

  const [customers] = useState<Customer[]>([
    { id: '1', name: 'John Doe', email: 'john@example.com', phone: '+91 9876543210', company: 'Tech Solutions Ltd', address: '123 Business Park, Mumbai', gstin: 'GSTIN123456789' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '+91 9876543211', company: 'Digital Innovations', address: '456 Tech Street, Bangalore', gstin: 'GSTIN987654321' },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com', phone: '+91 9876543212', company: 'Startup Ventures', address: '789 Innovation Road, Delhi', gstin: 'GSTIN456789123' }
  ]);

  // Generate order number
  useEffect(() => {
    const generateOrderNumber = () => {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `ORD-${timestamp}-${random}`;
    };
    setOrderData(prev => ({ ...prev, orderNumber: generateOrderNumber() }));
  }, []);

  // Calculate totals
  useEffect(() => {
    const subtotal = orderData.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax - orderData.discount;
    
    setOrderData(prev => ({
      ...prev,
      subtotal,
      tax,
      total
    }));
  }, [orderData.items, orderData.discount]);

  const handleInputChange = (field: string, value: string | number) => {
    setOrderData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    setSelectedCustomer(customer || null);
    setOrderData(prev => ({
      ...prev,
      customerId,
      shippingAddress: customer?.address || '',
      billingAddress: customer?.address || ''
    }));
  };

  const addProductToOrder = (product: Product, quantity: number = 1) => {
    const existingItem = orderData.items.find(item => item.productId === product.id);
    
    if (existingItem) {
      const updatedItems = orderData.items.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + quantity, totalPrice: (item.quantity + quantity) * item.unitPrice }
          : item
      );
      setOrderData(prev => ({ ...prev, items: updatedItems }));
    } else {
      const newItem: OrderItem = {
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        totalPrice: product.price * quantity,
        discount: 0
      };
      setOrderData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    }
  };

  const updateOrderItem = (productId: string, field: string, value: number) => {
    const updatedItems = orderData.items.map(item =>
      item.productId === productId
        ? {
            ...item,
            [field]: value,
            totalPrice: field === 'quantity' || field === 'unitPrice' || field === 'discount'
              ? (field === 'quantity' ? value : item.quantity) * (field === 'unitPrice' ? value : item.unitPrice) - (field === 'discount' ? value : item.discount)
              : item.totalPrice
          }
        : item
    );
    setOrderData(prev => ({ ...prev, items: updatedItems }));
  };

  const removeOrderItem = (productId: string) => {
    setOrderData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.productId !== productId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!orderData.customerId) {
        throw new Error('Please select a customer');
      }
      if (orderData.items.length === 0) {
        throw new Error('Please add at least one product to the order');
      }

      console.log('Creating order:', orderData);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      notificationService.addRealNotification(
        'Order Created Successfully',
        `Order ${orderData.orderNumber} has been created and is ready for processing.`,
        'success'
      );
      
      alert('Order created successfully!');
    } catch (error) {
      console.error('Error creating order:', error);
      
      notificationService.addRealNotification(
        'Order Creation Failed',
        error instanceof Error ? error.message : 'There was an error creating the order. Please try again.',
        'error'
      );
      
      alert(error instanceof Error ? error.message : 'Error creating order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create New Order</h1>
          <p className="text-muted-foreground">Create and manage customer orders with products and pricing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Order Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Order Summary</CardTitle>
              <p className="text-sm text-muted-foreground">Order #{orderData.orderNumber}</p>
            </div>
            <div className="flex gap-2">
              <Badge className={getStatusColor(orderData.status)}>
                {orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}
              </Badge>
              <Badge className={getPriorityColor(orderData.priority)}>
                {orderData.priority.charAt(0).toUpperCase() + orderData.priority.slice(1)} Priority
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">₹{orderData.total.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Amount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{orderData.items.length}</div>
              <div className="text-sm text-muted-foreground">Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">₹{orderData.tax.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Tax (18% GST)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">₹{orderData.discount.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Discount</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Form */}
      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Order Details</TabsTrigger>
            <TabsTrigger value="customer">Customer</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="review">Review & Submit</TabsTrigger>
          </TabsList>

          {/* Order Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="orderNumber">Order Number</Label>
                      <Input
                        id="orderNumber"
                        value={orderData.orderNumber}
                        onChange={(e) => handleInputChange('orderNumber', e.target.value)}
                        placeholder="Auto-generated"
                      />
                    </div>
                    <div>
                      <Label htmlFor="orderDate">Order Date</Label>
                      <Input
                        id="orderDate"
                        type="date"
                        value={orderData.orderDate}
                        onChange={(e) => handleInputChange('orderDate', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deliveryDate">Delivery Date</Label>
                      <Input
                        id="deliveryDate"
                        type="date"
                        value={orderData.deliveryDate}
                        onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={orderData.status} onValueChange={(value) => handleInputChange('status', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={orderData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="paymentTerms">Payment Terms</Label>
                      <Select value={orderData.paymentTerms} onValueChange={(value) => handleInputChange('paymentTerms', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cod">Cash on Delivery</SelectItem>
                          <SelectItem value="net15">Net 15</SelectItem>
                          <SelectItem value="net30">Net 30</SelectItem>
                          <SelectItem value="net60">Net 60</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Addresses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="shippingAddress">Shipping Address</Label>
                    <Textarea
                      id="shippingAddress"
                      value={orderData.shippingAddress}
                      onChange={(e) => handleInputChange('shippingAddress', e.target.value)}
                      placeholder="Enter shipping address"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingAddress">Billing Address</Label>
                    <Textarea
                      id="billingAddress"
                      value={orderData.billingAddress}
                      onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                      placeholder="Enter billing address"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Order Notes</Label>
                    <Textarea
                      id="notes"
                      value={orderData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Add any special instructions or notes"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Customer Tab */}
          <TabsContent value="customer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Customer</CardTitle>
                <p className="text-sm text-muted-foreground">Choose an existing customer or create a new one</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customer">Customer</Label>
                  <Select value={orderData.customerId} onValueChange={handleCustomerSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} - {customer.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCustomer && (
                  <Card className="bg-gray-50">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Customer Name</Label>
                          <p className="text-sm">{selectedCustomer.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Company</Label>
                          <p className="text-sm">{selectedCustomer.company}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Email</Label>
                          <p className="text-sm">{selectedCustomer.email}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Phone</Label>
                          <p className="text-sm">{selectedCustomer.phone}</p>
                        </div>
                        <div className="md:col-span-2">
                          <Label className="text-sm font-medium">Address</Label>
                          <p className="text-sm">{selectedCustomer.address}</p>
                        </div>
                        {selectedCustomer.gstin && (
                          <div>
                            <Label className="text-sm font-medium">GSTIN</Label>
                            <p className="text-sm">{selectedCustomer.gstin}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Order Items</CardTitle>
                    <p className="text-sm text-muted-foreground">Add products to your order</p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setShowProductSearch(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {orderData.items.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No products added to order</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2"
                      onClick={() => setShowProductSearch(true)}
                    >
                      Add Your First Product
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderData.items.map((item) => (
                        <TableRow key={item.productId}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.productName}</div>
                              <div className="text-sm text-muted-foreground">
                                {products.find(p => p.id === item.productId)?.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {products.find(p => p.id === item.productId)?.sku}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateOrderItem(item.productId, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateOrderItem(item.productId, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.discount}
                              onChange={(e) => updateOrderItem(item.productId, 'discount', parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">₹{item.totalPrice.toLocaleString()}</div>
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOrderItem(item.productId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Product Search Modal */}
            {showProductSearch && (
              <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <CardContent className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Add Products to Order</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowProductSearch(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search products by name, description, or SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => (
                      <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{product.name}</h4>
                              <p className="text-sm text-muted-foreground">{product.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline">{product.category}</Badge>
                                <span className="text-sm text-muted-foreground">{product.sku}</span>
                              </div>
                              <div className="flex items-center justify-between mt-3">
                                <span className="font-medium">₹{product.price.toLocaleString()}</span>
                                <span className="text-sm text-muted-foreground">Stock: {product.stock}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            className="w-full mt-3"
                            onClick={() => {
                              addProductToOrder(product, 1);
                              setShowProductSearch(false);
                            }}
                            disabled={product.stock === 0}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add to Order
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Review Tab */}
          <TabsContent value="review" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{orderData.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (18% GST):</span>
                      <span>₹{orderData.tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-₹{orderData.discount.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span>₹{orderData.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Order Number:</span>
                      <p>{orderData.orderNumber}</p>
                    </div>
                    <div>
                      <span className="font-medium">Order Date:</span>
                      <p>{orderData.orderDate}</p>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <Badge className={getStatusColor(orderData.status)}>
                        {orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Priority:</span>
                      <Badge className={getPriorityColor(orderData.priority)}>
                        {orderData.priority.charAt(0).toUpperCase() + orderData.priority.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Payment Terms:</span>
                      <p>{orderData.paymentTerms.toUpperCase()}</p>
                    </div>
                    <div>
                      <span className="font-medium">Items:</span>
                      <p>{orderData.items.length} products</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('products')}
              >
                Back to Products
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || orderData.items.length === 0 || !orderData.customerId}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Creating Order...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Order
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
};

export default OrderCreation; 