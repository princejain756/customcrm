-- Fix storage buckets configuration
-- Drop existing bucket if it exists
DELETE FROM storage.buckets WHERE id = 'bill-scans';

-- Create storage bucket with proper configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bill-scans', 
  'bill-scans', 
  true, 
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
);

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to upload bill images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view bill images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update bill images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete bill images" ON storage.objects;

-- Create storage policies for bill-scans bucket
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