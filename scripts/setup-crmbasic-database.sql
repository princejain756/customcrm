-- Setup script for CRM Basic Database
-- This script creates the crmbasic database and all necessary tables

-- Create database (run this separately if needed)
-- CREATE DATABASE crmbasic;

-- Connect to crmbasic database before running the rest

-- Enable UUID extension for unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS lead_activities CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Create organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    gstin VARCHAR(15),
    state VARCHAR(100),
    website VARCHAR(255),
    industry VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'sales_person',
    organization_id UUID REFERENCES organizations(id),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create leads table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    company VARCHAR(255),
    position VARCHAR(255),
    address TEXT,
    source VARCHAR(100),
    status VARCHAR(50) DEFAULT 'new',
    priority VARCHAR(20) DEFAULT 'medium',
    notes TEXT,
    assigned_to UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create lead activities table for tracking lead interactions
CREATE TABLE lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL, -- 'email', 'call', 'meeting', 'note', 'status_change'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_priority ON leads(priority);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_organization_id ON leads(organization_id);
CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_activity_date ON lead_activities(activity_date);

-- Create function to automatically generate lead numbers
CREATE OR REPLACE FUNCTION generate_lead_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
    lead_prefix VARCHAR(10) := 'LEAD-';
BEGIN
    -- Get the next sequence number
    SELECT COALESCE(MAX(CAST(SUBSTRING(lead_number FROM 6) AS INTEGER)), 0) + 1
    INTO next_number
    FROM leads
    WHERE lead_number ~ '^LEAD-[0-9]+$';
    
    -- Generate the lead number
    NEW.lead_number := lead_prefix || LPAD(next_number::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate lead numbers
CREATE TRIGGER trigger_generate_lead_number
    BEFORE INSERT ON leads
    FOR EACH ROW
    WHEN (NEW.lead_number IS NULL OR NEW.lead_number = '')
    EXECUTE FUNCTION generate_lead_number();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data

-- Insert sample organization
INSERT INTO organizations (id, name, email, phone, address, industry) VALUES
(uuid_generate_v4(), 'CRM Basic Solutions', 'info@crmbasic.com', '+1-555-0123', '123 Business Street, Tech City, TC 12345', 'Technology'),
(uuid_generate_v4(), 'Demo Company Ltd', 'demo@company.com', '+1-555-0456', '456 Demo Avenue, Sample City, SC 67890', 'Manufacturing');

-- Insert sample users
INSERT INTO users (id, email, password_hash, name, role, organization_id) VALUES
(uuid_generate_v4(), 'admin@crmbasic.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewjyMKBbzg3Bs3Vi', 'Admin User', 'admin', (SELECT id FROM organizations WHERE name = 'CRM Basic Solutions' LIMIT 1)),
(uuid_generate_v4(), 'sales@crmbasic.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewjyMKBbzg3Bs3Vi', 'Sales Manager', 'sales_manager', (SELECT id FROM organizations WHERE name = 'CRM Basic Solutions' LIMIT 1)),
(uuid_generate_v4(), 'rep@crmbasic.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewjyMKBbzg3Bs3Vi', 'Sales Rep', 'sales_person', (SELECT id FROM organizations WHERE name = 'CRM Basic Solutions' LIMIT 1));

-- Insert sample leads
INSERT INTO leads (name, email, phone, company, position, address, source, status, priority, notes, assigned_to, organization_id, created_by) VALUES
('John Smith', 'john.smith@techcorp.com', '+1-555-1001', 'TechCorp Inc', 'IT Manager', '789 Tech Boulevard, Innovation City, IC 11111', 'website', 'new', 'high', 'Interested in our CRM solution for their growing team', 
 (SELECT id FROM users WHERE email = 'sales@crmbasic.com' LIMIT 1),
 (SELECT id FROM organizations WHERE name = 'CRM Basic Solutions' LIMIT 1),
 (SELECT id FROM users WHERE email = 'admin@crmbasic.com' LIMIT 1)),

('Sarah Johnson', 'sarah.j@startup.io', '+1-555-1002', 'Startup Inc', 'CEO', '321 Startup Lane, Entrepreneur City, EC 22222', 'referral', 'contacted', 'medium', 'Looking for affordable CRM solution for small team',
 (SELECT id FROM users WHERE email = 'rep@crmbasic.com' LIMIT 1),
 (SELECT id FROM organizations WHERE name = 'CRM Basic Solutions' LIMIT 1),
 (SELECT id FROM users WHERE email = 'sales@crmbasic.com' LIMIT 1)),

('Mike Davis', 'mike.davis@enterprise.com', '+1-555-1003', 'Enterprise Corp', 'Sales Director', '654 Enterprise Drive, Business City, BC 33333', 'cold-call', 'qualified', 'high', 'Large enterprise client, potential for significant deal',
 (SELECT id FROM users WHERE email = 'sales@crmbasic.com' LIMIT 1),
 (SELECT id FROM organizations WHERE name = 'CRM Basic Solutions' LIMIT 1),
 (SELECT id FROM users WHERE email = 'admin@crmbasic.com' LIMIT 1));

-- Insert sample lead activities
INSERT INTO lead_activities (lead_id, activity_type, title, description, created_by) VALUES
((SELECT id FROM leads WHERE email = 'john.smith@techcorp.com' LIMIT 1), 'note', 'Initial Contact', 'Lead submitted contact form on website. Expressed interest in CRM solution.', (SELECT id FROM users WHERE email = 'admin@crmbasic.com' LIMIT 1)),
((SELECT id FROM leads WHERE email = 'sarah.j@startup.io' LIMIT 1), 'call', 'Phone Call', 'Had 30-minute discovery call. Discussed their current process and pain points.', (SELECT id FROM users WHERE email = 'rep@crmbasic.com' LIMIT 1)),
((SELECT id FROM leads WHERE email = 'mike.davis@enterprise.com' LIMIT 1), 'meeting', 'Demo Meeting', 'Conducted product demo. Very positive response. Requested proposal.', (SELECT id FROM users WHERE email = 'sales@crmbasic.com' LIMIT 1));

-- Create views for easier data access

-- View for lead summary with user and organization details
CREATE VIEW lead_summary AS
SELECT 
    l.id,
    l.lead_number,
    l.name,
    l.email,
    l.phone,
    l.company,
    l.position,
    l.source,
    l.status,
    l.priority,
    l.created_at,
    l.updated_at,
    u.name as assigned_to_name,
    u.email as assigned_to_email,
    o.name as organization_name,
    cb.name as created_by_name
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id
LEFT JOIN organizations o ON l.organization_id = o.id
LEFT JOIN users cb ON l.created_by = cb.id;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

COMMENT ON DATABASE crmbasic IS 'CRM Basic - Customer Relationship Management System Database';
COMMENT ON TABLE organizations IS 'Organizations/Companies using the CRM system';
COMMENT ON TABLE users IS 'System users with authentication and role information';
COMMENT ON TABLE leads IS 'Lead information and tracking';
COMMENT ON TABLE lead_activities IS 'Activity log for each lead interaction';
