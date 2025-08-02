// CRM System Types
export type AppRole = 'admin' | 'organisation_admin' | 'manager' | 'sales_person';
export type LeadStatus = 'new' | 'order_placed' | 'procurement_sent' | 'procurement_waiting' | 'procurement_approved' | 'bill_generated' | 'closed' | 'partial_procurement_sent' | 'partial_procurement_waiting' | 'partial_procurement_approved';
export type OrderItemStatus = 'procurement_sent' | 'procurement_waiting' | 'procurement_approved' | 'bill_generated' | 'closed';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired';
export type LeadSource = 'email' | 'whatsapp' | 'phone' | 'website' | 'referral' | 'social_media' | 'other';

export interface Organisation {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  state?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionType {
  id: string;
  name: string;
  no_of_leads: number;
  price: number;
  validity_days: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganisationSubscription {
  id: string;
  organisation_id: string;
  subscription_type_id: string;
  user_id: string;
  start_date: string;
  expiry_date: string;
  no_of_leads: number;
  current_leads_count: number;
  total_price: number;
  payment_status: PaymentStatus;
  razorpay_payment_link?: string;
  razorpay_payment_id?: string;
  created_at: string;
  updated_at: string;
  subscription_type?: SubscriptionType;
}

export interface Profile {
  id: string;
  organisation_id?: string;
  name: string;
  role: AppRole;
  dob?: string;
  address?: string;
  phone?: string;
  whatsapp_number?: string;
  email?: string; // Added email field
  is_active: boolean;
  created_at: string;
  updated_at: string;
  organisation?: Organisation;
}

export interface Lead {
  id: string;
  lead_id: string;
  organisation_id: string;
  user_id: string;
  from_source: LeadSource;
  name: string;
  address?: string;
  gstin?: string;
  state?: string;
  phone?: string;
  email?: string;
  date_open: string;
  date_closed?: string;
  status: LeadStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  organisation?: Organisation;
  user?: Profile;
  orders?: LeadOrder[];
}

export interface LeadOrder {
  id: string;
  order_no: string;
  lead_id: string;
  total_value: number;
  total_items: number;
  total_gst: number;
  created_at: string;
  updated_at: string;
  lead?: Lead;
  items?: LeadOrderItem[];
}

export interface LeadOrderItem {
  id: string;
  lead_order_id: string;
  product_sku: string;
  product_name: string;
  quantity: number;
  procurement_price?: number;
  bill_price?: number;
  total_value: number;
  total_gst: number;
  status: OrderItemStatus;
  created_at: string;
  updated_at: string;
  lead_order?: LeadOrder;
}

export interface LeadLog {
  id: string;
  lead_id: string;
  lead_order_item_id?: string;
  user_id: string;
  from_status?: string;
  to_status?: string;
  note?: string;
  created_at: string;
  user?: Profile;
  lead?: Lead;
  lead_order_item?: LeadOrderItem;
}

// Supabase query result types
export interface LeadWithRelations extends Lead {
  organisation?: Organisation;
  user?: Profile;
}

export interface LeadOrderWithRelations extends LeadOrder {
  lead?: Lead;
}

export interface ProfileWithRelations extends Profile {
  organisation?: Organisation;
}

// Form types
export interface CreateOrganisationForm {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  state?: string;
}

export interface CreateLeadForm {
  name: string;
  from_source: LeadSource;
  address?: string;
  gstin?: string;
  state?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface CreateOrderForm {
  lead_id: string;
  items: CreateOrderItemForm[];
}

export interface CreateOrderItemForm {
  product_sku: string;
  product_name: string;
  quantity: number;
  procurement_price?: number;
  bill_price?: number;
}

// Dashboard stats
export interface DashboardStats {
  total_revenue: number;
  active_customers: number;
  pending_bills: number;
  growth_percentage: number;
  recent_leads: Lead[];
  recent_orders: LeadOrder[];
}

// Search and filter types
export interface LeadFilters {
  status?: LeadStatus;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface OrderFilters {
  status?: OrderItemStatus;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// Bill scanning types
export interface ScannedBill {
  id: string;
  lead_id: string;
  bill_number: string;
  bill_date: string;
  total_amount: number;
  gst_amount: number;
  items: ScannedBillItem[];
  scanned_image_url?: string;
  created_at: string;
}

export interface ScannedBillItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  gst_rate: number;
  gst_amount: number;
}

// Tally integration types
export interface TallyConfig {
  company_name: string;
  server_url: string;
  port: number;
  username?: string;
  password?: string;
}

export interface TallyInvoice {
  id: string;
  voucher_type: string;
  voucher_number: string;
  date: string;
  party_ledger_name: string;
  amount: number;
  narration?: string;
  items: TallyInvoiceItem[];
}

export interface TallyInvoiceItem {
  stock_item_name: string;
  quantity: number;
  rate: number;
  amount: number;
  gst_rate: number;
  gst_amount: number;
}

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

export interface UINotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  category: 'lead' | 'order' | 'system' | 'billing' | 'general';
}

// Report types
export interface RevenueReport {
  period: string;
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  revenue_by_month: { month: string; revenue: number }[];
}

export interface LeadReport {
  period: string;
  total_leads: number;
  converted_leads: number;
  conversion_rate: number;
  leads_by_source: { source: string; count: number }[];
  leads_by_status: { status: string; count: number }[];
}

export interface CustomerReport {
  period: string;
  total_customers: number;
  new_customers: number;
  repeat_customers: number;
  top_customers: { customer: string; revenue: number }[];
} 