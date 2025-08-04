import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { notificationService } from '@/lib/notification-service';
import { orderService } from '@/lib/order-service';
import type { Product, Customer, Order, CreateOrderRequest } from '@/lib/api-client';
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
  Printer,
  Copy,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Archive,
  MessageCircle,
  Bell,
  Star,
  Zap,
  Target,
  FileText,
  Calculator,
  Calendar as CalendarIcon,
  MapPin as LocationIcon,
  CreditCard,
  Percent,
  Layers,
  Users,
  Activity,
  PieChart,
  LineChart,
  Settings,
  History,
  BookOpen,
  Grid,
  List,
  SortAsc,
  SortDesc,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  ExternalLink,
  Upload,
  Bookmark,
  Flag,
  Tag,
  Hash,
  Paperclip,
  Scissors,
  Clipboard,
  Database,
  Gauge,
  Workflow,
  Shuffle,
  Route,
  Timer,
  FastForward,
  PlayCircle,
  PauseCircle,
  Square,
  Repeat,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Signal,
  Battery,
  Power,
  Plug,
  Cpu,
  HardDrive,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Server,
  Cloud,
  CloudUpload,
  CloudDownload,
  Folder,
  FolderOpen,
  File,
  FileImage,
  FileVideo,
  FileAudio,
  FilePlus,
  FileMinus,
  FileX,
  FileCheck,
  Lock,
  Unlock,
  Key,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  Users2,
  Crown,
  Award,
  Medal,
  Trophy,
  Gift,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  Meh,
  Angry,
  Laugh,
  Lightbulb,
  Brain,
  Zap as Lightning,
  Flame,
  Snowflake,
  Sun,
  Moon,
  Star as StarIcon,
  Sparkles,
  Camera,
  Minus
} from 'lucide-react';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  category: string;
  sku: string;
}

interface OrderTemplate {
  id: string;
  name: string;
  description: string;
  customerId: string;
  items: OrderItem[];
  isDefault: boolean;
}

interface OrderRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  priority: number;
  isActive: boolean;
}

interface OrderMetrics {
  totalOrders: number;
  totalValue: number;
  averageOrderValue: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  customerMetrics: { repeat: number; new: number };
  fulfillmentMetrics: { onTime: number; late: number; average: number };
}

interface OrderWorkflow {
  stage: string;
  status: string;
  timestamp: Date;
  user: string;
  notes?: string;
}

interface SmartSuggestion {
  type: 'product' | 'discount' | 'shipping' | 'upsell';
  title: string;
  description: string;
  action: () => void;
  confidence: number;
}

const OrderCreation: React.FC = () => {
  // Order state with enhanced features
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
    internalNotes: '',
    items: [] as OrderItem[],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    tags: [] as string[],
    assignedTo: '',
    estimatedFulfillmentTime: '',
    preferredShippingMethod: '',
    isRushOrder: false,
    requiresApproval: false,
    approvalStatus: 'pending',
    sourceChannel: 'web'
  });

  // Advanced UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showCustomerCreate, setShowCustomerCreate] = useState(false);
  const [showProductCreate, setShowProductCreate] = useState(false);
  const [showOrderTemplates, setShowOrderTemplates] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [showWhatsAppPreview, setShowWhatsAppPreview] = useState(false);
  const [recentWhatsAppNumbers, setRecentWhatsAppNumbers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterBy, setFilterBy] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Product creation specific state
  const [productImage, setProductImage] = useState<string | null>(null);
  const [isCapturingImage, setIsCapturingImage] = useState(false);
  const [imageInputRef, setImageInputRef] = useState<HTMLInputElement | null>(null);

  // Advanced features state
  const [orderTemplates, setOrderTemplates] = useState<OrderTemplate[]>([]);
  const [orderRules, setOrderRules] = useState<OrderRule[]>([]);
  const [orderMetrics, setOrderMetrics] = useState<OrderMetrics | null>(null);
  const [orderWorkflow, setOrderWorkflow] = useState<OrderWorkflow[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [orderProgress, setOrderProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Data state with enhanced caching
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Sample data removed - will load from API

  // Auto-save functionality
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (orderData.customerId || orderData.items.length > 0) {
        setAutoSaveStatus('saving');
        try {
          localStorage.setItem('orderDraft', JSON.stringify({
            ...orderData,
            lastSaved: new Date().toISOString()
          }));
          setAutoSaveStatus('saved');
          
          // Show auto-save notification only occasionally to avoid spam
          const lastNotification = localStorage.getItem('lastAutoSaveNotification');
          const now = Date.now();
          if (!lastNotification || now - parseInt(lastNotification) > 300000) { // 5 minutes
            notificationService.addRealNotification(
              'Auto-saved 💾',
              'Your order has been automatically saved',
              'success'
            );
            localStorage.setItem('lastAutoSaveNotification', now.toString());
          }
        } catch (error) {
          setAutoSaveStatus('error');
          console.error('Auto-save failed:', error);
        }
      }
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [orderData]);

  // Load data on component mount
  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const fetchedProducts = await orderService.getProducts();
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      notificationService.addRealNotification(
        'Error Loading Products',
        'Failed to load products. Please try again.',
        'error'
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const fetchedCustomers = await orderService.getCustomers();
      setCustomers(fetchedCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
      notificationService.addRealNotification(
        'Error Loading Customers',
        'Failed to load customers. Please try again.',
        'error'
      );
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Generate order number
  useEffect(() => {
    const generateOrderNumber = () => {
      return orderService.generateOrderNumber();
    };
    setOrderData(prev => ({ ...prev, orderNumber: generateOrderNumber() }));
  }, []);

  // Calculate totals using the service
  useEffect(() => {
    const totals = orderService.calculateOrderTotals(orderData.items);
    setOrderData(prev => ({
      ...prev,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total
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
        discount: 0,
        taxRate: 0.18, // Default 18% GST
        taxAmount: (product.price * quantity) * 0.18,
        category: product.category,
        sku: product.sku
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

  // Additional utility functions for order management
  const updateItemQuantity = (index: number, newQuantity: number) => {
    setOrderData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index 
          ? { 
              ...item, 
              quantity: Math.max(1, newQuantity),
              totalPrice: Math.max(1, newQuantity) * item.unitPrice
            }
          : item
      )
    }));
  };

  const updateItemPrice = (index: number, newPrice: number) => {
    setOrderData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index 
          ? { 
              ...item, 
              unitPrice: Math.max(0, newPrice),
              totalPrice: item.quantity * Math.max(0, newPrice)
            }
          : item
      )
    }));
  };

  const updateItemDiscount = (index: number, discountAmount: number) => {
    setOrderData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index 
          ? { 
              ...item, 
              discount: Math.max(0, discountAmount),
              totalPrice: (item.quantity * item.unitPrice) - Math.max(0, discountAmount)
            }
          : item
      )
    }));
  };

  const duplicateItem = (index: number) => {
    const itemToDuplicate = orderData.items[index];
    const duplicatedItem = {
      ...itemToDuplicate,
      productId: `${itemToDuplicate.productId}_copy_${Date.now()}`, // Make unique ID
    };
    
    setOrderData(prev => ({
      ...prev,
      items: [...prev.items, duplicatedItem]
    }));
    
    notificationService.addRealNotification(
      'Item Duplicated! 📋',
      `${itemToDuplicate.productName} has been duplicated in your order`,
      'success'
    );
  };

  const removeItem = (index: number) => {
    const itemToRemove = orderData.items[index];
    setOrderData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
    
    notificationService.addRealNotification(
      'Item Removed',
      `${itemToRemove.productName} has been removed from your order`,
      'info'
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate order data
      const validation = orderService.validateOrderData({
        customer_id: orderData.customerId,
        items: orderData.items.map(item => ({
          product_id: item.productId,
          product_sku: products.find(p => p.id === item.productId)?.sku || '',
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          discount: item.discount,
          tax_rate: 0.18
        }))
      });

      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Prepare order data for API
      const createOrderData: CreateOrderRequest = {
        customer_id: orderData.customerId,
        order_date: orderData.orderDate,
        delivery_date: orderData.deliveryDate || undefined,
        status: orderData.status,
        priority: orderData.priority,
        payment_terms: orderData.paymentTerms,
        shipping_address: orderData.shippingAddress || undefined,
        billing_address: orderData.billingAddress || undefined,
        notes: orderData.notes || undefined,
        items: orderData.items.map(item => ({
          product_id: item.productId,
          product_sku: products.find(p => p.id === item.productId)?.sku || '',
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          discount: item.discount,
          tax_rate: 0.18
        }))
      };

      console.log('Creating order:', createOrderData);
      const createdOrder = await orderService.createOrder(createOrderData);
      
      notificationService.addRealNotification(
        'Order Created Successfully',
        `Order ${createdOrder.order_number} has been created and is ready for processing.`,
        'success'
      );
      
      // Reset form or redirect
      setOrderData({
        orderNumber: orderService.generateOrderNumber(),
        customerId: '',
        orderDate: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        status: 'draft',
        priority: 'medium',
        paymentTerms: 'net30',
        shippingAddress: '',
        billingAddress: '',
        notes: '',
        internalNotes: '',
        items: [],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        tags: [],
        assignedTo: '',
        estimatedFulfillmentTime: '',
        preferredShippingMethod: '',
        isRushOrder: false,
        requiresApproval: false,
        approvalStatus: 'pending',
        sourceChannel: 'web'
      });
      setSelectedCustomer(null);
      setActiveTab('details');
      
    } catch (error) {
      console.error('Error creating order:', error);
      
      notificationService.addRealNotification(
        'Order Creation Failed',
        error instanceof Error ? error.message : 'There was an error creating the order. Please try again.',
        'error'
      );
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

  // Enhanced product search with advanced filtering
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterBy === 'all' || product.category === filterBy;
    
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    const aValue = sortBy === 'name' ? a.name : sortBy === 'price' ? a.price : a.stock;
    const bValue = sortBy === 'name' ? b.name : sortBy === 'price' ? b.price : b.stock;
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!orderData.customerId || orderData.items.length === 0) return;
    
    setAutoSaveStatus('saving');
    try {
      // Save draft to localStorage as backup
      localStorage.setItem('orderDraft', JSON.stringify(orderData));
      setAutoSaveStatus('saved');
    } catch (error) {
      setAutoSaveStatus('error');
    }
  }, [orderData]);

  // Load draft from localStorage
  const loadDraft = useCallback(() => {
    try {
      const draft = localStorage.getItem('orderDraft');
      if (draft) {
        const draftData = JSON.parse(draft);
        setOrderData(prev => ({ ...prev, ...draftData }));
        notificationService.addRealNotification(
          'Draft Loaded',
          'Previous order draft has been restored.',
          'success'
        );
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  }, []);

  // Smart suggestions based on customer history and current order
  const generateSmartSuggestions = useCallback(() => {
    const suggestions: SmartSuggestion[] = [];
    
    // Product recommendations based on frequently bought together
    if (orderData.items.length > 0) {
      suggestions.push({
        type: 'product',
        title: 'Frequently Bought Together',
        description: 'Add wireless headphones - 80% of customers who buy laptops also purchase this',
        action: () => {
          // Find a suggested product to add
          const suggestedProduct = products.find(p => 
            p.name.toLowerCase().includes('headphone') || 
            p.name.toLowerCase().includes('accessory')
          );
          
          if (suggestedProduct) {
            addProductToOrder(suggestedProduct, 1);
            notificationService.addRealNotification(
              'Product Added',
              `${suggestedProduct.name} has been added to your order.`,
              'success'
            );
          } else {
            setShowProductSearch(true);
            notificationService.addRealNotification(
              'Product Suggestion',
              'Opening product search to find suggested items.',
              'info'
            );
          }
        },
        confidence: 0.8
      });
    }

    // Discount suggestions
    if (orderData.total > 10000) {
      suggestions.push({
        type: 'discount',
        title: 'Volume Discount Available',
        description: 'Apply 5% discount for orders over ₹10,000',
        action: () => {
          setOrderData(prev => ({ ...prev, discount: prev.subtotal * 0.05 }));
        },
        confidence: 0.9
      });
    }

    // Shipping optimization
    if (orderData.total < 500) {
      suggestions.push({
        type: 'shipping',
        title: 'Free Shipping Opportunity',
        description: 'Add ₹' + (500 - orderData.total) + ' more for free shipping',
        action: () => {
          setShowProductSearch(true);
        },
        confidence: 0.7
      });
    }

    setSmartSuggestions(suggestions);
  }, [orderData]);

  // Bulk order operations
  const handleBulkQuantityUpdate = (multiplier: number) => {
    setOrderData(prev => ({
      ...prev,
      items: prev.items.map(item => ({
        ...item,
        quantity: Math.max(1, Math.floor(item.quantity * multiplier)),
        totalPrice: Math.max(1, Math.floor(item.quantity * multiplier)) * item.unitPrice
      }))
    }));
  };

  // Order template functionality
  const saveAsTemplate = () => {
    if (!orderData.customerId || orderData.items.length === 0) {
      notificationService.addRealNotification(
        'Cannot Save Template',
        'Please select a customer and add items to save as template.',
        'error'
      );
      return;
    }

    const template: OrderTemplate = {
      id: Date.now().toString(),
      name: `Template for ${selectedCustomer?.name || 'Customer'}`,
      description: `Order template with ${orderData.items.length} items`,
      customerId: orderData.customerId,
      items: orderData.items,
      isDefault: false
    };

    setOrderTemplates(prev => [...prev, template]);
    notificationService.addRealNotification(
      'Template Saved',
      'Order template has been saved successfully.',
      'success'
    );
  };

  const loadTemplate = (template: OrderTemplate) => {
    setOrderData(prev => ({
      ...prev,
      customerId: template.customerId,
      items: template.items
    }));
    setSelectedCustomer(customers.find(c => c.id === template.customerId) || null);
    setShowOrderTemplates(false);
  };

  // Image handling functions
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        notificationService.addRealNotification(
          'File Too Large',
          'Please select an image smaller than 5MB',
          'error'
        );
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProductImage(result);
        notificationService.addRealNotification(
          'Image Uploaded',
          'Product image uploaded successfully',
          'success'
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const captureImage = async () => {
    try {
      setIsCapturingImage(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera if available
      });
      
      // Create video element for preview
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // Create canvas to capture image
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Show camera preview modal
        const cameraModal = document.createElement('div');
        cameraModal.style.cssText = `
          position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
          background: rgba(0,0,0,0.8); display: flex; align-items: center; 
          justify-content: center; z-index: 9999;
        `;
        
        const cameraContainer = document.createElement('div');
        cameraContainer.style.cssText = `
          background: white; border-radius: 10px; padding: 20px; 
          text-align: center; max-width: 90%; max-height: 90%;
        `;
        
        video.style.cssText = 'max-width: 100%; max-height: 400px; border-radius: 10px;';
        
        const captureBtn = document.createElement('button');
        captureBtn.textContent = '📸 Capture Photo';
        captureBtn.style.cssText = `
          background: #3b82f6; color: white; border: none; 
          padding: 10px 20px; margin: 10px; border-radius: 5px; cursor: pointer;
        `;
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '❌ Cancel';
        cancelBtn.style.cssText = `
          background: #ef4444; color: white; border: none; 
          padding: 10px 20px; margin: 10px; border-radius: 5px; cursor: pointer;
        `;
        
        captureBtn.onclick = () => {
          context?.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = canvas.toDataURL('image/jpeg', 0.8);
          setProductImage(imageData);
          
          // Cleanup
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(cameraModal);
          setIsCapturingImage(false);
          
          notificationService.addRealNotification(
            'Photo Captured! 📸',
            'Product photo captured successfully',
            'success'
          );
        };
        
        cancelBtn.onclick = () => {
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(cameraModal);
          setIsCapturingImage(false);
        };
        
        cameraContainer.appendChild(video);
        cameraContainer.appendChild(document.createElement('br'));
        cameraContainer.appendChild(captureBtn);
        cameraContainer.appendChild(cancelBtn);
        cameraModal.appendChild(cameraContainer);
        document.body.appendChild(cameraModal);
      });
      
    } catch (error) {
      console.error('Camera access error:', error);
      setIsCapturingImage(false);
      notificationService.addRealNotification(
        'Camera Access Denied',
        'Unable to access camera. Please allow camera permissions or upload an image instead.',
        'error'
      );
    }
  };

  const removeProductImage = () => {
    setProductImage(null);
    if (imageInputRef) {
      imageInputRef.value = '';
    }
    notificationService.addRealNotification(
      'Image Removed',
      'Product image removed successfully',
      'success'
    );
  };

  // Quick actions
  const duplicateOrder = () => {
    const newOrderNumber = orderService.generateOrderNumber();
    setOrderData(prev => ({
      ...prev,
      orderNumber: newOrderNumber,
      status: 'draft',
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: ''
    }));
  };

  const applyPredefinedDiscount = (percentage: number) => {
    setOrderData(prev => ({
      ...prev,
      discount: (prev.subtotal * percentage) / 100
    }));
  };

  // Order validation with detailed feedback
  const validateOrder = () => {
    const errors: string[] = [];
    
    if (!orderData.customerId) errors.push('Customer selection is required');
    if (orderData.items.length === 0) errors.push('At least one item must be added');
    if (orderData.items.some(item => item.quantity <= 0)) errors.push('All items must have quantity greater than 0');
    if (orderData.items.some(item => item.unitPrice <= 0)) errors.push('All items must have valid unit price');
    if (orderData.isRushOrder && !orderData.deliveryDate) errors.push('Delivery date is required for rush orders');
    if (orderData.requiresApproval && !orderData.assignedTo) errors.push('Approval assignee is required');
    
    // Check stock availability
    orderData.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product && product.stock < item.quantity) {
        errors.push(`Insufficient stock for ${item.productName}. Available: ${product.stock}, Requested: ${item.quantity}`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Advanced analytics calculation
  const calculateAdvancedMetrics = () => {
    const itemCount = orderData.items.length;
    const uniqueCategories = new Set(orderData.items.map(item => item.category)).size;
    const averageItemValue = itemCount > 0 ? orderData.subtotal / itemCount : 0;
    const profitMargin = orderData.subtotal * 0.25; // Assuming 25% margin
    
    return {
      itemCount,
      uniqueCategories,
      averageItemValue,
      profitMargin,
      customerSegment: orderData.total > 50000 ? 'enterprise' : orderData.total > 10000 ? 'business' : 'standard'
    };
  };

  // Order progress calculation
  const calculateOrderProgress = () => {
    let progress = 0;
    if (orderData.customerId) progress += 25;
    if (orderData.items.length > 0) progress += 25;
    if (orderData.shippingAddress) progress += 20;
    if (orderData.billingAddress) progress += 20;
    if (orderData.deliveryDate) progress += 10;
    
    setOrderProgress(progress);
  };

  // Preview, Print, and Share functionality
  const previewOrder = () => {
    // Open order preview in a new window
    const previewData = {
      ...orderData,
      customer: selectedCustomer,
      items: orderData.items,
      createdAt: new Date().toISOString()
    };
    
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>Order Preview - ${orderData.orderNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
              .section { margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; }
              .total { font-weight: bold; font-size: 1.2em; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Order Preview</h1>
              <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
              <p><strong>Date:</strong> ${orderData.orderDate}</p>
              <p><strong>Customer:</strong> ${selectedCustomer?.name || 'Not selected'}</p>
            </div>
            
            <div class="section">
              <h2>Order Items</h2>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderData.items.map(item => `
                    <tr>
                      <td>${item.productName}</td>
                      <td>${item.quantity}</td>
                      <td>₹${item.unitPrice.toLocaleString()}</td>
                      <td>₹${item.totalPrice.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            
            <div class="section">
              <h2>Order Summary</h2>
              <p><strong>Subtotal:</strong> ₹${orderData.subtotal.toLocaleString()}</p>
              <p><strong>Tax:</strong> ₹${orderData.tax.toLocaleString()}</p>
              <p><strong>Discount:</strong> ₹${orderData.discount.toLocaleString()}</p>
              <p class="total"><strong>Total:</strong> ₹${orderData.total.toLocaleString()}</p>
            </div>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }
    
    notificationService.addRealNotification(
      'Preview Opened',
      'Order preview has been opened in a new window.',
      'success'
    );
  };

  const printOrder = () => {
    if (orderData.items.length === 0) {
      notificationService.addRealNotification(
        'Cannot Print',
        'Please add items to the order before printing.',
        'error'
      );
      return;
    }

    // Create a printable version
    const printContent = `
      <html>
        <head>
          <title>Order ${orderData.orderNumber}</title>
          <style>
            @media print {
              body { margin: 0; font-family: Arial, sans-serif; }
              .no-print { display: none; }
              .print-header { text-align: center; margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #000; padding: 8px; text-align: left; }
              th { background-color: #f0f0f0; }
              .total-section { margin-top: 20px; text-align: right; }
              .total { font-size: 18px; font-weight: bold; }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>ORDER INVOICE</h1>
            <h2>Order #${orderData.orderNumber}</h2>
            <p>Date: ${orderData.orderDate}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3>Customer Details:</h3>
            <p><strong>${selectedCustomer?.name || 'Customer Name'}</strong></p>
            <p>${selectedCustomer?.email || ''}</p>
            <p>${selectedCustomer?.phone || ''}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${orderData.items.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.sku}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.unitPrice.toLocaleString()}</td>
                  <td>₹${item.totalPrice.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total-section">
            <p>Subtotal: ₹${orderData.subtotal.toLocaleString()}</p>
            <p>Tax (18% GST): ₹${orderData.tax.toLocaleString()}</p>
            <p>Discount: -₹${orderData.discount.toLocaleString()}</p>
            <p class="total">Total: ₹${orderData.total.toLocaleString()}</p>
          </div>
          
          <div style="margin-top: 40px; text-align: center; font-size: 12px;">
            <p>Thank you for your business!</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }

    notificationService.addRealNotification(
      'Printing Order',
      'Order has been sent to printer.',
      'success'
    );
  };

  const shareOrder = async () => {
    if (orderData.items.length === 0) {
      notificationService.addRealNotification(
        'Cannot Share',
        'Please add items to the order before sharing.',
        'error'
      );
      return;
    }

    // Open share dialog to choose sharing method
    setShowShareDialog(true);
  };

  const getWhatsAppMessage = () => {
    return `🛒 *NEW ORDER DETAILS*

📧 *Order:* ${orderData.orderNumber}
👤 *Customer:* ${selectedCustomer?.name || 'Not selected'}
📅 *Date:* ${new Date(orderData.orderDate).toLocaleDateString('en-IN')}
⚡ *Priority:* ${orderData.priority.toUpperCase()}
💳 *Payment:* ${orderData.paymentTerms.toUpperCase()}

📦 *ITEMS (${orderData.items.length}):*
${orderData.items.map((item, index) => 
  `${index + 1}. *${item.productName}*
   → Qty: ${item.quantity} | Price: ₹${item.unitPrice.toLocaleString()}
   → Total: ₹${item.totalPrice.toLocaleString()}`
).join('\n\n')}

💰 *FINANCIAL SUMMARY:*
• Subtotal: ₹${orderData.subtotal.toLocaleString()}
• GST (18%): ₹${orderData.tax.toLocaleString()}
• Discount: -₹${orderData.discount.toLocaleString()}
• *GRAND TOTAL: ₹${orderData.total.toLocaleString()}*

${orderData.shippingAddress ? `🚚 *Shipping:*\n${orderData.shippingAddress}\n` : ''}
${orderData.notes ? `📝 *Notes:* ${orderData.notes}\n` : ''}

✨ *Thank you for your business!*
📞 Contact us for any queries.

---
_Generated from AutoCRM Dashboard_`;
  };

  const shareViaWhatsApp = () => {
    if (!whatsappNumber.trim()) {
      notificationService.addRealNotification(
        'Phone Number Required',
        'Please enter a WhatsApp number to share the order.',
        'error'
      );
      return;
    }

    // Clean the phone number (remove spaces, dashes, etc.)
    let cleanNumber = whatsappNumber.replace(/[^\d+]/g, '');
    
    // Add country code if not present
    if (!cleanNumber.startsWith('+')) {
      if (cleanNumber.startsWith('91') && cleanNumber.length === 12) {
        cleanNumber = '+' + cleanNumber;
      } else if (cleanNumber.length === 10 && /^[6-9]/.test(cleanNumber)) {
        cleanNumber = '+91' + cleanNumber;
      } else {
        cleanNumber = '+' + cleanNumber;
      }
    }
    
    // Validate phone number length
    if (cleanNumber.length < 10 || cleanNumber.length > 15) {
      notificationService.addRealNotification(
        'Invalid Phone Number',
        'Please enter a valid WhatsApp number.',
        'error'
      );
      return;
    }
    
    // Create WhatsApp message with emojis and formatting
    const message = `🛒 *NEW ORDER DETAILS*

📧 *Order:* ${orderData.orderNumber}
👤 *Customer:* ${selectedCustomer?.name || 'Not selected'}
📅 *Date:* ${new Date(orderData.orderDate).toLocaleDateString('en-IN')}
⚡ *Priority:* ${orderData.priority.toUpperCase()}
� *Payment:* ${orderData.paymentTerms.toUpperCase()}

📦 *ITEMS (${orderData.items.length}):*
${orderData.items.map((item, index) => 
  `${index + 1}. *${item.productName}*
   → Qty: ${item.quantity} | Price: ₹${item.unitPrice.toLocaleString()}
   → Total: ₹${item.totalPrice.toLocaleString()}`
).join('\n\n')}

💰 *FINANCIAL SUMMARY:*
• Subtotal: ₹${orderData.subtotal.toLocaleString()}
• GST (18%): ₹${orderData.tax.toLocaleString()}
• Discount: -₹${orderData.discount.toLocaleString()}
• *GRAND TOTAL: ₹${orderData.total.toLocaleString()}*

${orderData.shippingAddress ? `🚚 *Shipping:*\n${orderData.shippingAddress}\n` : ''}
${orderData.notes ? `📝 *Notes:* ${orderData.notes}\n` : ''}

✨ *Thank you for your business!*
📞 Contact us for any queries.

---
_Generated from AutoCRM Dashboard_`;

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Save to recent numbers
    const updatedRecent = [cleanNumber, ...recentWhatsAppNumbers.filter(num => num !== cleanNumber)].slice(0, 3);
    setRecentWhatsAppNumbers(updatedRecent);
    localStorage.setItem('recentWhatsAppNumbers', JSON.stringify(updatedRecent));
    
    // Close dialog and reset number
    setShowShareDialog(false);
    setWhatsappNumber('');
    
    notificationService.addRealNotification(
      'WhatsApp Opened',
      `Order details prepared for ${cleanNumber}. WhatsApp should open shortly.`,
      'success'
    );
  };

  const shareViaGeneral = async () => {
    const shareData = {
      title: `Order ${orderData.orderNumber}`,
      text: `Order for ${selectedCustomer?.name || 'Customer'} - Total: ₹${orderData.total.toLocaleString()}`,
      url: window.location.href
    };

    // Check if Web Share API is supported
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShowShareDialog(false);
        notificationService.addRealNotification(
          'Order Shared',
          'Order has been shared successfully.',
          'success'
        );
      } catch (error) {
        // User cancelled sharing or error occurred
        fallbackShare();
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      fallbackShare();
    }
  };

  const fallbackShare = () => {
    // Create shareable text
    const shareText = `Order #${orderData.orderNumber}
Customer: ${selectedCustomer?.name || 'Not selected'}
Items: ${orderData.items.length}
Total: ₹${orderData.total.toLocaleString()}
Date: ${orderData.orderDate}`;

    // Copy to clipboard
    navigator.clipboard.writeText(shareText).then(() => {
      setShowShareDialog(false);
      notificationService.addRealNotification(
        'Copied to Clipboard',
        'Order details have been copied to clipboard.',
        'success'
      );
    }).catch(() => {
      // Fallback if clipboard API is not available
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setShowShareDialog(false);
      notificationService.addRealNotification(
        'Copied to Clipboard',
        'Order details have been copied to clipboard.',
        'success'
      );
    });
  };

  // Data loading effects
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load products
        const productsResponse = await fetch('/api/products');
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setProducts(productsData.data || []);
        } else {
          // Fallback sample data for development
          setProducts([
            {
              id: '1',
              name: 'Wireless Bluetooth Headphones',
              description: 'High-quality wireless headphones with noise cancellation',
              price: 2999,
              sku: 'WBH-001',
              category: 'Electronics',
              stock: 50,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '2',
              name: 'Gaming Laptop',
              description: 'High-performance gaming laptop with RTX graphics',
              price: 89999,
              sku: 'GL-002',
              category: 'Computers',
              stock: 25,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '3',
              name: 'Wireless Mouse',
              description: 'Ergonomic wireless mouse with precision tracking',
              price: 1499,
              sku: 'WM-003',
              category: 'Accessories',
              stock: 100,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);
        }

        // Load customers  
        const customersResponse = await fetch('/api/customers');
        if (customersResponse.ok) {
          const customersData = await customersResponse.json();
          setCustomers(customersData.data || []);
        } else {
          // Fallback sample data for development
          setCustomers([
            {
              id: '1',
              name: 'John Doe',
              email: 'john.doe@example.com',
              phone: '+91 9876543210',
              address: '123 Main Street, Mumbai, Maharashtra 400001',
              company: 'Tech Solutions Pvt Ltd',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '2',
              name: 'Jane Smith',
              email: 'jane.smith@business.com',
              phone: '+91 8765432109',
              address: '456 Business Park, Bangalore, Karnataka 560001',
              company: 'Innovation Corp',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '3',
              name: 'Rajesh Kumar',
              email: 'rajesh.kumar@enterprise.in',
              phone: '+91 7654321098',
              address: '789 Corporate Center, Delhi, Delhi 110001',
              company: 'Global Enterprises',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        // Use sample data on error
        setProducts([
          {
            id: '1',
            name: 'Wireless Bluetooth Headphones',
            description: 'High-quality wireless headphones with noise cancellation',
            price: 2999,
            sku: 'WBH-001',
            category: 'Electronics',
            stock: 50,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Gaming Laptop',
            description: 'High-performance gaming laptop with RTX graphics',
            price: 89999,
            sku: 'GL-002',
            category: 'Computers',
            stock: 25,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
        
        setCustomers([
          {
            id: '1',
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+91 9876543210',
            address: '123 Main Street, Mumbai, Maharashtra 400001',
            company: 'Tech Solutions Pvt Ltd',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
        
        notificationService.addRealNotification(
          'Sample Data Loaded',
          'Using sample data for development. Connect to database for live data.',
          'info'
        );
      }
    };

    loadInitialData();
  }, []);

  // Enhanced effects
  useEffect(() => {
    calculateOrderProgress();
    generateSmartSuggestions();
  }, [orderData, generateSmartSuggestions]);

  useEffect(() => {
    const autoSaveInterval = setInterval(autoSave, 30000); // Auto-save every 30 seconds
    return () => clearInterval(autoSaveInterval);
  }, [autoSave]);

  useEffect(() => {
    loadDraft(); // Load draft on component mount
    
    // Load recent WhatsApp numbers
    const saved = localStorage.getItem('recentWhatsAppNumbers');
    if (saved) {
      setRecentWhatsAppNumbers(JSON.parse(saved));
    }
  }, [loadDraft]);

  // Keyboard shortcuts for WhatsApp sharing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'W') {
        e.preventDefault();
        if (orderData.items.length > 0) {
          shareOrder();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [orderData.items.length]);

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Progress and Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create New Order
            </h1>
            <Badge variant="outline" className="text-xs">
              {orderData.sourceChannel}
            </Badge>
            {orderData.isRushOrder && (
              <Badge variant="destructive" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Rush Order
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">Create and manage customer orders with advanced automation and intelligence</p>
          
          {/* Order Progress Bar */}
          <div className="flex items-center gap-2 mt-2">
            <Progress value={orderProgress} className="w-40" />
            <span className="text-sm text-muted-foreground">{orderProgress}% Complete</span>
            <div className="flex items-center gap-1 ml-2">
              {autoSaveStatus === 'saved' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {autoSaveStatus === 'saving' && <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />}
              {autoSaveStatus === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
              <span className="text-xs text-muted-foreground">
                {autoSaveStatus === 'saved' && 'Saved'}
                {autoSaveStatus === 'saving' && 'Saving...'}
                {autoSaveStatus === 'error' && 'Save Error'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Quick Action Buttons */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <BookOpen className="h-4 w-4 mr-2" />
                Templates
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Order Templates</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {orderTemplates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => loadTemplate(template)}>
                    <CardContent className="p-4">
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">{template.items.length} items</span>
                        {template.isDefault && <Star className="h-4 w-4 text-yellow-500" />}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={saveAsTemplate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Save Current as Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={duplicateOrder}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl">
              <DialogHeader>
                <DialogTitle>Order Analytics & Insights</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                {(() => {
                  const metrics = calculateAdvancedMetrics();
                  return (
                    <>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-blue-500" />
                            <div>
                              <p className="text-sm text-muted-foreground">Items</p>
                              <p className="text-2xl font-bold">{metrics.itemCount}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="text-sm text-muted-foreground">Categories</p>
                              <p className="text-2xl font-bold">{metrics.uniqueCategories}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-purple-500" />
                            <div>
                              <p className="text-sm text-muted-foreground">Avg Item Value</p>
                              <p className="text-2xl font-bold">₹{metrics.averageItemValue.toLocaleString()}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-orange-500" />
                            <div>
                              <p className="text-sm text-muted-foreground">Customer Segment</p>
                              <Badge variant="outline" className="text-xs">{metrics.customerSegment}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={previewOrder}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" size="sm" onClick={printOrder}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={shareOrder} title="Share Order (Ctrl+Shift+W)">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Share Order</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Choose how you want to share this order:
                </div>
                
                {/* WhatsApp Share Section */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">Share via WhatsApp</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp-number">WhatsApp Number</Label>
                    <div className="space-y-2">
                      <Input
                        id="whatsapp-number"
                        type="tel"
                        placeholder="+91 9876543210"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        className="font-mono"
                      />
                      {selectedCustomer?.phone && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setWhatsappNumber(selectedCustomer.phone || '')}
                          className="text-xs w-full justify-start"
                        >
                          <User className="h-3 w-3 mr-1" />
                          Use customer's number: {selectedCustomer.phone}
                        </Button>
                      )}
                      {recentWhatsAppNumbers.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Recent numbers:</div>
                          {recentWhatsAppNumbers.map((num, index) => (
                            <Button 
                              key={index}
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setWhatsappNumber(num)}
                              className="text-xs w-full justify-start font-mono"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {num}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Include country code (e.g., +91 for India). Indian numbers starting with 6-9 will automatically get +91.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => setShowWhatsAppPreview(true)}
                      className="flex-1"
                      disabled={!whatsappNumber.trim()}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Message
                    </Button>
                    <Button 
                      onClick={shareViaWhatsApp} 
                      className="flex-1 bg-green-500 hover:bg-green-600"
                      disabled={!whatsappNumber.trim()}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send to WhatsApp
                    </Button>
                  </div>
                </div>
                
                {/* Other Share Options */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Other Options</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      variant="outline" 
                      onClick={shareViaGeneral}
                      className="justify-start"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share via System
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={fallbackShare}
                      className="justify-start"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy to Clipboard
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Smart Suggestions Panel */}
      {smartSuggestions.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg text-blue-900">Smart Suggestions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {smartSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                  <div className="mt-1">
                    {suggestion.type === 'product' && <Package className="h-4 w-4 text-blue-500" />}
                    {suggestion.type === 'discount' && <Percent className="h-4 w-4 text-green-500" />}
                    {suggestion.type === 'shipping' && <Truck className="h-4 w-4 text-purple-500" />}
                    {suggestion.type === 'upsell' && <TrendingUp className="h-4 w-4 text-orange-500" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{suggestion.title}</h4>
                    <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Confidence:</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < suggestion.confidence * 5 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={suggestion.action} className="text-xs px-2 py-1">
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900">Please fix the following issues:</h4>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Order Summary Card */}
      <Card className="shadow-lg border-t-4 border-t-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
                Order Summary
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-muted-foreground">Order #{orderData.orderNumber}</p>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{orderData.orderDate}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(orderData.status)} variant="outline">
                <Activity className="h-3 w-3 mr-1" />
                {orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}
              </Badge>
              <Badge className={getPriorityColor(orderData.priority)} variant="outline">
                <Flag className="h-3 w-3 mr-1" />
                {orderData.priority.charAt(0).toUpperCase() + orderData.priority.slice(1)} Priority
              </Badge>
              {orderData.requiresApproval && (
                <Badge variant="outline" className="border-orange-300 text-orange-700">
                  <Shield className="h-3 w-3 mr-1" />
                  Requires Approval
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">₹{orderData.total.toLocaleString()}</div>
              <div className="text-sm text-blue-700 mt-1">Total Amount</div>
              <div className="text-xs text-blue-600 mt-1">
                {(() => {
                  const metrics = calculateAdvancedMetrics();
                  return `${metrics.customerSegment} segment`;
                })()}
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{orderData.items.length}</div>
              <div className="text-sm text-green-700 mt-1">Items</div>
              <div className="text-xs text-green-600 mt-1">
                {new Set(orderData.items.map(item => item.category)).size} categories
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">₹{orderData.tax.toLocaleString()}</div>
              <div className="text-sm text-orange-700 mt-1">Tax (18% GST)</div>
              <div className="text-xs text-orange-600 mt-1">
                {((orderData.tax / orderData.subtotal) * 100 || 0).toFixed(1)}% of subtotal
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">₹{orderData.discount.toLocaleString()}</div>
              <div className="text-sm text-purple-700 mt-1">Discount</div>
              <div className="text-xs text-purple-600 mt-1">
                {((orderData.discount / orderData.subtotal) * 100 || 0).toFixed(1)}% savings
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
              <div className="text-3xl font-bold text-gray-600">
                {(() => {
                  const metrics = calculateAdvancedMetrics();
                  return '₹' + metrics.profitMargin.toLocaleString();
                })()}
              </div>
              <div className="text-sm text-gray-700 mt-1">Est. Profit</div>
              <div className="text-xs text-gray-600 mt-1">~25% margin</div>
            </div>
          </div>
          
          {/* Quick Actions Row */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={orderData.isRushOrder}
                  onCheckedChange={(checked) => setOrderData(prev => ({ ...prev, isRushOrder: checked }))}
                />
                <Label className="text-sm">Rush Order</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={orderData.requiresApproval}
                  onCheckedChange={(checked) => setOrderData(prev => ({ ...prev, requiresApproval: checked }))}
                />
                <Label className="text-sm">Requires Approval</Label>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => applyPredefinedDiscount(5)}>
                <Percent className="h-4 w-4 mr-1" />
                5% Discount
              </Button>
              <Button variant="outline" size="sm" onClick={() => applyPredefinedDiscount(10)}>
                <Percent className="h-4 w-4 mr-1" />
                10% Discount
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkQuantityUpdate(2)}>
                <ArrowUp className="h-4 w-4 mr-1" />
                Double Qty
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Form */}
      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Order Details
            </TabsTrigger>
            <TabsTrigger value="customer" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customer
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Advanced
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Review & Submit
            </TabsTrigger>
          </TabsList>

          {/* Enhanced Order Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="orderNumber">Order Number</Label>
                      <div className="flex gap-2">
                        <Input
                          id="orderNumber"
                          value={orderData.orderNumber}
                          onChange={(e) => handleInputChange('orderNumber', e.target.value)}
                          placeholder="Auto-generated"
                        />
                        <Button variant="outline" size="sm" onClick={() => setOrderData(prev => ({ ...prev, orderNumber: orderService.generateOrderNumber() }))}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="sourceChannel">Source Channel</Label>
                      <Select value={orderData.sourceChannel} onValueChange={(value) => handleInputChange('sourceChannel', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="web">Website</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="in-person">In Person</SelectItem>
                          <SelectItem value="mobile-app">Mobile App</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="orderDate">Order Date</Label>
                      <Input
                        id="orderDate"
                        type="date"
                        value={orderData.orderDate}
                        onChange={(e) => handleInputChange('orderDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="deliveryDate">Delivery Date</Label>
                      <Input
                        id="deliveryDate"
                        type="date"
                        value={orderData.deliveryDate}
                        onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                          <SelectItem value="prepaid">Prepaid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="assignedTo">Assigned To</Label>
                      <Select value={orderData.assignedTo} onValueChange={(value) => handleInputChange('assignedTo', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales-team">Sales Team</SelectItem>
                          <SelectItem value="fulfillment">Fulfillment Team</SelectItem>
                          <SelectItem value="manager">Manager Review</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LocationIcon className="h-5 w-5" />
                    Addresses & Logistics
                  </CardTitle>
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
                    <div className="flex gap-2">
                      <Textarea
                        id="billingAddress"
                        value={orderData.billingAddress}
                        onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                        placeholder="Enter billing address"
                        rows={3}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOrderData(prev => ({ ...prev, billingAddress: prev.shippingAddress }))}
                        className="mt-2"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="preferredShippingMethod">Preferred Shipping Method</Label>
                    <Select value={orderData.preferredShippingMethod} onValueChange={(value) => handleInputChange('preferredShippingMethod', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select shipping method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard Delivery (3-5 days)</SelectItem>
                        <SelectItem value="express">Express Delivery (1-2 days)</SelectItem>
                        <SelectItem value="overnight">Overnight Delivery</SelectItem>
                        <SelectItem value="pickup">Customer Pickup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="estimatedFulfillmentTime">Estimated Fulfillment Time</Label>
                    <Input
                      id="estimatedFulfillmentTime"
                      value={orderData.estimatedFulfillmentTime}
                      onChange={(e) => handleInputChange('estimatedFulfillmentTime', e.target.value)}
                      placeholder="e.g., 2-3 business days"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Notes & Comments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="notes">Customer Notes</Label>
                    <Textarea
                      id="notes"
                      value={orderData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Add notes for the customer"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="internalNotes">Internal Notes</Label>
                    <Textarea
                      id="internalNotes"
                      value={orderData.internalNotes}
                      onChange={(e) => handleInputChange('internalNotes', e.target.value)}
                      placeholder="Add internal notes (not visible to customer)"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags & Categories
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Order Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {orderData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setOrderData(prev => ({ 
                              ...prev, 
                              tags: prev.tags.filter((_, i) => i !== index) 
                            }))} 
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Input 
                        placeholder="Add tag..." 
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const value = e.currentTarget.value.trim();
                            if (value && !orderData.tags.includes(value)) {
                              setOrderData(prev => ({ ...prev, tags: [...prev.tags, value] }));
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const commonTags = ['urgent', 'bulk-order', 'repeat-customer', 'new-customer', 'wholesale'];
                          const randomTag = commonTags[Math.floor(Math.random() * commonTags.length)];
                          if (!orderData.tags.includes(randomTag)) {
                            setOrderData(prev => ({ ...prev, tags: [...prev.tags, randomTag] }));
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Enhanced Customer Tab */}
          <TabsContent value="customer" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Select Customer</CardTitle>
                    <p className="text-sm text-muted-foreground">Choose an existing customer or create a new one</p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setShowCustomerCreate(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Customer
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customer">Customer</Label>
                  <Select value={orderData.customerId} onValueChange={handleCustomerSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingCustomers ? "Loading customers..." : "Select a customer"} />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingCustomers ? (
                        <SelectItem value="loading" disabled>Loading customers...</SelectItem>
                      ) : customers.length === 0 ? (
                        <SelectItem value="no-customers" disabled>No customers found - Create your first customer</SelectItem>
                      ) : (
                        customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{customer.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {customer.company || 'No Company'} • {customer.email}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCustomer && (
                  <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Customer Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium text-blue-900">Customer Name</Label>
                            <p className="text-sm bg-white p-2 rounded border">{selectedCustomer.name}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-blue-900">Company</Label>
                            <p className="text-sm bg-white p-2 rounded border">{selectedCustomer.company || 'No Company'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-blue-900">Email</Label>
                            <div className="flex items-center gap-2">
                              <p className="text-sm bg-white p-2 rounded border flex-1">{selectedCustomer.email}</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  window.open(`mailto:${selectedCustomer.email}`, '_blank');
                                }}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium text-blue-900">Phone</Label>
                            <div className="flex items-center gap-2">
                              <p className="text-sm bg-white p-2 rounded border flex-1">{selectedCustomer.phone}</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  window.open(`tel:${selectedCustomer.phone}`, '_blank');
                                }}
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-blue-900">GSTIN</Label>
                            <p className="text-sm bg-white p-2 rounded border">{selectedCustomer.gstin || 'Not provided'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-blue-900">Customer Since</Label>
                            <p className="text-sm bg-white p-2 rounded border">
                              {new Date(selectedCustomer.created_at).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <Label className="text-sm font-medium text-blue-900">Address</Label>
                          <p className="text-sm bg-white p-2 rounded border">{selectedCustomer.address}</p>
                        </div>
                      </div>
                      
                      {/* Customer Quick Actions */}
                      <div className="flex gap-2 mt-4 pt-4 border-t border-blue-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setOrderData(prev => ({ ...prev, shippingAddress: selectedCustomer.address }));
                            notificationService.addRealNotification(
                              'Address Copied',
                              'Customer address copied to shipping address',
                              'success'
                            );
                          }}
                        >
                          <MapPin className="h-4 w-4 mr-1" />
                          Use as Shipping
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setOrderData(prev => ({ ...prev, billingAddress: selectedCustomer.address }));
                            notificationService.addRealNotification(
                              'Address Copied',
                              'Customer address copied to billing address',
                              'success'
                            );
                          }}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Use as Billing
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Show customer order history
                            notificationService.addRealNotification(
                              'Feature Coming Soon',
                              'Customer order history will be available soon',
                              'info'
                            );
                          }}
                        >
                          <History className="h-4 w-4 mr-1" />
                          Order History
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* AI Customer Insights */}
            {selectedCustomer && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-green-900">
                    <Brain className="h-5 w-5" />
                    AI Customer Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-sm">Customer Segment</span>
                      </div>
                      <p className="text-lg font-bold text-green-700">
                        {orderData.total > 50000 ? 'Enterprise' : orderData.total > 10000 ? 'Business' : 'Standard'}
                      </p>
                      <p className="text-xs text-green-600">Based on order value</p>
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span className="font-medium text-sm">Loyalty Score</span>
                      </div>
                      <p className="text-lg font-bold text-green-700">8.5/10</p>
                      <p className="text-xs text-green-600">High-value customer</p>
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-sm">Recommended Action</span>
                      </div>
                      <p className="text-sm font-medium text-green-700">Offer premium support</p>
                      <p className="text-xs text-green-600">VIP treatment suggested</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Customer Creation Modal */}
          {showCustomerCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader className="border-b bg-gradient-to-r from-green-50 to-blue-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Create New Customer</CardTitle>
                      <p className="text-sm text-muted-foreground">Add a new customer to your AutoCRM</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCustomerCreate(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <form className="space-y-4" onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const newCustomer = {
                      id: Date.now().toString(),
                      name: formData.get('name') as string,
                      email: formData.get('email') as string,
                      phone: formData.get('phone') as string,
                      company: formData.get('company') as string,
                      address: formData.get('address') as string,
                      gstin: formData.get('gstin') as string,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    };
                    
                    setCustomers(prev => [...prev, newCustomer]);
                    setOrderData(prev => ({ ...prev, customerId: newCustomer.id }));
                    setSelectedCustomer(newCustomer);
                    setShowCustomerCreate(false);
                    
                    notificationService.addRealNotification(
                      'Customer Created',
                      `${newCustomer.name} has been added to your customers`,
                      'success'
                    );
                  }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Customer Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          required
                          placeholder="Enter customer name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          placeholder="customer@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="+91 9876543210"
                        />
                      </div>
                      <div>
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          name="company"
                          placeholder="Company name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="gstin">GSTIN</Label>
                        <Input
                          id="gstin"
                          name="gstin"
                          placeholder="GST registration number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customerType">Customer Type</Label>
                        <Select name="customerType" defaultValue="individual">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individual">Individual</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                          id="address"
                          name="address"
                          placeholder="Complete address with pincode"
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCustomerCreate(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-green-600 hover:bg-green-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Customer
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

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

            {/* Enhanced Product Search Modal */}
            {showProductSearch && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
                  <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowProductSearch(false)}
                          className="flex items-center gap-2"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Back to Order
                        </Button>
                        <div>
                          <h3 className="text-xl font-semibold">Add Products to Order</h3>
                          <p className="text-sm text-muted-foreground">Search and add products with intelligent suggestions</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowProductSearch(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {/* Enhanced Search and Filters */}
                    <div className="mb-6 space-y-4">
                      <div className="flex gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search products by name, description, SKU, or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowProductCreate(true)}
                          className="flex items-center gap-2 whitespace-nowrap"
                        >
                          <Plus className="h-4 w-4" />
                          Create Product
                        </Button>
                      </div>
                      
                      <div className="flex gap-4 items-center">
                        <Select value={filterBy} onValueChange={setFilterBy}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filter by category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="Electronics">Electronics</SelectItem>
                            <SelectItem value="Computers">Computers</SelectItem>
                            <SelectItem value="Accessories">Accessories</SelectItem>
                            <SelectItem value="Software">Software</SelectItem>
                            <SelectItem value="Hardware">Hardware</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="price">Price</SelectItem>
                            <SelectItem value="stock">Stock</SelectItem>
                            <SelectItem value="popularity">Popularity</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        >
                          {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                        </Button>
                        
                        <div className="flex gap-1">
                          <Button
                            variant={viewMode === 'grid' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                          >
                            <Grid className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={viewMode === 'list' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                          >
                            <List className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* AI-Powered Smart Suggestions */}
                    {searchQuery.length === 0 && orderData.items.length > 0 && (
                      <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <Brain className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-lg text-blue-900">AI Smart Suggestions</CardTitle>
                            <Badge variant="outline" className="bg-white">Powered by AI</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {/* Frequently Bought Together */}
                            <div className="p-3 bg-white rounded-lg border border-blue-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-4 w-4 text-purple-500" />
                                <span className="font-medium text-sm">Frequently Bought Together</span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                Based on {orderData.items.length > 0 ? orderData.items[0].productName : 'current items'}
                              </p>
                              <div className="space-y-1">
                                {filteredProducts.slice(0, 2).map((product) => (
                                  <Button
                                    key={product.id}
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start text-xs h-8"
                                    onClick={() => {
                                      addProductToOrder(product, 1);
                                      notificationService.addRealNotification(
                                        'Smart Suggestion Applied',
                                        `${product.name} added to order`,
                                        'success'
                                      );
                                    }}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    {product.name}
                                  </Button>
                                ))}
                              </div>
                            </div>

                            {/* Seasonal Recommendations */}
                            <div className="p-3 bg-white rounded-lg border border-green-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Sun className="h-4 w-4 text-orange-500" />
                                <span className="font-medium text-sm">Seasonal Trending</span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                Popular this month (August 2025)
                              </p>
                              <div className="space-y-1">
                                {filteredProducts.filter(p => p.category === 'Electronics').slice(0, 2).map((product) => (
                                  <Button
                                    key={product.id}
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start text-xs h-8"
                                    onClick={() => {
                                      addProductToOrder(product, 1);
                                      notificationService.addRealNotification(
                                        'Trending Item Added',
                                        `${product.name} added to order`,
                                        'success'
                                      );
                                    }}
                                  >
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    {product.name}
                                  </Button>
                                ))}
                              </div>
                            </div>

                            {/* Customer History Based */}
                            <div className="p-3 bg-white rounded-lg border border-purple-200">
                              <div className="flex items-center gap-2 mb-2">
                                <History className="h-4 w-4 text-purple-500" />
                                <span className="font-medium text-sm">Customer Favorites</span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                {selectedCustomer ? `Based on ${selectedCustomer.name}'s history` : 'Popular items'}
                              </p>
                              <div className="space-y-1">
                                {filteredProducts.slice(-2).map((product) => (
                                  <Button
                                    key={product.id}
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start text-xs h-8"
                                    onClick={() => {
                                      addProductToOrder(product, 1);
                                      notificationService.addRealNotification(
                                        'Customer Favorite Added',
                                        `${product.name} added to order`,
                                        'success'
                                      );
                                    }}
                                  >
                                    <Heart className="h-3 w-3 mr-1" />
                                    {product.name}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Product Grid/List */}
                    <div className={viewMode === 'grid' ? 
                      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : 
                      "space-y-2"
                    }>
                      {loadingProducts ? (
                        <div className="col-span-full text-center py-8">
                          <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
                          <div className="text-gray-500">Loading products...</div>
                        </div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="col-span-full text-center py-8">
                          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <div className="text-gray-500 mb-2">No products found</div>
                          <p className="text-sm text-muted-foreground mb-4">
                            Try adjusting your search criteria or create a new product
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => setShowProductCreate(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create New Product
                          </Button>
                        </div>
                      ) : viewMode === 'grid' ? (
                        filteredProducts.map((product) => (
                          <Card key={product.id} className="group hover:shadow-lg transition-all duration-200 hover:scale-105">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div>
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-medium text-sm leading-tight">{product.name}</h4>
                                    <Badge 
                                      variant={product.stock > 10 ? "default" : product.stock > 0 ? "secondary" : "destructive"}
                                      className="text-xs"
                                    >
                                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline" className="text-xs">{product.category}</Badge>
                                    <span className="text-xs text-muted-foreground">{product.sku}</span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-lg text-blue-600">₹{product.price.toLocaleString()}</span>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => addProductToOrder(product, 1)}
                                      disabled={product.stock === 0}
                                      className="text-xs px-2"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => {
                                        addProductToOrder(product, 1);
                                        notificationService.addRealNotification(
                                          'Product Added',
                                          `${product.name} added to order`,
                                          'success'
                                        );
                                      }}
                                      disabled={product.stock === 0}
                                      className="text-xs px-3"
                                    >
                                      Add to Order
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        filteredProducts.map((product) => (
                          <Card key={product.id} className="group hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium">{product.name}</h4>
                                      <Badge variant="outline" className="text-xs">{product.category}</Badge>
                                      <span className="text-xs text-muted-foreground">{product.sku}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-lg text-blue-600">₹{product.price.toLocaleString()}</div>
                                    <Badge 
                                      variant={product.stock > 10 ? "default" : product.stock > 0 ? "secondary" : "destructive"}
                                      className="text-xs mt-1"
                                    >
                                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addProductToOrder(product, 1)}
                                    disabled={product.stock === 0}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Advanced Features Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Workflow className="h-5 w-5" />
                    Workflow & Automation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-approve if total &lt; ₹5,000</Label>
                      <p className="text-sm text-muted-foreground">Automatically approve small orders</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Send customer notifications</Label>
                      <p className="text-sm text-muted-foreground">Email updates on order status</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-generate invoice</Label>
                      <p className="text-sm text-muted-foreground">Create invoice upon order confirmation</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Stock reservation</Label>
                      <p className="text-sm text-muted-foreground">Reserve inventory for this order</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Pricing & Discounts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Bulk Discount Rules</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={() => applyPredefinedDiscount(5)}>
                        5% (₹10K+)
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => applyPredefinedDiscount(10)}>
                        10% (₹25K+)
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => applyPredefinedDiscount(15)}>
                        15% (₹50K+)
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => applyPredefinedDiscount(20)}>
                        20% (₹1L+)
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Custom Discount</Label>
                    <div className="flex gap-2 mt-2">
                      <Input 
                        type="number" 
                        placeholder="Amount or %" 
                        className="flex-1"
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setOrderData(prev => ({ ...prev, discount: value }));
                        }}
                      />
                      <Button variant="outline" size="sm">Apply</Button>
                    </div>
                  </div>

                  <div>
                    <Label>Tax Configuration</Label>
                    <Select defaultValue="18">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Tax Exempt</SelectItem>
                        <SelectItem value="5">5% (Essential goods)</SelectItem>
                        <SelectItem value="12">12% (Standard goods)</SelectItem>
                        <SelectItem value="18">18% (Most goods)</SelectItem>
                        <SelectItem value="28">28% (Luxury goods)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Route className="h-5 w-5" />
                    Fulfillment Rules
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Warehouse Selection</Label>
                    <Select defaultValue="auto">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-select (Closest)</SelectItem>
                        <SelectItem value="main">Main Warehouse</SelectItem>
                        <SelectItem value="delhi">Delhi Warehouse</SelectItem>
                        <SelectItem value="mumbai">Mumbai Warehouse</SelectItem>
                        <SelectItem value="bangalore">Bangalore Warehouse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Split Shipment Rules</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center gap-2">
                        <input type="radio" id="no-split" name="split" defaultChecked />
                        <Label htmlFor="no-split">Ship together when all items available</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="radio" id="partial-split" name="split" />
                        <Label htmlFor="partial-split">Allow partial shipments</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="radio" id="customer-choice" name="split" />
                        <Label htmlFor="customer-choice">Ask customer preference</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications & Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Customer Notifications</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Order confirmation</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Shipping notification</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Delivery confirmation</span>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Internal Alerts</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Large order alert (₹50K+)</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Stock level warnings</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Approval required alerts</span>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Order Composition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orderData.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-blue-${(index * 100 + 400) % 900}`}></div>
                          <span className="text-sm">{item.productName}</span>
                        </div>
                        <span className="text-sm font-medium">
                          {((item.totalPrice / orderData.subtotal) * 100 || 0).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Value Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>₹{orderData.subtotal.toLocaleString()}</span>
                      </div>
                      <Progress value={(orderData.subtotal / orderData.total) * 100} className="mt-1" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Tax (18%)</span>
                        <span>₹{orderData.tax.toLocaleString()}</span>
                      </div>
                      <Progress value={(orderData.tax / orderData.total) * 100} className="mt-1" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Discount</span>
                        <span>-₹{orderData.discount.toLocaleString()}</span>
                      </div>
                      <Progress value={(orderData.discount / orderData.total) * 100} className="mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(() => {
                      const metrics = calculateAdvancedMetrics();
                      return (
                        <>
                          <div>
                            <Label className="text-sm text-muted-foreground">Customer Segment</Label>
                            <Badge variant="outline" className="mt-1 w-full justify-center">
                              {metrics.customerSegment.toUpperCase()}
                            </Badge>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Average Item Value</Label>
                            <p className="text-2xl font-bold">₹{metrics.averageItemValue.toLocaleString()}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Estimated Profit</Label>
                            <p className="text-2xl font-bold text-green-600">₹{metrics.profitMargin.toLocaleString()}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Real-time Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Gauge className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{orderProgress}%</div>
                    <div className="text-sm text-blue-700">Completion</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">
                      {orderData.isRushOrder ? '1-2' : '3-5'}
                    </div>
                    <div className="text-sm text-green-700">Days to Ship</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Package className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">
                      {orderData.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </div>
                    <div className="text-sm text-purple-700">Total Units</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-600">A+</div>
                    <div className="text-sm text-orange-700">Order Grade</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Enhanced Review Tab */}
          <TabsContent value="review" className="space-y-6">
            {/* Validation Summary */}
            <Card className={validationErrors.length > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
              <CardHeader>
                <CardTitle className={`text-lg flex items-center gap-2 ${validationErrors.length > 0 ? 'text-red-900' : 'text-green-900'}`}>
                  {validationErrors.length > 0 ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : (
                    <CheckCircle className="h-5 w-5" />
                  )}
                  Order Validation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {validationErrors.length > 0 ? (
                  <div>
                    <p className="text-red-700 font-medium mb-2">Please fix the following issues before submitting:</p>
                    <ul className="text-red-600 text-sm list-disc list-inside space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-green-700">All validations passed! Order is ready for submission.</p>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
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
                      <span className="font-medium">Customer:</span>
                      <p>{selectedCustomer?.name || 'Not selected'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Source:</span>
                      <p>{orderData.sourceChannel}</p>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <Badge className={getStatusColor(orderData.status)} variant="outline">
                        {orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Priority:</span>
                      <Badge className={getPriorityColor(orderData.priority)} variant="outline">
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

                  {orderData.tags.length > 0 && (
                    <div>
                      <span className="font-medium text-sm">Tags:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {orderData.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Financial Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Subtotal:</span>
                      <span className="font-medium">₹{orderData.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Tax (18% GST):</span>
                      <span className="font-medium">₹{orderData.tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Discount:</span>
                      <span className="font-medium text-green-600">-₹{orderData.discount.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-bold">Total:</span>
                      <span className="font-bold text-blue-600">₹{orderData.total.toLocaleString()}</span>
                    </div>
                  </div>

                  {(() => {
                    const metrics = calculateAdvancedMetrics();
                    return (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-sm mb-2">Business Metrics</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Estimated Profit:</span>
                            <span className="font-medium text-green-600">₹{metrics.profitMargin.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Customer Segment:</span>
                            <Badge variant="outline" className="text-xs">{metrics.customerSegment}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Average Item Value:</span>
                            <span>₹{metrics.averageItemValue.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

            {/* Order Items Review */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items ({orderData.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orderData.items.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No items added to order</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Discount</TableHead>
                          <TableHead>Tax</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderData.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.productName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {products.find(p => p.id === item.productId)?.description}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{item.sku}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{item.quantity}</TableCell>
                            <TableCell>₹{item.unitPrice.toLocaleString()}</TableCell>
                            <TableCell className="text-green-600">₹{item.discount.toLocaleString()}</TableCell>
                            <TableCell>₹{item.taxAmount.toLocaleString()}</TableCell>
                            <TableCell className="font-medium">₹{item.totalPrice.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Addresses Review */}
            {(orderData.shippingAddress || orderData.billingAddress) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {orderData.shippingAddress && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        Shipping Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-line">{orderData.shippingAddress}</p>
                      {orderData.preferredShippingMethod && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {orderData.preferredShippingMethod}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {orderData.billingAddress && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Billing Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-line">{orderData.billingAddress}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('products')}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Products
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    validateOrder();
                    if (validationErrors.length === 0) {
                      notificationService.addRealNotification(
                        'Validation Passed',
                        'Order is ready for submission!',
                        'success'
                      );
                    }
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Validate Order
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={saveAsTemplate}
                  disabled={!orderData.customerId || orderData.items.length === 0}
                >
                  <Bookmark className="h-4 w-4 mr-2" />
                  Save as Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Draft save functionality
                    localStorage.setItem('orderDraft', JSON.stringify(orderData));
                    notificationService.addRealNotification(
                      'Draft Saved',
                      'Order has been saved as draft.',
                      'success'
                    );
                  }}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || validationErrors.length > 0 || orderData.items.length === 0 || !orderData.customerId}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={() => {
                    if (validateOrder()) {
                      handleSubmit({ preventDefault: () => {} } as any);
                    }
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating Order...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create Order
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </form>
      
      {/* WhatsApp Message Preview Dialog */}
      <Dialog open={showWhatsAppPreview} onOpenChange={setShowWhatsAppPreview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>WhatsApp Message Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm font-medium text-green-700">WhatsApp Message</span>
                {whatsappNumber && (
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                    To: {whatsappNumber}
                  </span>
                )}
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <pre className="text-sm whitespace-pre-wrap font-sans text-gray-800">
                  {getWhatsAppMessage()}
                </pre>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => setShowWhatsAppPreview(false)}>
                Close Preview
              </Button>
              <Button 
                onClick={() => {
                  setShowWhatsAppPreview(false);
                  shareViaWhatsApp();
                }}
                className="bg-green-500 hover:bg-green-600"
                disabled={!whatsappNumber.trim()}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Send to WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revolutionary Product Creation Modal */}
      {showProductCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 via-purple-50 to-green-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    Create New Product
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">Add a new product to your inventory with advanced features</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProductCreate(false)}
                  className="hover:bg-red-100"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form className="space-y-6" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                
                const newProduct: Product = {
                  id: `prod_${Date.now()}`,
                  name: formData.get('productName') as string,
                  description: formData.get('description') as string || '',
                  sku: formData.get('sku') as string || `SKU-${Date.now()}`,
                  category: formData.get('category') as string,
                  price: parseFloat(formData.get('price') as string) || 0,
                  stock: parseInt(formData.get('stock') as string) || 0,
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                
                setProducts(prev => [...prev, newProduct]);
                setShowProductCreate(false);
                
                // Auto-add to order if we're in order creation
                addProductToOrder(newProduct, 1);
                
                notificationService.addRealNotification(
                  'Product Created Successfully! 🎉',
                  `${newProduct.name} has been added to your inventory and order`,
                  'success'
                );
              }}>
                
                {/* Product Image Upload Section */}
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 relative overflow-hidden">
                        {productImage ? (
                          <img 
                            src={productImage} 
                            alt="Product" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileImage className="h-8 w-8 text-gray-400" />
                        )}
                        {productImage && (
                          <button
                            type="button"
                            onClick={removeProductImage}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm font-medium">Product Image</Label>
                        <p className="text-xs text-muted-foreground mb-2">Upload a high-quality image of your product (Max 5MB)</p>
                        <div className="flex gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            ref={setImageInputRef}
                            className="hidden"
                            id="imageUpload"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => document.getElementById('imageUpload')?.click()}
                            disabled={isCapturingImage}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Image
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={captureImage}
                            disabled={isCapturingImage}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            {isCapturingImage ? 'Opening Camera...' : 'Take Photo'}
                          </Button>
                        </div>
                        {productImage && (
                          <p className="text-xs text-green-600 mt-1">✅ Image uploaded successfully</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Basic Product Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Basic Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="productName" className="flex items-center gap-2">
                            Product Name *
                            <Badge variant="outline" className="text-xs">Required</Badge>
                          </Label>
                          <Input
                            id="productName"
                            name="productName"
                            required
                            placeholder="Enter product name"
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            name="description"
                            placeholder="Detailed product description"
                            rows={3}
                            className="mt-1"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="sku">SKU</Label>
                            <Input
                              id="sku"
                              name="sku"
                              placeholder="Auto-generated"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="barcode">Barcode</Label>
                            <Input
                              id="barcode"
                              name="barcode"
                              placeholder="Product barcode"
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="category">Category *</Label>
                            <Select name="category" required>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="electronics">Electronics</SelectItem>
                                <SelectItem value="clothing">Clothing</SelectItem>
                                <SelectItem value="home-garden">Home & Garden</SelectItem>
                                <SelectItem value="sports">Sports & Recreation</SelectItem>
                                <SelectItem value="books">Books & Media</SelectItem>
                                <SelectItem value="automotive">Automotive</SelectItem>
                                <SelectItem value="health-beauty">Health & Beauty</SelectItem>
                                <SelectItem value="food-beverage">Food & Beverage</SelectItem>
                                <SelectItem value="office-supplies">Office Supplies</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="brand">Brand</Label>
                            <Input
                              id="brand"
                              name="brand"
                              placeholder="Product brand"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <DollarSign className="h-5 w-5" />
                          Pricing & Inventory
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="price" className="flex items-center gap-2">
                              Selling Price *
                              <Badge variant="outline" className="text-xs">₹</Badge>
                            </Label>
                            <Input
                              id="price"
                              name="price"
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="cost">Cost Price</Label>
                            <Input
                              id="cost"
                              name="cost"
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="stock">Current Stock</Label>
                            <Input
                              id="stock"
                              name="stock"
                              type="number"
                              min="0"
                              placeholder="0"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="minStock">Minimum Stock Alert</Label>
                            <Input
                              id="minStock"
                              name="minStock"
                              type="number"
                              min="0"
                              placeholder="5"
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="unit">Unit of Measure</Label>
                          <Select name="unit">
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pieces">Pieces</SelectItem>
                              <SelectItem value="kg">Kilograms</SelectItem>
                              <SelectItem value="grams">Grams</SelectItem>
                              <SelectItem value="liters">Liters</SelectItem>
                              <SelectItem value="meters">Meters</SelectItem>
                              <SelectItem value="boxes">Boxes</SelectItem>
                              <SelectItem value="packs">Packs</SelectItem>
                              <SelectItem value="dozen">Dozen</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="weight">Weight (kg)</Label>
                            <Input
                              id="weight"
                              name="weight"
                              type="number"
                              min="0"
                              step="0.1"
                              placeholder="0.0"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="dimensions">Dimensions</Label>
                            <Input
                              id="dimensions"
                              name="dimensions"
                              placeholder="L x W x H (cm)"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Advanced Features */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Advanced Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="supplier">Supplier</Label>
                        <Input
                          id="supplier"
                          name="supplier"
                          placeholder="Supplier name"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tags">Tags</Label>
                        <Input
                          id="tags"
                          name="tags"
                          placeholder="tag1, tag2, tag3"
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Separate tags with commas</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="taxable"
                        name="taxable"
                        defaultChecked
                        className="rounded"
                      />
                      <Label htmlFor="taxable" className="text-sm">This product is taxable</Label>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Badge variant="outline" className="cursor-pointer hover:bg-blue-50">
                        📱 Digital Product
                      </Badge>
                      <Badge variant="outline" className="cursor-pointer hover:bg-green-50">
                        🌟 Featured Item
                      </Badge>
                      <Badge variant="outline" className="cursor-pointer hover:bg-purple-50">
                        🚀 Fast Moving
                      </Badge>
                      <Badge variant="outline" className="cursor-pointer hover:bg-orange-50">
                        💎 Premium Quality
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-6 border-t">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowProductCreate(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        // Save as draft functionality
                        notificationService.addRealNotification(
                          'Draft Saved',
                          'Product saved as draft',
                          'success'
                        );
                      }}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Save as Draft
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create Product & Add to Order
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating Action Button for Quick Actions */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="flex flex-col gap-3 items-end">
          {/* Auto-save Status Indicator */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
            autoSaveStatus === 'saved' ? 'bg-green-100 text-green-700 border border-green-200' :
            autoSaveStatus === 'saving' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
            autoSaveStatus === 'error' ? 'bg-red-100 text-red-700 border border-red-200' :
            'bg-gray-100 text-gray-700 border border-gray-200'
          }`}>
            {autoSaveStatus === 'saved' && '✅ Auto-saved'}
            {autoSaveStatus === 'saving' && '💾 Saving...'}
            {autoSaveStatus === 'error' && '❌ Save failed'}
          </div>
          
          {/* Quick Actions Menu */}
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-full w-12 h-12 p-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => {
                if (orderData.items.length > 0) {
                  generateSmartSuggestions();
                } else {
                  notificationService.addRealNotification(
                    'Add Products First',
                    'Add some products to get smart suggestions',
                    'info'
                  );
                }
              }}
              title="Generate Smart Suggestions"
            >
              <Brain className="h-5 w-5 text-purple-600" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="rounded-full w-12 h-12 p-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => setShowProductSearch(true)}
              title="Quick Product Search"
            >
              <Search className="h-5 w-5 text-blue-600" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="rounded-full w-12 h-12 p-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => setShowCustomerCreate(true)}
              title="Create New Customer"
            >
              <UserPlus className="h-5 w-5 text-green-600" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="rounded-full w-12 h-12 p-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => {
                // Quick save
                localStorage.setItem('orderDraft', JSON.stringify(orderData));
                notificationService.addRealNotification(
                  'Quick Save Complete! 💾',
                  'Your order has been saved',
                  'success'
                );
              }}
              title="Quick Save"
            >
              <Save className="h-5 w-5 text-orange-600" />
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default OrderCreation; 