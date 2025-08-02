-- Run all migrations to fix database issues
-- This script should be run in your Supabase SQL editor

-- 1. Fix storage buckets
DELETE FROM storage.buckets WHERE id = 'bill-scans';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bill-scans', 
  'bill-scans', 
  true, 
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
);

-- 2. Drop existing storage policies
DROP POLICY IF EXISTS "Allow authenticated users to upload bill images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view bill images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update bill images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete bill images" ON storage.objects;

-- 3. Create new storage policies
CREATE POLICY "Allow authenticated users to upload bill images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'bill-scans' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to view bill images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'bill-scans' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to update bill images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'bill-scans' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete bill images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'bill-scans' AND 
  auth.role() = 'authenticated'
);

-- 4. Ensure proper foreign key relationships exist
-- Check if the leads table has the correct foreign key to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'leads_user_id_fkey' 
    AND table_name = 'leads'
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT leads_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 5. Create any missing indexes
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organisation_id ON profiles(organisation_id);

-- 6. Verify the setup
SELECT 'Storage bucket created successfully' as status WHERE EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'bill-scans'
);

SELECT 'Foreign key constraint exists' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.table_constraints 
  WHERE constraint_name = 'leads_user_id_fkey' 
  AND table_name = 'leads'
); 