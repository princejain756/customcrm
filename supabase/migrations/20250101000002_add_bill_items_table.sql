-- Add bill_items table for storing individual items in scanned bills
CREATE TABLE IF NOT EXISTS bill_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scanned_bill_id UUID REFERENCES scanned_bills(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  gst_rate DECIMAL(5,2) NOT NULL DEFAULT 18,
  gst_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add items column to scanned_bills table as JSONB for backward compatibility
ALTER TABLE scanned_bills ADD COLUMN IF NOT EXISTS items JSONB;

-- Create indexes for bill_items
CREATE INDEX IF NOT EXISTS idx_bill_items_scanned_bill_id ON bill_items(scanned_bill_id);

-- Enable RLS for bill_items
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bill_items
CREATE POLICY "Users can view bill items from their organisation" ON bill_items
  FOR SELECT USING (
    scanned_bill_id IN (
      SELECT sb.id FROM scanned_bills sb
      JOIN leads l ON sb.lead_id = l.id
      JOIN profiles p ON l.organisation_id = p.organisation_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert bill items for their organisation" ON bill_items
  FOR INSERT WITH CHECK (
    scanned_bill_id IN (
      SELECT sb.id FROM scanned_bills sb
      JOIN leads l ON sb.lead_id = l.id
      JOIN profiles p ON l.organisation_id = p.organisation_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can update bill items from their organisation" ON bill_items
  FOR UPDATE USING (
    scanned_bill_id IN (
      SELECT sb.id FROM scanned_bills sb
      JOIN leads l ON sb.lead_id = l.id
      JOIN profiles p ON l.organisation_id = p.organisation_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete bill items from their organisation" ON bill_items
  FOR DELETE USING (
    scanned_bill_id IN (
      SELECT sb.id FROM scanned_bills sb
      JOIN leads l ON sb.lead_id = l.id
      JOIN profiles p ON l.organisation_id = p.organisation_id
      WHERE p.id = auth.uid()
    )
  ); 