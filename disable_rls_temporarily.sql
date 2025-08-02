-- Temporarily disable RLS for testing
-- Run this in your Supabase SQL Editor to test if RLS is causing the issue

-- Disable RLS on all tables
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE lead_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE lead_order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE lead_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE organisations DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE scanned_bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE bill_scans DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Note: This is for testing only. In production, you should enable RLS with proper policies. 