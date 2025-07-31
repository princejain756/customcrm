-- CRM System Database Schema
-- Professional SaaS CRM with multi-tenant architecture

-- First, create enums for better data integrity
CREATE TYPE app_role AS ENUM ('admin', 'organisation_admin', 'manager', 'sales_person');
CREATE TYPE lead_status AS ENUM ('new', 'order_placed', 'procurement_sent', 'procurement_waiting', 'procurement_approved', 'bill_generated', 'closed', 'partial_procurement_sent', 'partial_procurement_waiting', 'partial_procurement_approved');
CREATE TYPE order_item_status AS ENUM ('procurement_sent', 'procurement_waiting', 'procurement_approved', 'bill_generated', 'closed');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'expired');
CREATE TYPE lead_source AS ENUM ('email', 'whatsapp', 'phone', 'website', 'referral', 'social_media', 'other');

-- Organizations table (multi-tenant)
CREATE TABLE public.organisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    gstin TEXT,
    state TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subscription types and pricing
CREATE TABLE public.subscription_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    no_of_leads INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    validity_days INTEGER NOT NULL DEFAULT 30,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organization subscriptions
CREATE TABLE public.organisation_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    subscription_type_id UUID NOT NULL REFERENCES public.subscription_types(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    expiry_date TIMESTAMPTZ NOT NULL,
    no_of_leads INTEGER NOT NULL DEFAULT 0,
    current_leads_count INTEGER NOT NULL DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_status payment_status NOT NULL DEFAULT 'pending',
    razorpay_payment_link TEXT,
    razorpay_payment_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User profiles with organisation mapping
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role app_role NOT NULL DEFAULT 'sales_person',
    dob DATE,
    address TEXT,
    phone TEXT,
    whatsapp_number TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leads management
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id TEXT UNIQUE NOT NULL, -- Custom lead ID format
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    from_source lead_source NOT NULL DEFAULT 'other',
    name TEXT NOT NULL,
    address TEXT,
    gstin TEXT,
    state TEXT,
    phone TEXT,
    email TEXT,
    date_open TIMESTAMPTZ NOT NULL DEFAULT now(),
    date_closed TIMESTAMPTZ,
    status lead_status NOT NULL DEFAULT 'new',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead orders
CREATE TABLE public.lead_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no TEXT UNIQUE NOT NULL,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    total_value DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_items INTEGER NOT NULL DEFAULT 0,
    total_gst DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead order items
CREATE TABLE public.lead_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_order_id UUID NOT NULL REFERENCES public.lead_orders(id) ON DELETE CASCADE,
    product_sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    procurement_price DECIMAL(10,2),
    bill_price DECIMAL(10,2),
    total_value DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_gst DECIMAL(12,2) NOT NULL DEFAULT 0,
    status order_item_status NOT NULL DEFAULT 'procurement_sent',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead activity logs
CREATE TABLE public.lead_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    lead_order_item_id UUID REFERENCES public.lead_order_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    from_status TEXT,
    to_status TEXT,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for better performance
CREATE INDEX idx_organisations_email ON public.organisations(email);
CREATE INDEX idx_profiles_organisation ON public.profiles(organisation_id);
CREATE INDEX idx_leads_organisation ON public.leads(organisation_id);
CREATE INDEX idx_leads_user ON public.leads(user_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_date_open ON public.leads(date_open);
CREATE INDEX idx_lead_orders_lead ON public.lead_orders(lead_id);
CREATE INDEX idx_lead_order_items_order ON public.lead_order_items(lead_order_id);
CREATE INDEX idx_lead_logs_lead ON public.lead_logs(lead_id);

-- Enable RLS on all tables
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organisation ID
CREATE OR REPLACE FUNCTION get_user_organisation_id(user_uuid UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT organisation_id FROM public.profiles WHERE id = user_uuid;
$$;

-- Helper function to check if user has admin role
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_uuid AND role = 'admin'
  );
$$;

-- Helper function to check if user has organisation admin role
CREATE OR REPLACE FUNCTION is_organisation_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_uuid AND role IN ('admin', 'organisation_admin')
  );
$$;

-- RLS Policies

-- Organisations: Admin can see all, others see only their own
CREATE POLICY "organisations_select" ON public.organisations
  FOR SELECT USING (
    is_admin(auth.uid()) OR 
    id = get_user_organisation_id(auth.uid())
  );

CREATE POLICY "organisations_insert" ON public.organisations
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "organisations_update" ON public.organisations
  FOR UPDATE USING (
    is_admin(auth.uid()) OR 
    (id = get_user_organisation_id(auth.uid()) AND is_organisation_admin(auth.uid()))
  );

CREATE POLICY "organisations_delete" ON public.organisations
  FOR DELETE USING (is_admin(auth.uid()));

-- Subscription types: All authenticated users can read, only admin can modify
CREATE POLICY "subscription_types_select" ON public.subscription_types
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "subscription_types_insert" ON public.subscription_types
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "subscription_types_update" ON public.subscription_types
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "subscription_types_delete" ON public.subscription_types
  FOR DELETE USING (is_admin(auth.uid()));

-- Organisation subscriptions: Admin sees all, others see only their organisation's
CREATE POLICY "organisation_subscriptions_select" ON public.organisation_subscriptions
  FOR SELECT USING (
    is_admin(auth.uid()) OR 
    organisation_id = get_user_organisation_id(auth.uid())
  );

CREATE POLICY "organisation_subscriptions_insert" ON public.organisation_subscriptions
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "organisation_subscriptions_update" ON public.organisation_subscriptions
  FOR UPDATE USING (
    is_admin(auth.uid()) OR 
    (organisation_id = get_user_organisation_id(auth.uid()) AND is_organisation_admin(auth.uid()))
  );

-- Profiles: Users see profiles in their organisation, admins see all
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    is_admin(auth.uid()) OR 
    organisation_id = get_user_organisation_id(auth.uid()) OR
    id = auth.uid()
  );

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (
    is_admin(auth.uid()) OR 
    (organisation_id = get_user_organisation_id(auth.uid()) AND is_organisation_admin(auth.uid()))
  );

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (
    id = auth.uid() OR
    is_admin(auth.uid()) OR 
    (organisation_id = get_user_organisation_id(auth.uid()) AND is_organisation_admin(auth.uid()))
  );

-- Leads: Users see leads in their organisation
CREATE POLICY "leads_select" ON public.leads
  FOR SELECT USING (
    is_admin(auth.uid()) OR 
    organisation_id = get_user_organisation_id(auth.uid())
  );

CREATE POLICY "leads_insert" ON public.leads
  FOR INSERT WITH CHECK (
    is_admin(auth.uid()) OR 
    organisation_id = get_user_organisation_id(auth.uid())
  );

CREATE POLICY "leads_update" ON public.leads
  FOR UPDATE USING (
    is_admin(auth.uid()) OR 
    organisation_id = get_user_organisation_id(auth.uid())
  );

CREATE POLICY "leads_delete" ON public.leads
  FOR DELETE USING (
    is_admin(auth.uid()) OR 
    (organisation_id = get_user_organisation_id(auth.uid()) AND is_organisation_admin(auth.uid()))
  );

-- Lead orders: Follow same pattern as leads
CREATE POLICY "lead_orders_select" ON public.lead_orders
  FOR SELECT USING (
    is_admin(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM public.leads 
      WHERE leads.id = lead_orders.lead_id 
      AND leads.organisation_id = get_user_organisation_id(auth.uid())
    )
  );

CREATE POLICY "lead_orders_insert" ON public.lead_orders
  FOR INSERT WITH CHECK (
    is_admin(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM public.leads 
      WHERE leads.id = lead_orders.lead_id 
      AND leads.organisation_id = get_user_organisation_id(auth.uid())
    )
  );

CREATE POLICY "lead_orders_update" ON public.lead_orders
  FOR UPDATE USING (
    is_admin(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM public.leads 
      WHERE leads.id = lead_orders.lead_id 
      AND leads.organisation_id = get_user_organisation_id(auth.uid())
    )
  );

-- Lead order items: Follow same pattern
CREATE POLICY "lead_order_items_select" ON public.lead_order_items
  FOR SELECT USING (
    is_admin(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM public.lead_orders lo
      JOIN public.leads l ON l.id = lo.lead_id
      WHERE lo.id = lead_order_items.lead_order_id 
      AND l.organisation_id = get_user_organisation_id(auth.uid())
    )
  );

CREATE POLICY "lead_order_items_insert" ON public.lead_order_items
  FOR INSERT WITH CHECK (
    is_admin(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM public.lead_orders lo
      JOIN public.leads l ON l.id = lo.lead_id
      WHERE lo.id = lead_order_items.lead_order_id 
      AND l.organisation_id = get_user_organisation_id(auth.uid())
    )
  );

CREATE POLICY "lead_order_items_update" ON public.lead_order_items
  FOR UPDATE USING (
    is_admin(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM public.lead_orders lo
      JOIN public.leads l ON l.id = lo.lead_id
      WHERE lo.id = lead_order_items.lead_order_id 
      AND l.organisation_id = get_user_organisation_id(auth.uid())
    )
  );

-- Lead logs: Read-only for organisation users, write access for all
CREATE POLICY "lead_logs_select" ON public.lead_logs
  FOR SELECT USING (
    is_admin(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM public.leads 
      WHERE leads.id = lead_logs.lead_id 
      AND leads.organisation_id = get_user_organisation_id(auth.uid())
    )
  );

CREATE POLICY "lead_logs_insert" ON public.lead_logs
  FOR INSERT WITH CHECK (
    is_admin(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM public.leads 
      WHERE leads.id = lead_logs.lead_id 
      AND leads.organisation_id = get_user_organisation_id(auth.uid())
    )
  );

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organisations_updated_at
    BEFORE UPDATE ON public.organisations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_types_updated_at
    BEFORE UPDATE ON public.subscription_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organisation_subscriptions_updated_at
    BEFORE UPDATE ON public.organisation_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_orders_updated_at
    BEFORE UPDATE ON public.lead_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_order_items_updated_at
    BEFORE UPDATE ON public.lead_order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    'sales_person'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate lead ID
CREATE OR REPLACE FUNCTION generate_lead_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_id TEXT;
    counter INTEGER;
BEGIN
    -- Get the current count of leads for today
    SELECT COUNT(*) + 1 INTO counter
    FROM public.leads 
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Format: LD-YYYYMMDD-XXX
    new_id := 'LD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 3, '0');
    
    RETURN new_id;
END;
$$;

-- Function to auto-generate order number
CREATE OR REPLACE FUNCTION generate_order_no()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_id TEXT;
    counter INTEGER;
BEGIN
    -- Get the current count of orders for today
    SELECT COUNT(*) + 1 INTO counter
    FROM public.lead_orders 
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Format: ORD-YYYYMMDD-XXX
    new_id := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 3, '0');
    
    RETURN new_id;
END;
$$;

-- Insert default subscription types
INSERT INTO public.subscription_types (name, no_of_leads, price, validity_days, description) VALUES
('Basic', 100, 999.00, 30, 'Basic plan with 100 leads per month'),
('Professional', 500, 2999.00, 30, 'Professional plan with 500 leads per month'),
('Enterprise', 2000, 9999.00, 30, 'Enterprise plan with 2000 leads per month'),
('Unlimited', -1, 19999.00, 30, 'Unlimited leads per month for large organizations');