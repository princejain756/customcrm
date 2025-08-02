-- Add missing tables for ScanBill to Tally CRM
-- Run this in your Supabase SQL Editor

-- Create scanned_bills table
CREATE TABLE IF NOT EXISTS scanned_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  bill_number VARCHAR(255) NOT NULL,
  bill_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  gst_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  scanned_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bill_scans table (for bill scanning history)
CREATE TABLE IF NOT EXISTS bill_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  bill_number VARCHAR(255) NOT NULL,
  bill_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  gst_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  scanned_image_url TEXT,
  extracted_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scanned_bills_lead_id ON scanned_bills(lead_id);
CREATE INDEX IF NOT EXISTS idx_bill_scans_lead_id ON bill_scans(lead_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Enable RLS (Row Level Security) on new tables
ALTER TABLE scanned_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scanned_bills
CREATE POLICY "Users can view scanned bills from their organisation" ON scanned_bills
  FOR SELECT USING (
    lead_id IN (
      SELECT id FROM leads WHERE organisation_id IN (
        SELECT organisation_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert scanned bills for their organisation" ON scanned_bills
  FOR INSERT WITH CHECK (
    lead_id IN (
      SELECT id FROM leads WHERE organisation_id IN (
        SELECT organisation_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- RLS Policies for bill_scans
CREATE POLICY "Users can view bill scans from their organisation" ON bill_scans
  FOR SELECT USING (
    lead_id IN (
      SELECT id FROM leads WHERE organisation_id IN (
        SELECT organisation_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert bill scans for their organisation" ON bill_scans
  FOR INSERT WITH CHECK (
    lead_id IN (
      SELECT id FROM leads WHERE organisation_id IN (
        SELECT organisation_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notifications" ON notifications
  FOR INSERT WITH CHECK (user_id = auth.uid()); 