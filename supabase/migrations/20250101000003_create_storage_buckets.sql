-- Create storage buckets for bill images
INSERT INTO storage.buckets (id, name, public)
VALUES ('bill-scans', 'bill-scans', true)
ON CONFLICT (id) DO NOTHING;

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