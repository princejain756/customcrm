-- Create order management tables for the CRM system
-- Note: users table already exists from main CRM setup

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  category VARCHAR(255) DEFAULT 'General',
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
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
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(255) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  order_date DATE NOT NULL,
  delivery_date DATE,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  payment_terms VARCHAR(20) DEFAULT 'net30' CHECK (payment_terms IN ('cod', 'net15', 'net30', 'net60')),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_address TEXT,
  billing_address TEXT,
  notes TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  product_sku VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,4) DEFAULT 0.18,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance

CREATE INDEX IF NOT EXISTS idx_products_organization_id ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

CREATE INDEX IF NOT EXISTS idx_customers_organization_id ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

CREATE INDEX IF NOT EXISTS idx_orders_organization_id ON orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing

-- Sample products
INSERT INTO products (sku, name, description, price, stock, category, organization_id, is_active) 
SELECT 
  'LAP-001', 'Premium Laptop', 'High-performance laptop with latest specs', 75000.00, 15, 'Electronics', id, true
FROM organizations 
WHERE name = 'Demo Company Ltd'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO products (sku, name, description, price, stock, category, organization_id, is_active) 
SELECT 
  'ACC-002', 'Wireless Mouse', 'Ergonomic wireless mouse', 1200.00, 50, 'Accessories', id, true
FROM organizations 
WHERE name = 'Demo Company Ltd'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO products (sku, name, description, price, stock, category, organization_id, is_active) 
SELECT 
  'FUR-003', 'Office Chair', 'Comfortable office chair with lumbar support', 8500.00, 8, 'Furniture', id, true
FROM organizations 
WHERE name = 'Demo Company Ltd'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO products (sku, name, description, price, stock, category, organization_id, is_active) 
SELECT 
  'ACC-004', 'Monitor Stand', 'Adjustable monitor stand', 2500.00, 25, 'Accessories', id, true
FROM organizations 
WHERE name = 'Demo Company Ltd'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO products (sku, name, description, price, stock, category, organization_id, is_active) 
SELECT 
  'LIT-005', 'Desk Lamp', 'LED desk lamp with adjustable brightness', 1800.00, 30, 'Lighting', id, true
FROM organizations 
WHERE name = 'Demo Company Ltd'
ON CONFLICT (sku) DO NOTHING;

-- Sample customers
INSERT INTO customers (name, email, phone, company, address, gstin, organization_id) 
SELECT 
  'John Doe', 'john@example.com', '+91 9876543210', 'Tech Solutions Ltd', '123 Business Park, Mumbai', 'GSTIN123456789', id
FROM organizations 
WHERE name = 'Demo Company Ltd';

INSERT INTO customers (name, email, phone, company, address, gstin, organization_id) 
SELECT 
  'Jane Smith', 'jane@example.com', '+91 9876543211', 'Digital Innovations', '456 Tech Street, Bangalore', 'GSTIN987654321', id
FROM organizations 
WHERE name = 'Demo Company Ltd';

INSERT INTO customers (name, email, phone, company, address, gstin, organization_id) 
SELECT 
  'Mike Johnson', 'mike@example.com', '+91 9876543212', 'Startup Ventures', '789 Innovation Road, Delhi', 'GSTIN456789123', id
FROM organizations 
WHERE name = 'Demo Company Ltd';
