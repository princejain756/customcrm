import { db } from './client';
import { 
  organisations, profiles, leads, leadOrders, leadOrderItems, 
  scannedBills, billScans, leadLogs, notifications, organisationSubscriptions,
  subscriptionTypes,
  type Organisation, type NewOrganisation,
  type Profile, type NewProfile,
  type Lead, type NewLead,
  type LeadOrder, type NewLeadOrder,
  type LeadOrderItem, type NewLeadOrderItem,
  type ScannedBill, type NewScannedBill,
  type BillScan, type NewBillScan,
  type LeadLog, type NewLeadLog,
  type Notification, type NewNotification
} from './schema';
import { eq, and, or, desc, asc, like, gte, lte, count, sum } from 'drizzle-orm';

export class PostgreSQLService {
  // Organisation operations
  async createOrganisation(data: NewOrganisation): Promise<Organisation> {
    const [result] = await db.insert(organisations).values(data).returning();
    return result;
  }

  async getOrganisation(id: string): Promise<Organisation | null> {
    const [result] = await db.select().from(organisations).where(eq(organisations.id, id));
    return result || null;
  }

  async updateOrganisation(id: string, data: Partial<Organisation>): Promise<Organisation | null> {
    const [result] = await db.update(organisations)
      .set({ ...data, updated_at: new Date() })
      .where(eq(organisations.id, id))
      .returning();
    return result || null;
  }

  async deleteOrganisation(id: string): Promise<boolean> {
    const result = await db.delete(organisations).where(eq(organisations.id, id));
    return result.rowCount > 0;
  }

  // Profile operations
  async createProfile(data: NewProfile): Promise<Profile> {
    const [result] = await db.insert(profiles).values(data).returning();
    return result;
  }

  async getProfile(id: string): Promise<Profile | null> {
    const [result] = await db.select().from(profiles).where(eq(profiles.id, id));
    return result || null;
  }

  async getProfileByUserId(userId: string): Promise<Profile | null> {
    const [result] = await db.select().from(profiles).where(eq(profiles.id, userId));
    return result || null;
  }

  async updateProfile(id: string, data: Partial<Profile>): Promise<Profile | null> {
    const [result] = await db.update(profiles)
      .set({ ...data, updated_at: new Date() })
      .where(eq(profiles.id, id))
      .returning();
    return result || null;
  }

  async getProfilesByOrganisation(organisationId: string): Promise<Profile[]> {
    return await db.select().from(profiles).where(eq(profiles.organisation_id, organisationId));
  }

  // Lead operations
  async createLead(data: NewLead): Promise<Lead> {
    const [result] = await db.insert(leads).values(data).returning();
    return result;
  }

  async getLead(id: string): Promise<Lead | null> {
    const [result] = await db.select().from(leads).where(eq(leads.id, id));
    return result || null;
  }

  async getLeadsByOrganisation(organisationId: string, limit = 50, offset = 0): Promise<Lead[]> {
    return await db.select()
      .from(leads)
      .where(eq(leads.organisation_id, organisationId))
      .orderBy(desc(leads.created_at))
      .limit(limit)
      .offset(offset);
  }

  async updateLead(id: string, data: Partial<Lead>): Promise<Lead | null> {
    const [result] = await db.update(leads)
      .set({ ...data, updated_at: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return result || null;
  }

  async deleteLead(id: string): Promise<boolean> {
    const result = await db.delete(leads).where(eq(leads.id, id));
    return result.rowCount > 0;
  }

  async searchLeads(organisationId: string, query: string): Promise<Lead[]> {
    return await db.select()
      .from(leads)
      .where(
        and(
          eq(leads.organisation_id, organisationId),
          or(
            like(leads.name, `%${query}%`),
            like(leads.lead_id, `%${query}%`),
            like(leads.phone, `%${query}%`),
            like(leads.email, `%${query}%`)
          )
        )
      )
      .orderBy(desc(leads.created_at));
  }

  // Lead Order operations
  async createLeadOrder(data: NewLeadOrder): Promise<LeadOrder> {
    const [result] = await db.insert(leadOrders).values(data).returning();
    return result;
  }

  async getLeadOrder(id: string): Promise<LeadOrder | null> {
    const [result] = await db.select().from(leadOrders).where(eq(leadOrders.id, id));
    return result || null;
  }

  async getLeadOrdersByLead(leadId: string): Promise<LeadOrder[]> {
    return await db.select().from(leadOrders).where(eq(leadOrders.lead_id, leadId));
  }

  async updateLeadOrder(id: string, data: Partial<LeadOrder>): Promise<LeadOrder | null> {
    const [result] = await db.update(leadOrders)
      .set({ ...data, updated_at: new Date() })
      .where(eq(leadOrders.id, id))
      .returning();
    return result || null;
  }

  // Lead Order Item operations
  async createLeadOrderItem(data: NewLeadOrderItem): Promise<LeadOrderItem> {
    const [result] = await db.insert(leadOrderItems).values(data).returning();
    return result;
  }

  async getLeadOrderItem(id: string): Promise<LeadOrderItem | null> {
    const [result] = await db.select().from(leadOrderItems).where(eq(leadOrderItems.id, id));
    return result || null;
  }

  async getLeadOrderItemsByOrder(orderId: string): Promise<LeadOrderItem[]> {
    return await db.select().from(leadOrderItems).where(eq(leadOrderItems.lead_order_id, orderId));
  }

  async updateLeadOrderItem(id: string, data: Partial<LeadOrderItem>): Promise<LeadOrderItem | null> {
    const [result] = await db.update(leadOrderItems)
      .set({ ...data, updated_at: new Date() })
      .where(eq(leadOrderItems.id, id))
      .returning();
    return result || null;
  }

  // Scanned Bill operations
  async createScannedBill(data: NewScannedBill): Promise<ScannedBill> {
    const [result] = await db.insert(scannedBills).values(data).returning();
    return result;
  }

  async getScannedBill(id: string): Promise<ScannedBill | null> {
    const [result] = await db.select().from(scannedBills).where(eq(scannedBills.id, id));
    return result || null;
  }

  async getScannedBillsByLead(leadId: string): Promise<ScannedBill[]> {
    return await db.select().from(scannedBills).where(eq(scannedBills.lead_id, leadId));
  }

  async updateScannedBill(id: string, data: Partial<ScannedBill>): Promise<ScannedBill | null> {
    const [result] = await db.update(scannedBills)
      .set(data)
      .where(eq(scannedBills.id, id))
      .returning();
    return result || null;
  }

  async deleteScannedBill(id: string): Promise<boolean> {
    const result = await db.delete(scannedBills).where(eq(scannedBills.id, id));
    return result.rowCount > 0;
  }

  // Bill Scan operations
  async createBillScan(data: NewBillScan): Promise<BillScan> {
    const [result] = await db.insert(billScans).values(data).returning();
    return result;
  }

  async getBillScan(id: string): Promise<BillScan | null> {
    const [result] = await db.select().from(billScans).where(eq(billScans.id, id));
    return result || null;
  }

  async getBillScansByLead(leadId: string): Promise<BillScan[]> {
    return await db.select().from(billScans).where(eq(billScans.lead_id, leadId));
  }

  // Lead Log operations
  async createLeadLog(data: NewLeadLog): Promise<LeadLog> {
    const [result] = await db.insert(leadLogs).values(data).returning();
    return result;
  }

  async getLeadLogsByLead(leadId: string): Promise<LeadLog[]> {
    return await db.select().from(leadLogs).where(eq(leadLogs.lead_id, leadId));
  }

  // Notification operations
  async createNotification(data: NewNotification): Promise<Notification> {
    const [result] = await db.insert(notifications).values(data).returning();
    return result;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.user_id, userId));
  }

  async markNotificationAsRead(id: string): Promise<Notification | null> {
    const [result] = await db.update(notifications)
      .set({ is_read: true })
      .where(eq(notifications.id, id))
      .returning();
    return result || null;
  }

  // Statistics and analytics
  async getLeadStats(organisationId: string): Promise<{
    total: number;
    new: number;
    closed: number;
    totalValue: number;
  }> {
    const [stats] = await db.select({
      total: count(leads.id),
      new: count(leads.id),
      closed: count(leads.id),
      totalValue: sum(leadOrders.total_value)
    })
    .from(leads)
    .leftJoin(leadOrders, eq(leads.id, leadOrders.lead_id))
    .where(eq(leads.organisation_id, organisationId));

    return {
      total: Number(stats.total) || 0,
      new: Number(stats.new) || 0,
      closed: Number(stats.closed) || 0,
      totalValue: Number(stats.totalValue) || 0,
    };
  }

  // Utility functions
  async generateLeadId(): Promise<string> {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    return `LEAD-${timestamp}-${random}`;
  }

  async generateOrderNo(): Promise<string> {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    return `ORD-${timestamp}-${random}`;
  }

  // Transaction support
  async withTransaction<T>(callback: (tx: typeof db) => Promise<T>): Promise<T> {
    return await db.transaction(callback);
  }
}

// Export singleton instance
export const postgresService = new PostgreSQLService(); 