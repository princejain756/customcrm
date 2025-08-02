-- Complete Database Setup for ScanBill to Tally CRM
-- Copy and paste this entire file into your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organisations table
CREATE TABLE IF NOT EXISTS organisations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  gstin VARCHAR(15),
  state VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription_types table
CREATE TABLE IF NOT EXISTS subscription_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  no_of_leads INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  validity_days INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organisation_subscriptions table
CREATE TABLE IF NOT EXISTS organisation_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  subscription_type_id UUID REFERENCES subscription_types(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  no_of_leads INTEGER NOT NULL,
  current_leads_count INTEGER DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'expired')),
  razorpay_payment_link TEXT,
  razorpay_payment_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id VARCHAR(255) UNIQUE NOT NULL,
  organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_source VARCHAR(50) NOT NULL CHECK (from_source IN ('email', 'whatsapp', 'phone', 'website', 'referral', 'social_media', 'other')),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  gstin VARCHAR(15),
  state VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  date_open DATE NOT NULL,
  date_closed DATE,
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'order_placed', 'procurement_sent', 'procurement_waiting', 'procurement_approved', 'bill_generated', 'closed', 'partial_procurement_sent', 'partial_procurement_waiting', 'partial_procurement_approved')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead_orders table
CREATE TABLE IF NOT EXISTS lead_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_no VARCHAR(255) UNIQUE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  total_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_items INTEGER NOT NULL DEFAULT 0,
  total_gst DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead_order_items table
CREATE TABLE IF NOT EXISTS lead_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_order_id UUID REFERENCES lead_orders(id) ON DELETE CASCADE,
  product_sku VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  procurement_price DECIMAL(10,2),
  bill_price DECIMAL(10,2),
  total_value DECIMAL(10,2) NOT NULL,
  total_gst DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'procurement_sent' CHECK (status IN ('procurement_sent', 'procurement_waiting', 'procurement_approved', 'bill_generated', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead_logs table
CREATE TABLE IF NOT EXISTS lead_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  lead_order_item_id UUID REFERENCES lead_order_items(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_status VARCHAR(50),
  to_status VARCHAR(50),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Update profiles table to match our application requirements
DO $$ 
BEGIN
    -- Add organisation_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'organisation_id') THEN
        ALTER TABLE profiles ADD COLUMN organisation_id UUID REFERENCES organisations(id) ON DELETE SET NULL;
    END IF;

    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role VARCHAR(50) DEFAULT 'sales_person' CHECK (role IN ('admin', 'organisation_admin', 'manager', 'sales_person'));
    END IF;

    -- Add dob column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'dob') THEN
        ALTER TABLE profiles ADD COLUMN dob DATE;
    END IF;

    -- Add address column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address') THEN
        ALTER TABLE profiles ADD COLUMN address TEXT;
    END IF;

    -- Add phone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE profiles ADD COLUMN phone VARCHAR(20);
    END IF;

    -- Add whatsapp_number column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'whatsapp_number') THEN
        ALTER TABLE profiles ADD COLUMN whatsapp_number VARCHAR(20);
    END IF;

    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_active') THEN
        ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_organisation_id ON leads(organisation_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_date_open ON leads(date_open);

CREATE INDEX IF NOT EXISTS idx_lead_orders_lead_id ON lead_orders(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_order_items_order_id ON lead_order_items(lead_order_id);
CREATE INDEX IF NOT EXISTS idx_lead_order_items_status ON lead_order_items(status);

CREATE INDEX IF NOT EXISTS idx_lead_logs_lead_id ON lead_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_logs_user_id ON lead_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_scanned_bills_lead_id ON scanned_bills(lead_id);
CREATE INDEX IF NOT EXISTS idx_bill_scans_lead_id ON bill_scans(lead_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_profiles_organisation_id ON profiles(organisation_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Create RLS (Row Level Security) policies
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanned_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organisations
CREATE POLICY "Users can view their own organisation" ON organisations
  FOR SELECT USING (id IN (
    SELECT organisation_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can view all organisations" ON organisations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for leads
CREATE POLICY "Users can view leads from their organisation" ON leads
  FOR SELECT USING (
    organisation_id IN (
      SELECT organisation_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert leads for their organisation" ON leads
  FOR INSERT WITH CHECK (
    organisation_id IN (
      SELECT organisation_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update leads from their organisation" ON leads
  FOR UPDATE USING (
    organisation_id IN (
      SELECT organisation_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for lead_orders
CREATE POLICY "Users can view orders from their organisation" ON lead_orders
  FOR SELECT USING (
    lead_id IN (
      SELECT id FROM leads WHERE organisation_id IN (
        SELECT organisation_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert orders for their organisation" ON lead_orders
  FOR INSERT WITH CHECK (
    lead_id IN (
      SELECT id FROM leads WHERE organisation_id IN (
        SELECT organisation_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- RLS Policies for lead_order_items
CREATE POLICY "Users can view order items from their organisation" ON lead_order_items
  FOR SELECT USING (
    lead_order_id IN (
      SELECT id FROM lead_orders WHERE lead_id IN (
        SELECT id FROM leads WHERE organisation_id IN (
          SELECT organisation_id FROM profiles WHERE id = auth.uid()
        )
      )
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can view profiles from their organisation" ON profiles
  FOR SELECT USING (
    organisation_id IN (
      SELECT organisation_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert some sample subscription types
INSERT INTO subscription_types (name, no_of_leads, price, validity_days, description) VALUES
('Basic', 100, 999.00, 30, 'Basic plan for small businesses'),
('Professional', 500, 2999.00, 30, 'Professional plan for growing businesses'),
('Enterprise', 2000, 9999.00, 30, 'Enterprise plan for large organizations');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_organisations_updated_at BEFORE UPDATE ON organisations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_types_updated_at BEFORE UPDATE ON subscription_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organisation_subscriptions_updated_at BEFORE UPDATE ON organisation_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lead_orders_updated_at BEFORE UPDATE ON lead_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lead_order_items_updated_at BEFORE UPDATE ON lead_order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO organisations (name, phone, email, address, gstin, state) VALUES
('Sample Company Ltd', '+91-9876543210', 'info@samplecompany.com', '123 Business Street, Mumbai, Maharashtra', '27AABCS1234A1Z5', 'Maharashtra');

-- Update the first user to be an admin and assign to the sample organisation
UPDATE profiles 
SET role = 'admin', organisation_id = (SELECT id FROM organisations LIMIT 1)
WHERE id = (SELECT id FROM auth.users LIMIT 1); 