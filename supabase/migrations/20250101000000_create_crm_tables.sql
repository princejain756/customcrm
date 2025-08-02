-- Create CRM tables for ScanBill to Tally application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE app_role AS ENUM ('admin', 'organisation_admin', 'manager', 'sales_person');
CREATE TYPE lead_status AS ENUM ('new', 'order_placed', 'procurement_sent', 'procurement_waiting', 'procurement_approved', 'bill_generated', 'closed', 'partial_procurement_sent', 'partial_procurement_waiting', 'partial_procurement_approved');
CREATE TYPE order_item_status AS ENUM ('procurement_sent', 'procurement_waiting', 'procurement_approved', 'bill_generated', 'closed');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'expired');
CREATE TYPE lead_source AS ENUM ('email', 'whatsapp', 'phone', 'website', 'referral', 'social_media', 'other');

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

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id UUID REFERENCES organisations(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  role app_role DEFAULT 'sales_person',
  dob DATE,
  address TEXT,
  phone VARCHAR(20),
  whatsapp_number VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
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
  payment_status payment_status DEFAULT 'pending',
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
  from_source lead_source NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  gstin VARCHAR(15),
  state VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  date_open DATE NOT NULL,
  date_closed DATE,
  status lead_status DEFAULT 'new',
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
  status order_item_status DEFAULT 'procurement_sent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead_logs table
CREATE TABLE IF NOT EXISTS lead_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  lead_order_item_id UUID REFERENCES lead_order_items(id) ON DELETE CASCADE,
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
  items JSONB,
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
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanned_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can delete leads from their organisation" ON leads
  FOR DELETE USING (
    organisation_id IN (
      SELECT organisation_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for lead_orders
CREATE POLICY "Users can view orders from their organisation" ON lead_orders
  FOR SELECT USING (
    lead_id IN (
      SELECT l.id FROM leads l
      JOIN profiles p ON l.organisation_id = p.organisation_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert orders for their organisation" ON lead_orders
  FOR INSERT WITH CHECK (
    lead_id IN (
      SELECT l.id FROM leads l
      JOIN profiles p ON l.organisation_id = p.organisation_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can update orders from their organisation" ON lead_orders
  FOR UPDATE USING (
    lead_id IN (
      SELECT l.id FROM leads l
      JOIN profiles p ON l.organisation_id = p.organisation_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete orders from their organisation" ON lead_orders
  FOR DELETE USING (
    lead_id IN (
      SELECT l.id FROM leads l
      JOIN profiles p ON l.organisation_id = p.organisation_id
      WHERE p.id = auth.uid()
    )
  );

-- RLS Policies for lead_order_items
CREATE POLICY "Users can view order items from their organisation" ON lead_order_items
  FOR SELECT USING (
    lead_order_id IN (
      SELECT lo.id FROM lead_orders lo
      JOIN leads l ON lo.lead_id = l.id
      JOIN profiles p ON l.organisation_id = p.organisation_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert order items for their organisation" ON lead_order_items
  FOR INSERT WITH CHECK (
    lead_order_id IN (
      SELECT lo.id FROM lead_orders lo
      JOIN leads l ON lo.lead_id = l.id
      JOIN profiles p ON l.organisation_id = p.organisation_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can update order items from their organisation" ON lead_order_items
  FOR UPDATE USING (
    lead_order_id IN (
      SELECT lo.id FROM lead_orders lo
      JOIN leads l ON lo.lead_id = l.id
      JOIN profiles p ON l.organisation_id = p.organisation_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete order items from their organisation" ON lead_order_items
  FOR DELETE USING (
    lead_order_id IN (
      SELECT lo.id FROM lead_orders lo
      JOIN leads l ON lo.lead_id = l.id
      JOIN profiles p ON l.organisation_id = p.organisation_id
      WHERE p.id = auth.uid()
    )
  );

-- RLS Policies for lead_logs
CREATE POLICY "Users can view logs from their organisation" ON lead_logs
  FOR SELECT USING (
    lead_id IN (
      SELECT l.id FROM leads l
      JOIN profiles p ON l.organisation_id = p.organisation_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert logs for their organisation" ON lead_logs
  FOR INSERT WITH CHECK (
    lead_id IN (
      SELECT l.id FROM leads l
      JOIN profiles p ON l.organisation_id = p.organisation_id
      WHERE p.id = auth.uid()
    )
  );

-- RLS Policies for scanned_bills
CREATE POLICY "Users can view scanned bills from their organisation" ON scanned_bills
  FOR SELECT USING (
    lead_id IN (
      SELECT l.id FROM leads l
      JOIN profiles p ON l.organisation_id = p.organisation_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert scanned bills for their organisation" ON scanned_bills
  FOR INSERT WITH CHECK (
    lead_id IN (
      SELECT l.id FROM leads l
      JOIN profiles p ON l.organisation_id = p.organisation_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can update scanned bills from their organisation" ON scanned_bills
  FOR UPDATE USING (
    lead_id IN (
      SELECT l.id FROM leads l
      JOIN profiles p ON l.organisation_id = p.organisation_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete scanned bills from their organisation" ON scanned_bills
  FOR DELETE USING (
    lead_id IN (
      SELECT l.id FROM leads l
      JOIN profiles p ON l.organisation_id = p.organisation_id
      WHERE p.id = auth.uid()
    )
  );

-- RLS Policies for bill_scans
CREATE POLICY "Users can view bill scans from their organisation" ON bill_scans
  FOR SELECT USING (
    lead_id IN (
      SELECT l.id FROM leads l
      JOIN profiles p ON l.organisation_id = p.organisation_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert bill scans for their organisation" ON bill_scans
  FOR INSERT WITH CHECK (
    lead_id IN (
      SELECT l.id FROM leads l
      JOIN profiles p ON l.organisation_id = p.organisation_id
      WHERE p.id = auth.uid()
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notifications" ON notifications
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create functions
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