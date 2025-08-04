import { apiClient, type Order, type Product, type Customer, type CreateOrderRequest, type CreateProductRequest, type CreateCustomerRequest } from './api-client';

export class OrderService {
  // Order management
  async getOrders(): Promise<Order[]> {
    try {
      const response = await apiClient.getOrders();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch orders');
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    try {
      const response = await apiClient.createOrder(orderData);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to create order');
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async getOrder(id: string): Promise<Order> {
    try {
      const response = await apiClient.getOrder(id);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch order');
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }

  // Product management
  async getProducts(): Promise<Product[]> {
    try {
      const response = await apiClient.getProducts();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch products');
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  async createProduct(productData: CreateProductRequest): Promise<Product> {
    try {
      const response = await apiClient.createProduct(productData);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to create product');
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  // Customer management
  async getCustomers(): Promise<Customer[]> {
    try {
      const response = await apiClient.getCustomers();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch customers');
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  async createCustomer(customerData: CreateCustomerRequest): Promise<Customer> {
    try {
      const response = await apiClient.createCustomer(customerData);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to create customer');
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  // Utility methods
  generateOrderNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }

  calculateOrderTotals(items: any[]) {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    for (const item of items) {
      const itemTotal = item.quantity * item.unitPrice;
      const discount = item.discount || 0;
      const taxRate = 0.18; // 18% GST
      const taxAmount = (itemTotal - discount) * taxRate;
      
      subtotal += itemTotal;
      totalDiscount += discount;
      totalTax += taxAmount;
    }

    const total = subtotal - totalDiscount + totalTax;

    return {
      subtotal,
      tax: totalTax,
      discount: totalDiscount,
      total
    };
  }

  validateOrderData(orderData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!orderData.customer_id) {
      errors.push('Customer is required');
    }

    if (!orderData.items || orderData.items.length === 0) {
      errors.push('At least one item is required');
    }

    if (orderData.items) {
      orderData.items.forEach((item: any, index: number) => {
        if (!item.product_id) {
          errors.push(`Item ${index + 1}: Product is required`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
        }
        if (!item.unit_price || item.unit_price <= 0) {
          errors.push(`Item ${index + 1}: Unit price must be greater than 0`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const orderService = new OrderService();
export default orderService;
