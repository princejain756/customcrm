-- Complete Database Setup Script for CRM Application
-- This script creates all necessary tables, indexes, and sample data

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

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role app_role DEFAULT 'sales_person',
  organization_id UUID REFERENCES organisations(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  company VARCHAR(255),
  address TEXT,
  gstin VARCHAR(15),
  billing_address TEXT,
  shipping_address TEXT,
  organization_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  category VARCHAR(100),
  organization_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(100) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  order_date DATE NOT NULL,
  delivery_date DATE,
  status VARCHAR(50) DEFAULT 'draft',
  priority VARCHAR(20) DEFAULT 'medium',
  payment_terms VARCHAR(50) DEFAULT 'net30',
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  shipping_address TEXT,
  billing_address TEXT,
  notes TEXT,
  organization_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_sku VARCHAR(100),
  product_name VARCHAR(255),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,4) DEFAULT 0.18,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  company VARCHAR(255),
  position VARCHAR(100),
  address TEXT,
  source lead_source DEFAULT 'other',
  status lead_status DEFAULT 'new',
  priority VARCHAR(20) DEFAULT 'medium',
  notes TEXT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead_activities table
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scanned_bills table
CREATE TABLE IF NOT EXISTS scanned_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  bill_number VARCHAR(100),
  bill_date DATE,
  vendor_name VARCHAR(255),
  total_amount DECIMAL(10,2),
  tax_amount DECIMAL(10,2),
  file_path VARCHAR(500),
  ocr_data JSONB,
  organization_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bill_items table
CREATE TABLE IF NOT EXISTS bill_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID REFERENCES scanned_bills(id) ON DELETE CASCADE,
  item_name VARCHAR(255),
  quantity INTEGER,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  tax_rate DECIMAL(5,4),
  tax_amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_customers_organization_id ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

CREATE INDEX IF NOT EXISTS idx_products_organization_id ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

CREATE INDEX IF NOT EXISTS idx_orders_organization_id ON orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_leads_organization_id ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_by ON lead_activities(created_by);
CREATE INDEX IF NOT EXISTS idx_lead_activities_activity_date ON lead_activities(activity_date);

CREATE INDEX IF NOT EXISTS idx_scanned_bills_lead_id ON scanned_bills(lead_id);
CREATE INDEX IF NOT EXISTS idx_scanned_bills_organization_id ON scanned_bills(organization_id);
CREATE INDEX IF NOT EXISTS idx_scanned_bills_bill_date ON scanned_bills(bill_date);

CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_organisations_updated_at BEFORE UPDATE ON organisations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scanned_bills_updated_at BEFORE UPDATE ON scanned_bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default organization
INSERT INTO organisations (name, email, phone, address) 
VALUES ('Default Organization', 'admin@example.com', '+91-9876543210', '123 Main Street, City, State 12345')
ON CONFLICT DO NOTHING;

-- Insert default admin user (password: admin123)
-- The password hash is for 'admin123' using bcrypt with 12 rounds
INSERT INTO users (email, password_hash, name, role, organization_id, is_active) 
VALUES (
  'admin@example.com', 
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK6', 
  'Admin User', 
  'admin', 
  (SELECT id FROM organisations LIMIT 1),
  true
) ON CONFLICT (email) DO NOTHING;

-- Insert sample data for testing

-- Sample customers
INSERT INTO customers (name, email, phone, company, address, gstin, organization_id) VALUES
('John Doe', 'john.doe@example.com', '+91-9876543211', 'ABC Company', '456 Business Ave, City, State 12345', '22AAAAA0000A1Z5', (SELECT id FROM organisations LIMIT 1)),
('Jane Smith', 'jane.smith@example.com', '+91-9876543212', 'XYZ Corporation', '789 Corporate Blvd, City, State 12345', '33BBBBB0000B1Z5', (SELECT id FROM organisations LIMIT 1)),
('Mike Johnson', 'mike.johnson@example.com', '+91-9876543213', 'Tech Solutions', '321 Tech Street, City, State 12345', '44CCCCC0000C1Z5', (SELECT id FROM organisations LIMIT 1))
ON CONFLICT DO NOTHING;

-- Sample products
INSERT INTO products (sku, name, description, price, stock, category, organization_id) VALUES
('PROD-001', 'Laptop Computer', 'High-performance laptop with latest specifications', 45000.00, 10, 'Electronics', (SELECT id FROM organisations LIMIT 1)),
('PROD-002', 'Office Chair', 'Ergonomic office chair with adjustable features', 8500.00, 25, 'Furniture', (SELECT id FROM organisations LIMIT 1)),
('PROD-003', 'Printer', 'Wireless all-in-one printer with scanning capabilities', 12000.00, 8, 'Electronics', (SELECT id FROM organisations LIMIT 1)),
('PROD-004', 'Desk', 'Modern office desk with storage compartments', 6500.00, 15, 'Furniture', (SELECT id FROM organisations LIMIT 1)),
('PROD-005', 'Monitor', '24-inch LED monitor with HD resolution', 8500.00, 12, 'Electronics', (SELECT id FROM organisations LIMIT 1))
ON CONFLICT DO NOTHING;

-- Sample leads
INSERT INTO leads (name, email, phone, company, position, address, source, status, priority, notes, assigned_to, organization_id, created_by) VALUES
('Alice Brown', 'alice.brown@example.com', '+91-9876543214', 'Startup Inc', 'CEO', '123 Startup Lane, City, State 12345', 'website', 'new', 'high', 'Interested in office setup', (SELECT id FROM users WHERE email = 'admin@example.com'), (SELECT id FROM organisations LIMIT 1), (SELECT id FROM users WHERE email = 'admin@example.com')),
('Bob Wilson', 'bob.wilson@example.com', '+91-9876543215', 'Tech Corp', 'CTO', '456 Tech Road, City, State 12345', 'referral', 'procurement_waiting', 'medium', 'Looking for IT equipment', (SELECT id FROM users WHERE email = 'admin@example.com'), (SELECT id FROM organisations LIMIT 1), (SELECT id FROM users WHERE email = 'admin@example.com')),
('Carol Davis', 'carol.davis@example.com', '+91-9876543216', 'Design Studio', 'Manager', '789 Design Street, City, State 12345', 'email', 'order_placed', 'low', 'Office furniture requirements', (SELECT id FROM users WHERE email = 'admin@example.com'), (SELECT id FROM organisations LIMIT 1), (SELECT id FROM users WHERE email = 'admin@example.com'))
ON CONFLICT DO NOTHING;

-- Sample orders
INSERT INTO orders (order_number, customer_id, order_date, delivery_date, status, priority, payment_terms, subtotal, tax_amount, discount_amount, total_amount, notes, organization_id, created_by) VALUES
('ORD-2024001', (SELECT id FROM customers WHERE email = 'john.doe@example.com'), '2024-01-15', '2024-01-20', 'confirmed', 'high', 'net30', 45000.00, 8100.00, 0.00, 53100.00, 'Urgent delivery required', (SELECT id FROM organisations LIMIT 1), (SELECT id FROM users WHERE email = 'admin@example.com')),
('ORD-2024002', (SELECT id FROM customers WHERE email = 'jane.smith@example.com'), '2024-01-16', '2024-01-25', 'draft', 'medium', 'net30', 8500.00, 1530.00, 500.00, 9530.00, 'Standard delivery', (SELECT id FROM organisations LIMIT 1), (SELECT id FROM users WHERE email = 'admin@example.com'))
ON CONFLICT DO NOTHING;

-- Sample order items
INSERT INTO order_items (order_id, product_id, product_sku, product_name, quantity, unit_price, discount, total_price, tax_rate, tax_amount) VALUES
((SELECT id FROM orders WHERE order_number = 'ORD-2024001'), (SELECT id FROM products WHERE sku = 'PROD-001'), 'PROD-001', 'Laptop Computer', 1, 45000.00, 0.00, 53100.00, 0.18, 8100.00),
((SELECT id FROM orders WHERE order_number = 'ORD-2024002'), (SELECT id FROM products WHERE sku = 'PROD-002'), 'PROD-002', 'Office Chair', 1, 8500.00, 500.00, 9530.00, 0.18, 1530.00)
ON CONFLICT DO NOTHING;

-- Sample lead activities
INSERT INTO lead_activities (lead_id, activity_type, title, description, created_by) VALUES
((SELECT id FROM leads WHERE email = 'alice.brown@example.com'), 'note', 'Lead Created', 'Lead created by Admin User', (SELECT id FROM users WHERE email = 'admin@example.com')),
((SELECT id FROM leads WHERE email = 'alice.brown@example.com'), 'call', 'Initial Contact', 'Called to discuss office setup requirements', (SELECT id FROM users WHERE email = 'admin@example.com')),
((SELECT id FROM leads WHERE email = 'bob.wilson@example.com'), 'note', 'Lead Created', 'Lead created by Admin User', (SELECT id FROM users WHERE email = 'admin@example.com')),
((SELECT id FROM leads WHERE email = 'bob.wilson@example.com'), 'meeting', 'Product Demo', 'Scheduled product demonstration for IT equipment', (SELECT id FROM users WHERE email = 'admin@example.com'))
ON CONFLICT DO NOTHING;

-- Sample notifications
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
((SELECT id FROM users WHERE email = 'admin@example.com'), 'New Lead Assigned', 'Alice Brown has been assigned to you', 'info', false),
((SELECT id FROM users WHERE email = 'admin@example.com'), 'Order Confirmed', 'Order ORD-2024001 has been confirmed', 'success', false),
((SELECT id FROM users WHERE email = 'admin@example.com'), 'Payment Received', 'Payment received for order ORD-2024001', 'success', true)
ON CONFLICT DO NOTHING;

-- Grant permissions to the application user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO crmuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO crmuser;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO crmuser;

-- Create a view for dashboard statistics
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    o.id as organization_id,
    COUNT(DISTINCT c.id) as total_customers,
    COUNT(DISTINCT p.id) as total_products,
    COUNT(DISTINCT l.id) as total_leads,
    COUNT(DISTINCT ord.id) as total_orders,
    COALESCE(SUM(ord.total_amount), 0) as total_revenue,
    COUNT(DISTINCT CASE WHEN l.status = 'new' THEN l.id END) as new_leads,
    COUNT(DISTINCT CASE WHEN ord.status = 'draft' THEN ord.id END) as pending_orders
FROM organisations o
LEFT JOIN customers c ON c.organization_id = o.id
LEFT JOIN products p ON p.organization_id = o.id
LEFT JOIN leads l ON l.organization_id = o.id
LEFT JOIN orders ord ON ord.organization_id = o.id
GROUP BY o.id;

-- Grant access to the view
GRANT SELECT ON dashboard_stats TO crmuser;

-- Display setup completion message
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'Default admin user: admin@example.com / admin123';
    RAISE NOTICE 'Sample data has been inserted for testing.';
END $$; 