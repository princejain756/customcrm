import apiClient from './api-client';
import { DashboardStats } from './types';

export class DashboardService {
  async getDashboardStats(organisationId: string): Promise<DashboardStats> {
    try {
      console.log(`🔍 Dashboard Service: Fetching stats for organisation ${organisationId}`);
      const response = await apiClient.getDashboardStats(organisationId);
      if (response.success && response.data) {
        console.log('✅ Dashboard Service: Stats fetched successfully');
        return response.data;
      } else {
        console.error('❌ Dashboard Service: Failed to fetch stats:', response.error);
        throw new Error(response.error || 'Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('❌ Dashboard Service: Error fetching stats:', error);
      // Return default stats if API fails
      return {
        total_revenue: 0,
        active_customers: 0,
        pending_bills: 0,
        growth_percentage: 0,
        recent_leads: [],
        recent_orders: [],
      };
    }
  }
}

export const dashboardService = new DashboardService(); 