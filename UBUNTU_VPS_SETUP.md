# Complete Ubuntu VPS Setup Guide for CRM Application

This guide provides a complete setup for deploying your CRM application on an Ubuntu VPS with PostgreSQL database, Node.js server, and React frontend.

## Prerequisites

- Ubuntu 22.04 LTS VPS
- Root access or sudo privileges
- Domain name (optional but recommended)

## Table of Contents

1. [Initial Server Setup](#1-initial-server-setup)
2. [Install Node.js and npm](#2-install-nodejs-and-npm)
3. [Install PostgreSQL](#3-install-postgresql)
4. [Install Nginx](#4-install-nginx)
5. [Install PM2 Process Manager](#5-install-pm2-process-manager)
6. [Install SSL Certificate](#6-install-ssl-certificate)
7. [Database Setup](#7-database-setup)
8. [Application Deployment](#8-application-deployment)
9. [Environment Configuration](#9-environment-configuration)
10. [Service Configuration](#10-service-configuration)
11. [Monitoring and Logs](#11-monitoring-and-logs)
12. [Backup Strategy](#12-backup-strategy)
13. [Security Hardening](#13-security-hardening)

---

## 1. Initial Server Setup

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Essential Packages
```bash
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

### Create Application User
```bash
sudo adduser crmuser
sudo usermod -aG sudo crmuser
```

### Switch to Application User
```bash
su - crmuser
```

---

## 2. Install Node.js and npm

### Install Node.js 20.x
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Verify Installation
```bash
node --version
npm --version
```

### Install Global Packages
```bash
sudo npm install -g pm2
```

---

## 3. Install PostgreSQL

### Install PostgreSQL 15
```bash
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-15 postgresql-contrib-15
```

### Start and Enable PostgreSQL
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Configure PostgreSQL
```bash
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "CREATE DATABASE autocrm;"
sudo -u postgres psql -c "CREATE USER crmuser WITH PASSWORD 'your_crm_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE autocrm TO crmuser;"
sudo -u postgres psql -c "GRANT ALL ON SCHEMA public TO crmuser;"
```

### Configure PostgreSQL for Remote Access (Optional)
```bash
sudo nano /etc/postgresql/15/main/postgresql.conf
# Uncomment and modify: listen_addresses = '*'

sudo nano /etc/postgresql/15/main/pg_hba.conf
# Add: host    all             all             0.0.0.0/0               md5

sudo systemctl restart postgresql
```

---

## 4. Install Nginx

### Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Configure Firewall
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## 5. Install PM2 Process Manager

### Install PM2
```bash
sudo npm install -g pm2
```

### Setup PM2 Startup Script
```bash
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u crmuser --hp /home/crmuser
```

---

## 6. Install SSL Certificate

### Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Get SSL Certificate (Replace with your domain)
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 7. Database Setup

### Create Database Schema
```bash
# Connect to PostgreSQL
sudo -u postgres psql autocrm

# Run the migration script
\i /path/to/your/migration.sql
```

### Sample Database Setup Script
Create a file `setup_database.sql`:

```sql
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_customers_organization_id ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_organization_id ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_orders_organization_id ON orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_leads_organization_id ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);

-- Insert default organization
INSERT INTO organisations (name, email) VALUES ('Default Organization', 'admin@example.com');

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, name, role, organization_id) 
VALUES ('admin@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK6', 'Admin User', 'admin', (SELECT id FROM organisations LIMIT 1));
```

---

## 8. Application Deployment

### Clone Application
```bash
cd /home/crmuser
git clone https://your-repository-url.git crm-app
cd crm-app
```

### Install Dependencies
```bash
npm install
```

### Build Application
```bash
npm run build
```

### Create Environment File
```bash
nano .env
```

Add the following content:
```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=autocrm
POSTGRES_USER=crmuser
POSTGRES_PASSWORD=your_crm_password

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# File Upload Configuration
UPLOAD_PATH=/home/crmuser/crm-app/uploads
MAX_FILE_SIZE=10485760

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379
```

### Start Application with PM2
```bash
pm2 start server.js --name "crm-api"
pm2 start npm --name "crm-frontend" -- run preview
pm2 save
```

---

## 9. Environment Configuration

### Create Production Environment File
```bash
nano /home/crmuser/crm-app/.env.production
```

```env
# Production Environment Variables
NODE_ENV=production
PORT=3001
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=autocrm
POSTGRES_USER=crmuser
POSTGRES_PASSWORD=your_crm_password
JWT_SECRET=your_super_secure_jwt_secret_key_here
CORS_ORIGIN=https://yourdomain.com
```

---

## 10. Service Configuration

### Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/crm-app
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Frontend
    location / {
        root /home/crmuser/crm-app/dist;
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API Proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static files
    location /static/ {
        root /home/crmuser/crm-app/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
```

### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/crm-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Configure PM2 Ecosystem
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'crm-api',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/home/crmuser/crm-app/logs/api-error.log',
      out_file: '/home/crmuser/crm-app/logs/api-out.log',
      log_file: '/home/crmuser/crm-app/logs/api-combined.log',
      time: true
    },
    {
      name: 'crm-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: '/home/crmuser/crm-app',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/home/crmuser/crm-app/logs/frontend-error.log',
      out_file: '/home/crmuser/crm-app/logs/frontend-out.log',
      log_file: '/home/crmuser/crm-app/logs/frontend-combined.log',
      time: true
    }
  ]
};
```

### Create Log Directory
```bash
mkdir -p /home/crmuser/crm-app/logs
```

---

## 11. Monitoring and Logs

### PM2 Monitoring
```bash
pm2 monit
pm2 logs
```

### Nginx Logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### PostgreSQL Logs
```bash
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

### System Monitoring
```bash
# Install htop for system monitoring
sudo apt install -y htop

# Monitor system resources
htop
```

---

## 12. Backup Strategy

### Database Backup Script
Create `/home/crmuser/backup.sh`:
```bash
#!/bin/bash

# Database backup
BACKUP_DIR="/home/crmuser/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="autocrm"
DB_USER="crmuser"

mkdir -p $BACKUP_DIR

# Create database backup
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
```

### Make Backup Script Executable
```bash
chmod +x /home/crmuser/backup.sh
```

### Setup Cron Job for Daily Backup
```bash
crontab -e
```

Add this line:
```
0 2 * * * /home/crmuser/backup.sh
```

---

## 13. Security Hardening

### Update SSH Configuration
```bash
sudo nano /etc/ssh/sshd_config
```

Add/modify these lines:
```
Port 2222
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

### Generate SSH Key Pair (on your local machine)
```bash
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
```

### Copy Public Key to Server
```bash
ssh-copy-id -i ~/.ssh/id_rsa.pub crmuser@your-server-ip
```

### Restart SSH Service
```bash
sudo systemctl restart sshd
```

### Configure Firewall
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 2222/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Install Fail2ban
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 14. Maintenance Commands

### Update Application
```bash
cd /home/crmuser/crm-app
git pull origin main
npm install
npm run build
pm2 restart all
```

### Restart Services
```bash
# Restart PM2 processes
pm2 restart all

# Restart Nginx
sudo systemctl restart nginx

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Check Service Status
```bash
# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check PostgreSQL status
sudo systemctl status postgresql
```

### View Logs
```bash
# PM2 logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/access.log

# Application logs
tail -f /home/crmuser/crm-app/logs/api-combined.log
```

---

## 15. Troubleshooting

### Common Issues and Solutions

#### 1. Application Not Starting
```bash
# Check PM2 logs
pm2 logs crm-api

# Check if port is in use
sudo netstat -tlnp | grep :3001
```

#### 2. Database Connection Issues
```bash
# Test database connection
psql -h localhost -U crmuser -d autocrm

# Check PostgreSQL status
sudo systemctl status postgresql
```

#### 3. Nginx Configuration Issues
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

#### 4. SSL Certificate Issues
```bash
# Renew SSL certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

---

## 16. Performance Optimization

### PostgreSQL Optimization
```bash
sudo nano /etc/postgresql/15/main/postgresql.conf
```

Add these optimizations:
```
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

### Nginx Optimization
```bash
sudo nano /etc/nginx/nginx.conf
```

Add to http block:
```
client_max_body_size 10M;
client_body_timeout 60s;
client_header_timeout 60s;
keepalive_timeout 65s;
send_timeout 60s;
```

---

## 17. Final Checklist

- [ ] Server updated and secured
- [ ] Node.js and npm installed
- [ ] PostgreSQL installed and configured
- [ ] Nginx installed and configured
- [ ] SSL certificate installed
- [ ] Application deployed and running
- [ ] Database schema created
- [ ] Environment variables configured
- [ ] PM2 processes running
- [ ] Backup strategy implemented
- [ ] Firewall configured
- [ ] Monitoring setup
- [ ] Security hardening completed

---

## 18. Access Information

- **Application URL**: https://yourdomain.com
- **API Endpoint**: https://yourdomain.com/api
- **Database**: PostgreSQL on localhost:5432
- **SSH Port**: 2222
- **Admin User**: admin@example.com / admin123

---

## 19. Support and Maintenance

### Regular Maintenance Tasks
1. **Weekly**: Check logs for errors
2. **Monthly**: Update system packages
3. **Quarterly**: Review security settings
4. **Annually**: Renew SSL certificates

### Monitoring Commands
```bash
# System resources
htop

# Disk usage
df -h

# Memory usage
free -h

# Process status
pm2 status

# Service status
sudo systemctl status nginx postgresql
```

This complete setup provides a production-ready Ubuntu VPS deployment for your CRM application with all necessary components, security measures, and monitoring capabilities.
