import { DashboardStats } from './types';

const API_BASE_URL = '/api';

export interface ApiResponse<T = unknown> {
  success?: boolean;
  status?: string;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface RegisterResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface TokenValidationResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export interface ProfileResponse {
  success: boolean;
  profile?: {
    id: string;
    name: string;
    role: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  message?: string;
}

export interface LogoutResponse {
  success: boolean;
  message?: string;
}

export interface Organization {
  id: string;
  name: string;
  email: string;
  gstin: string;
  state: string;
  address: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  lead_number: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  address?: string;
  source?: string;
  status: string;
  priority: string;
  notes?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_to_email?: string;
  organization_id: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  activities?: LeadActivity[];
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: string;
  title: string;
  description?: string;
  activity_date: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
}

export interface CreateLeadRequest {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  address?: string;
  source?: string;
  status?: string;
  priority?: string;
  notes?: string;
}

export interface UpdateLeadRequest {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  address?: string;
  source?: string;
  status?: string;
  priority?: string;
  notes?: string;
}

// Order interfaces
export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  gstin?: string;
  billing_address?: string;
  shipping_address?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id?: string;
  product_id: string;
  product_sku: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total_price: number;
  tax_rate: number;
  tax_amount: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name?: string;
  order_date: string;
  delivery_date?: string;
  status: 'draft' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  payment_terms: 'cod' | 'net15' | 'net30' | 'net60';
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  shipping_address?: string;
  billing_address?: string;
  notes?: string;
  organization_id: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface CreateOrderRequest {
  customer_id: string;
  order_date: string;
  delivery_date?: string;
  status?: string;
  priority?: string;
  payment_terms?: string;
  shipping_address?: string;
  billing_address?: string;
  notes?: string;
  items: {
    product_id: string;
    product_sku: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    discount?: number;
    tax_rate?: number;
  }[];
}

export interface UpdateOrderRequest {
  customer_id?: string;
  order_date?: string;
  delivery_date?: string;
  status?: string;
  priority?: string;
  payment_terms?: string;
  shipping_address?: string;
  billing_address?: string;
  notes?: string;
  items?: {
    id?: string;
    product_id: string;
    product_sku: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    discount?: number;
    tax_rate?: number;
  }[];
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
}

export interface UpdateProductRequest {
  sku?: string;
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  is_active?: boolean;
}

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  gstin?: string;
  billing_address?: string;
  shipping_address?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  gstin?: string;
  billing_address?: string;
  shipping_address?: string;
}

class ApiClient {
  private baseUrl: string;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async requestWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    attempt: number = 1
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`🔍 API Client: Making request to ${endpoint} (attempt ${attempt})`);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        console.error(`❌ API Client: Request to ${endpoint} failed with status ${response.status}`);
        
        // Retry on 5xx errors (server errors)
        if (response.status >= 500 && response.status < 600 && attempt < this.retryAttempts) {
          console.log(`🔄 Retrying request to ${endpoint} in ${this.retryDelay}ms...`);
          await this.delay(this.retryDelay);
          return this.requestWithRetry<T>(endpoint, options, attempt + 1);
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ API Client: Request to ${endpoint} successful`);
      return data;
    } catch (error) {
      console.error(`❌ API Client: Request to ${endpoint} failed:`, error);
      
      // Retry on network errors
      if (attempt < this.retryAttempts && error instanceof TypeError) {
        console.log(`🔄 Retrying request to ${endpoint} in ${this.retryDelay}ms...`);
        await this.delay(this.retryDelay);
        return this.requestWithRetry<T>(endpoint, options, attempt + 1);
      }
      
      throw error;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    return this.requestWithRetry<T>(endpoint, options);
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/health');
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return this.request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async validateToken(token: string): Promise<TokenValidationResponse> {
    return this.request<TokenValidationResponse>('/auth/validate', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async logout(): Promise<LogoutResponse> {
    return this.request<LogoutResponse>('/auth/logout', {
      method: 'POST',
    });
  }

  async getProfile(userId: string): Promise<ProfileResponse> {
    return this.request<ProfileResponse>(`/auth/profile/${userId}`);
  }

  async updateProfile(userId: string, updates: { name?: string; role?: string }): Promise<ProfileResponse> {
    return this.request<ProfileResponse>(`/auth/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Organizations
  async getOrganizations(): Promise<Organization[]> {
    return this.request<Organization[]>('/organizations');
  }

  // Leads
  async getLeads(): Promise<{ success: boolean; data?: Lead[]; error?: string }> {
    return this.request<{ success: boolean; data?: Lead[]; error?: string }>('/leads');
  }

  async createLead(leadData: CreateLeadRequest): Promise<{ success: boolean; data?: Lead; error?: string; message?: string }> {
    return this.request<{ success: boolean; data?: Lead; error?: string; message?: string }>('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  }

  async getLead(id: string): Promise<{ success: boolean; data?: Lead; error?: string }> {
    return this.request<{ success: boolean; data?: Lead; error?: string }>(`/leads/${id}`);
  }

  async updateLead(id: string, updates: UpdateLeadRequest): Promise<{ success: boolean; data?: Lead; error?: string; message?: string }> {
    return this.request<{ success: boolean; data?: Lead; error?: string; message?: string }>(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteLead(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
    return this.request<{ success: boolean; message?: string; error?: string }>(`/leads/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard stats
  async getDashboardStats(organisationId: string): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
    return this.request<{ success: boolean; data?: DashboardStats; error?: string }>(`/dashboard/stats/${organisationId}`);
  }

  // Orders
  async getOrders(): Promise<{ success: boolean; data?: Order[]; error?: string }> {
    return this.request<{ success: boolean; data?: Order[]; error?: string }>('/orders');
  }

  async createOrder(orderData: CreateOrderRequest): Promise<{ success: boolean; data?: Order; error?: string; message?: string }> {
    return this.request<{ success: boolean; data?: Order; error?: string; message?: string }>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrder(id: string): Promise<{ success: boolean; data?: Order; error?: string }> {
    return this.request<{ success: boolean; data?: Order; error?: string }>(`/orders/${id}`);
  }

  async updateOrder(id: string, updates: UpdateOrderRequest): Promise<{ success: boolean; data?: Order; error?: string; message?: string }> {
    return this.request<{ success: boolean; data?: Order; error?: string; message?: string }>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteOrder(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
    return this.request<{ success: boolean; message?: string; error?: string }>(`/orders/${id}`, {
      method: 'DELETE',
    });
  }

  // Products
  async getProducts(): Promise<{ success: boolean; data?: Product[]; error?: string }> {
    return this.request<{ success: boolean; data?: Product[]; error?: string }>('/products');
  }

  async createProduct(productData: CreateProductRequest): Promise<{ success: boolean; data?: Product; error?: string; message?: string }> {
    return this.request<{ success: boolean; data?: Product; error?: string; message?: string }>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async getProduct(id: string): Promise<{ success: boolean; data?: Product; error?: string }> {
    return this.request<{ success: boolean; data?: Product; error?: string }>(`/products/${id}`);
  }

  async updateProduct(id: string, updates: UpdateProductRequest): Promise<{ success: boolean; data?: Product; error?: string; message?: string }> {
    return this.request<{ success: boolean; data?: Product; error?: string; message?: string }>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProduct(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
    return this.request<{ success: boolean; message?: string; error?: string }>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Customers
  async getCustomers(): Promise<{ success: boolean; data?: Customer[]; error?: string }> {
    return this.request<{ success: boolean; data?: Customer[]; error?: string }>('/customers');
  }

  async createCustomer(customerData: CreateCustomerRequest): Promise<{ success: boolean; data?: Customer; error?: string; message?: string }> {
    return this.request<{ success: boolean; data?: Customer; error?: string; message?: string }>('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  async getCustomer(id: string): Promise<{ success: boolean; data?: Customer; error?: string }> {
    return this.request<{ success: boolean; data?: Customer; error?: string }>(`/customers/${id}`);
  }

  async updateCustomer(id: string, updates: UpdateCustomerRequest): Promise<{ success: boolean; data?: Customer; error?: string; message?: string }> {
    return this.request<{ success: boolean; data?: Customer; error?: string; message?: string }>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteCustomer(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
    return this.request<{ success: boolean; message?: string; error?: string }>(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // Test endpoint
  async testConnection(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/test');
  }

  // Check if API is available
  async isApiAvailable(): Promise<boolean> {
    try {
      console.log('🔍 API Client: Checking API availability...');
      await this.healthCheck();
      console.log('✅ API Client: API is available');
      return true;
    } catch (error) {
      console.error('❌ API Client: API not available:', error);
      return false;
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient; 