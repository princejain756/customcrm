-- Sample Data for Testing RLS Policies
-- Run this in your Supabase SQL Editor after setting up the RLS policies

-- First, let's create some sample organisations
INSERT INTO organisations (id, name, email, gstin, state, address, phone, created_at, updated_at) VALUES
('org-1', 'Test Organisation 1', 'org1@test.com', 'GSTIN123456789', 'Maharashtra', 'Mumbai, Maharashtra', '+91-9876543210', NOW(), NOW()),
('org-2', 'Test Organisation 2', 'org2@test.com', 'GSTIN987654321', 'Delhi', 'New Delhi, Delhi', '+91-9876543211', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create sample subscription types
INSERT INTO subscription_types (id, name, description, price, duration_days, features, created_at, updated_at) VALUES
('sub-1', 'Basic Plan', 'Basic CRM features', 999, 30, '["leads", "orders"]', NOW(), NOW()),
('sub-2', 'Professional Plan', 'Professional CRM features', 1999, 30, '["leads", "orders", "bills", "reports"]', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create organisation subscriptions
INSERT INTO organisation_subscriptions (id, organisation_id, subscription_type_id, start_date, end_date, status, created_at, updated_at) VALUES
('sub-org-1', 'org-1', 'sub-2', NOW(), NOW() + INTERVAL '30 days', 'active', NOW(), NOW()),
('sub-org-2', 'org-2', 'sub-1', NOW(), NOW() + INTERVAL '30 days', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create sample leads
INSERT INTO leads (id, lead_id, organisation_id, user_id, from_source, name, address, gstin, state, phone, email, date_open, status, created_at, updated_at) VALUES
('lead-1', 'LEAD001', 'org-1', '041feece-287a-46e5-aa0f-55979e064b9d', 'website', 'John Doe', 'Mumbai, Maharashtra', 'GSTIN123456789', 'Maharashtra', '+91-9876543210', 'john@example.com', NOW(), 'new', NOW(), NOW()),
('lead-2', 'LEAD002', 'org-1', '041feece-287a-46e5-aa0f-55979e064b9d', 'referral', 'Jane Smith', 'Delhi, Delhi', 'GSTIN987654321', 'Delhi', '+91-9876543211', 'jane@example.com', NOW(), 'order_placed', NOW(), NOW()),
('lead-3', 'LEAD003', 'org-2', '041feece-287a-46e5-aa0f-55979e064b9d', 'cold_call', 'Bob Johnson', 'Bangalore, Karnataka', 'GSTIN456789123', 'Karnataka', '+91-9876543212', 'bob@example.com', NOW(), 'procurement_sent', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create sample orders
INSERT INTO lead_orders (id, order_no, lead_id, total_value, total_items, total_gst, created_at, updated_at) VALUES
('order-1', 'ORD-001', 'lead-1', 50000, 5, 9000, NOW(), NOW()),
('order-2', 'ORD-002', 'lead-2', 75000, 3, 13500, NOW(), NOW()),
('order-3', 'ORD-003', 'lead-3', 25000, 2, 4500, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create sample order items
INSERT INTO lead_order_items (id, lead_order_id, product_sku, product_name, quantity, procurement_price, bill_price, total_value, total_gst, status, created_at, updated_at) VALUES
('item-1', 'order-1', 'SKU001', 'Product A', 2, 15000, 15000, 30000, 5400, 'ordered', NOW(), NOW()),
('item-2', 'order-1', 'SKU002', 'Product B', 3, 6667, 6667, 20000, 3600, 'ordered', NOW(), NOW()),
('item-3', 'order-2', 'SKU003', 'Product C', 1, 50000, 50000, 50000, 9000, 'shipped', NOW(), NOW()),
('item-4', 'order-2', 'SKU004', 'Product D', 2, 12500, 12500, 25000, 4500, 'shipped', NOW(), NOW()),
('item-5', 'order-3', 'SKU005', 'Product E', 1, 15000, 15000, 15000, 2700, 'ordered', NOW(), NOW()),
('item-6', 'order-3', 'SKU006', 'Product F', 1, 10000, 10000, 10000, 1800, 'ordered', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create sample lead logs
INSERT INTO lead_logs (id, lead_id, user_id, action, details, created_at) VALUES
('log-1', 'lead-1', '041feece-287a-46e5-aa0f-55979e064b9d', 'created', 'Lead created from website', NOW()),
('log-2', 'lead-1', '041feece-287a-46e5-aa0f-55979e064b9d', 'contacted', 'Initial contact made', NOW()),
('log-3', 'lead-2', '041feece-287a-46e5-aa0f-55979e064b9d', 'created', 'Lead created from referral', NOW()),
('log-4', 'lead-2', '041feece-287a-46e5-aa0f-55979e064b9d', 'order_placed', 'Order placed successfully', NOW()),
('log-5', 'lead-3', '041feece-287a-46e5-aa0f-55979e064b9d', 'created', 'Lead created from cold call', NOW()),
('log-6', 'lead-3', '041feece-287a-46e5-aa0f-55979e064b9d', 'procurement_sent', 'Procurement request sent', NOW())
ON CONFLICT (id) DO NOTHING;

-- Create sample scanned bills
INSERT INTO scanned_bills (id, bill_number, vendor_name, bill_date, total_amount, organisation_id, user_id, status, created_at, updated_at) VALUES
('bill-1', 'BILL-001', 'Vendor A', NOW(), 50000, 'org-1', '041feece-287a-46e5-aa0f-55979e064b9d', 'scanned', NOW(), NOW()),
('bill-2', 'BILL-002', 'Vendor B', NOW(), 75000, 'org-1', '041feece-287a-46e5-aa0f-55979e064b9d', 'processed', NOW(), NOW()),
('bill-3', 'BILL-003', 'Vendor C', NOW(), 25000, 'org-2', '041feece-287a-46e5-aa0f-55979e064b9d', 'scanned', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create sample bill scans
INSERT INTO bill_scans (id, bill_id, scan_data, extracted_text, confidence_score, created_at) VALUES
('scan-1', 'bill-1', '{"image_url": "https://example.com/bill1.jpg"}', 'Sample extracted text from bill 1', 0.95, NOW()),
('scan-2', 'bill-2', '{"image_url": "https://example.com/bill2.jpg"}', 'Sample extracted text from bill 2', 0.88, NOW()),
('scan-3', 'bill-3', '{"image_url": "https://example.com/bill3.jpg"}', 'Sample extracted text from bill 3', 0.92, NOW())
ON CONFLICT (id) DO NOTHING;

-- Create sample notifications
INSERT INTO notifications (id, organisation_id, user_id, title, message, type, read_status, created_at) VALUES
('notif-1', 'org-1', '041feece-287a-46e5-aa0f-55979e064b9d', 'New Lead', 'New lead John Doe has been created', 'lead', false, NOW()),
('notif-2', 'org-1', '041feece-287a-46e5-aa0f-55979e064b9d', 'Order Placed', 'Order ORD-002 has been placed', 'order', false, NOW()),
('notif-3', 'org-2', '041feece-287a-46e5-aa0f-55979e064b9d', 'Bill Scanned', 'Bill BILL-003 has been scanned', 'bill', false, NOW())
ON CONFLICT (id) DO NOTHING;

-- Update the user's profile
-- Replace '041feece-287a-46e5-aa0f-55979e064b9d' with your actual user ID
UPDATE profiles 
SET role = 'organisation_admin',
    name = 'Test User',
    phone = '+91-9876543210',
    address = 'Mumbai, Maharashtra',
    updated_at = NOW()
WHERE id = '041feece-287a-46e5-aa0f-55979e064b9d';

-- Verify the data
SELECT 'Organisations' as table_name, COUNT(*) as count FROM organisations
UNION ALL
SELECT 'Leads' as table_name, COUNT(*) as count FROM leads
UNION ALL
SELECT 'Orders' as table_name, COUNT(*) as count FROM lead_orders
UNION ALL
SELECT 'Order Items' as table_name, COUNT(*) as count FROM lead_order_items
UNION ALL
SELECT 'Lead Logs' as table_name, COUNT(*) as count FROM lead_logs
UNION ALL
SELECT 'Scanned Bills' as table_name, COUNT(*) as count FROM scanned_bills
UNION ALL
SELECT 'Bill Scans' as table_name, COUNT(*) as count FROM bill_scans
UNION ALL
SELECT 'Notifications' as table_name, COUNT(*) as count FROM notifications; 