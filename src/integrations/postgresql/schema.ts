import { pgTable, uuid, varchar, text, timestamp, boolean, integer, decimal, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Create enums
export const appRoleEnum = pgEnum('app_role', ['admin', 'organisation_admin', 'manager', 'sales_person']);
export const leadStatusEnum = pgEnum('lead_status', [
  'new', 'order_placed', 'procurement_sent', 'procurement_waiting', 
  'procurement_approved', 'bill_generated', 'closed', 'partial_procurement_sent', 
  'partial_procurement_waiting', 'partial_procurement_approved'
]);
export const orderItemStatusEnum = pgEnum('order_item_status', [
  'procurement_sent', 'procurement_waiting', 'procurement_approved', 'bill_generated', 'closed'
]);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed', 'expired']);
export const leadSourceEnum = pgEnum('lead_source', [
  'email', 'whatsapp', 'phone', 'website', 'referral', 'social_media', 'other'
]);

// Define tables
export const organisations = pgTable('organisations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  gstin: varchar('gstin', { length: 15 }),
  state: varchar('state', { length: 100 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // References auth.users(id)
  organisation_id: uuid('organisation_id').references(() => organisations.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  role: appRoleEnum('role').default('sales_person'),
  dob: timestamp('dob'),
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
  whatsapp_number: varchar('whatsapp_number', { length: 20 }),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const subscriptionTypes = pgTable('subscription_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  no_of_leads: integer('no_of_leads').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  validity_days: integer('validity_days').notNull(),
  description: text('description'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const organisationSubscriptions = pgTable('organisation_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisation_id: uuid('organisation_id').references(() => organisations.id, { onDelete: 'cascade' }),
  subscription_type_id: uuid('subscription_type_id').references(() => subscriptionTypes.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id'), // References auth.users(id)
  start_date: timestamp('start_date').notNull(),
  expiry_date: timestamp('expiry_date').notNull(),
  no_of_leads: integer('no_of_leads').notNull(),
  current_leads_count: integer('current_leads_count').default(0),
  total_price: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  payment_status: paymentStatusEnum('payment_status').default('pending'),
  razorpay_payment_link: text('razorpay_payment_link'),
  razorpay_payment_id: varchar('razorpay_payment_id', { length: 255 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  lead_id: varchar('lead_id', { length: 255 }).notNull().unique(),
  organisation_id: uuid('organisation_id').references(() => organisations.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id'), // References auth.users(id)
  from_source: leadSourceEnum('from_source').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  gstin: varchar('gstin', { length: 15 }),
  state: varchar('state', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  date_open: timestamp('date_open').notNull(),
  date_closed: timestamp('date_closed'),
  status: leadStatusEnum('status').default('new'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const leadOrders = pgTable('lead_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  order_no: varchar('order_no', { length: 255 }).notNull().unique(),
  lead_id: uuid('lead_id').references(() => leads.id, { onDelete: 'cascade' }),
  total_value: decimal('total_value', { precision: 10, scale: 2 }).notNull().default('0'),
  total_items: integer('total_items').notNull().default(0),
  total_gst: decimal('total_gst', { precision: 10, scale: 2 }).notNull().default('0'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const leadOrderItems = pgTable('lead_order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  lead_order_id: uuid('lead_order_id').references(() => leadOrders.id, { onDelete: 'cascade' }),
  product_sku: varchar('product_sku', { length: 255 }).notNull(),
  product_name: varchar('product_name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  procurement_price: decimal('procurement_price', { precision: 10, scale: 2 }),
  bill_price: decimal('bill_price', { precision: 10, scale: 2 }),
  total_value: decimal('total_value', { precision: 10, scale: 2 }).notNull(),
  total_gst: decimal('total_gst', { precision: 10, scale: 2 }).notNull().default('0'),
  status: orderItemStatusEnum('status').default('procurement_sent'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const leadLogs = pgTable('lead_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  lead_id: uuid('lead_id').references(() => leads.id, { onDelete: 'cascade' }),
  lead_order_item_id: uuid('lead_order_item_id').references(() => leadOrderItems.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id'), // References auth.users(id)
  from_status: varchar('from_status', { length: 50 }),
  to_status: varchar('to_status', { length: 50 }),
  note: text('note'),
  created_at: timestamp('created_at').defaultNow(),
});

export const scannedBills = pgTable('scanned_bills', {
  id: uuid('id').primaryKey().defaultRandom(),
  lead_id: uuid('lead_id').references(() => leads.id, { onDelete: 'cascade' }),
  bill_number: varchar('bill_number', { length: 255 }).notNull(),
  bill_date: timestamp('bill_date').notNull(),
  total_amount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  gst_amount: decimal('gst_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  scanned_image_url: text('scanned_image_url'),
  items: jsonb('items'),
  created_at: timestamp('created_at').defaultNow(),
});

export const billScans = pgTable('bill_scans', {
  id: uuid('id').primaryKey().defaultRandom(),
  lead_id: uuid('lead_id').references(() => leads.id, { onDelete: 'cascade' }),
  bill_number: varchar('bill_number', { length: 255 }).notNull(),
  bill_date: timestamp('bill_date').notNull(),
  total_amount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  gst_amount: decimal('gst_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  scanned_image_url: text('scanned_image_url'),
  extracted_data: jsonb('extracted_data'),
  created_at: timestamp('created_at').defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id'), // References auth.users(id)
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 20 }).default('info'),
  is_read: boolean('is_read').default(false),
  created_at: timestamp('created_at').defaultNow(),
});

// Define relationships
export const organisationsRelations = relations(organisations, ({ many }) => ({
  profiles: many(profiles),
  leads: many(leads),
  subscriptions: many(organisationSubscriptions),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [profiles.organisation_id],
    references: [organisations.id],
  }),
  leads: many(leads),
  subscriptions: many(organisationSubscriptions),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [leads.organisation_id],
    references: [organisations.id],
  }),
  orders: many(leadOrders),
  scannedBills: many(scannedBills),
  billScans: many(billScans),
  logs: many(leadLogs),
}));

export const leadOrdersRelations = relations(leadOrders, ({ one, many }) => ({
  lead: one(leads, {
    fields: [leadOrders.lead_id],
    references: [leads.id],
  }),
  items: many(leadOrderItems),
}));

export const leadOrderItemsRelations = relations(leadOrderItems, ({ one, many }) => ({
  order: one(leadOrders, {
    fields: [leadOrderItems.lead_order_id],
    references: [leadOrders.id],
  }),
  logs: many(leadLogs),
}));

export const scannedBillsRelations = relations(scannedBills, ({ one }) => ({
  lead: one(leads, {
    fields: [scannedBills.lead_id],
    references: [leads.id],
  }),
}));

export const billScansRelations = relations(billScans, ({ one }) => ({
  lead: one(leads, {
    fields: [billScans.lead_id],
    references: [leads.id],
  }),
}));

// Export types
export type Organisation = typeof organisations.$inferSelect;
export type NewOrganisation = typeof organisations.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type LeadOrder = typeof leadOrders.$inferSelect;
export type NewLeadOrder = typeof leadOrders.$inferInsert;
export type LeadOrderItem = typeof leadOrderItems.$inferSelect;
export type NewLeadOrderItem = typeof leadOrderItems.$inferInsert;
export type ScannedBill = typeof scannedBills.$inferSelect;
export type NewScannedBill = typeof scannedBills.$inferInsert;
export type BillScan = typeof billScans.$inferSelect;
export type NewBillScan = typeof billScans.$inferInsert;
export type LeadLog = typeof leadLogs.$inferSelect;
export type NewLeadLog = typeof leadLogs.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert; 