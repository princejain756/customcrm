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
  organisation_id: string;
  user_id: string;
  source: string;
  name: string;
  address: string;
  gstin: string;
  state: string;
  phone: string;
  email: string;
  created_at: string;
  status: string;
  updated_at: string;
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
  async getLeads(): Promise<Lead[]> {
    return this.request<Lead[]>('/leads');
  }

  // Dashboard stats
  async getDashboardStats(organisationId: string): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
    return this.request<{ success: boolean; data?: DashboardStats; error?: string }>(`/dashboard/stats/${organisationId}`);
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