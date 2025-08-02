-- Fix Table Structure Issues
-- Run this in your Supabase SQL Editor to check and fix table structure

-- First, let's check the actual structure of the lead_order_items table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lead_order_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if the column exists with a different name
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'lead_order_items' 
AND table_schema = 'public'
AND column_name LIKE '%order%';

-- If the column doesn't exist, let's add it
-- First, let's see what columns we actually have
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'lead_order_items' 
AND table_schema = 'public';

-- If the order_id column is missing, add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lead_order_items' 
        AND column_name = 'order_id'
        AND table_schema = 'public'
    ) THEN
        -- Add the missing order_id column
        ALTER TABLE lead_order_items ADD COLUMN order_id UUID REFERENCES lead_orders(id);
        
        -- If there's a column with a different name that should be order_id, rename it
        -- For example, if it's called 'order' or 'order_uuid'
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'lead_order_items' 
            AND column_name = 'order'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE lead_order_items RENAME COLUMN "order" TO order_id;
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'lead_order_items' 
            AND column_name = 'order_uuid'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE lead_order_items RENAME COLUMN order_uuid TO order_id;
        END IF;
    END IF;
END $$;

-- Let's also check and fix other potential column name issues
-- Check lead_orders table
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'lead_orders' 
AND table_schema = 'public';

-- Check if lead_id column exists in lead_orders
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lead_orders' 
        AND column_name = 'lead_id'
        AND table_schema = 'public'
    ) THEN
        -- Add the missing lead_id column
        ALTER TABLE lead_orders ADD COLUMN lead_id UUID REFERENCES leads(id);
    END IF;
END $$;

-- Check leads table
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND table_schema = 'public';

-- Check if organisation_id column exists in leads
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'organisation_id'
        AND table_schema = 'public'
    ) THEN
        -- Add the missing organisation_id column
        ALTER TABLE leads ADD COLUMN organisation_id UUID REFERENCES organisations(id);
    END IF;
END $$;

-- Check profiles table
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public';

-- Check if organisation_id column exists in profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'organisation_id'
        AND table_schema = 'public'
    ) THEN
        -- Add the missing organisation_id column
        ALTER TABLE profiles ADD COLUMN organisation_id UUID REFERENCES organisations(id);
    END IF;
END $$;

-- Now let's verify the structure is correct
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name IN ('leads', 'lead_orders', 'lead_order_items', 'profiles', 'organisations')
ORDER BY table_name, ordinal_position; 