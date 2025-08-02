-- Test RLS Policies
-- Run this in your Supabase SQL Editor to test if the policies are working

-- Check if RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'leads', 'lead_orders', 'lead_order_items', 'lead_logs',
    'organisations', 'profiles', 'subscription_types', 
    'organisation_subscriptions', 'scanned_bills', 'bill_scans', 'notifications'
)
ORDER BY tablename;

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test data access (run this as an authenticated user)
-- This will help identify if the policies are working correctly

-- Test 1: Check if user can see their own profile
-- SELECT * FROM profiles WHERE id = auth.uid();

-- Test 2: Check if user can see their organisation
-- SELECT * FROM organisations WHERE id = (SELECT organisation_id FROM profiles WHERE id = auth.uid());

-- Test 3: Check if user can see leads in their organisation
-- SELECT * FROM leads WHERE organisation_id = (SELECT organisation_id FROM profiles WHERE id = auth.uid());

-- Test 4: Check if user can see orders in their organisation
-- SELECT * FROM lead_orders WHERE lead_id IN (
--     SELECT id FROM leads WHERE organisation_id = (SELECT organisation_id FROM profiles WHERE id = auth.uid())
-- );

-- Note: The commented queries above should be run in the context of an authenticated user
-- to properly test the RLS policies. You can run them in your application or
-- in the Supabase dashboard with proper authentication. 