#!/bin/bash

# Complete Ubuntu VPS Setup Script for CRM Application
# This script automates the entire setup process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# Configuration variables
APP_NAME="crm-app"
APP_USER="crmuser"
DB_NAME="autocrm"
DB_USER="crmuser"
DOMAIN="yourdomain.com"  # Change this to your domain
JWT_SECRET=$(openssl rand -base64 32)

print_status "Starting Ubuntu VPS setup for CRM application..."

# Step 1: Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_success "System updated successfully"

# Step 2: Install essential packages
print_status "Installing essential packages..."
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release htop
print_success "Essential packages installed"

# Step 3: Create application user
print_status "Creating application user..."
if id "$APP_USER" &>/dev/null; then
    print_warning "User $APP_USER already exists"
else
    sudo adduser --disabled-password --gecos "" $APP_USER
    sudo usermod -aG sudo $APP_USER
    print_success "User $APP_USER created successfully"
fi

# Step 4: Install Node.js
print_status "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
print_success "Node.js installed successfully"

# Step 5: Install PostgreSQL
print_status "Installing PostgreSQL 15..."
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-15 postgresql-contrib-15
print_success "PostgreSQL installed successfully"

# Step 6: Configure PostgreSQL
print_status "Configuring PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Generate secure password for database
DB_PASSWORD=$(openssl rand -base64 12)

# Configure PostgreSQL
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '$(openssl rand -base64 12)';"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
print_success "PostgreSQL configured successfully"

# Step 7: Install Nginx
print_status "Installing Nginx..."
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
print_success "Nginx installed successfully"

# Step 8: Install PM2
print_status "Installing PM2..."
sudo npm install -g pm2
print_success "PM2 installed successfully"

# Step 9: Configure firewall
print_status "Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
print_success "Firewall configured successfully"

# Step 10: Clone application (if repository URL is provided)
if [ ! -z "$1" ]; then
    print_status "Cloning application from $1..."
    sudo -u $APP_USER git clone $1 /home/$APP_USER/$APP_NAME
    print_success "Application cloned successfully"
else
    print_warning "No repository URL provided. Please clone your application manually."
fi

# Step 11: Create environment file
print_status "Creating environment configuration..."
sudo -u $APP_USER tee /home/$APP_USER/$APP_NAME/.env > /dev/null <<EOF
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=$DB_NAME
POSTGRES_USER=$DB_USER
POSTGRES_PASSWORD=$DB_PASSWORD

# JWT Configuration
JWT_SECRET=$JWT_SECRET

# CORS Configuration
CORS_ORIGIN=https://$DOMAIN

# File Upload Configuration
UPLOAD_PATH=/home/$APP_USER/$APP_NAME/uploads
MAX_FILE_SIZE=10485760
EOF
print_success "Environment file created"

# Step 12: Install application dependencies
if [ -d "/home/$APP_USER/$APP_NAME" ]; then
    print_status "Installing application dependencies..."
    cd /home/$APP_USER/$APP_NAME
    sudo -u $APP_USER npm install
    print_success "Dependencies installed"
    
    # Build application
    print_status "Building application..."
    sudo -u $APP_USER npm run build
    print_success "Application built successfully"
fi

# Step 13: Create Nginx configuration
print_status "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL configuration will be added by Certbot
    # ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Frontend
    location / {
        root /home/$APP_USER/$APP_NAME/dist;
        try_files \$uri \$uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API Proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static files
    location /static/ {
        root /home/$APP_USER/$APP_NAME/dist;
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
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
print_success "Nginx configured successfully"

# Step 14: Create PM2 ecosystem file
print_status "Creating PM2 configuration..."
sudo -u $APP_USER tee /home/$APP_USER/$APP_NAME/ecosystem.config.js > /dev/null <<EOF
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
      error_file: '/home/$APP_USER/$APP_NAME/logs/api-error.log',
      out_file: '/home/$APP_USER/$APP_NAME/logs/api-out.log',
      log_file: '/home/$APP_USER/$APP_NAME/logs/api-combined.log',
      time: true
    }
  ]
};
EOF

# Create log directory
sudo -u $APP_USER mkdir -p /home/$APP_USER/$APP_NAME/logs
print_success "PM2 configuration created"

# Step 15: Setup PM2 startup
print_status "Setting up PM2 startup..."
sudo -u $APP_USER pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $APP_USER --hp /home/$APP_USER
print_success "PM2 startup configured"

# Step 16: Create backup script
print_status "Creating backup script..."
sudo -u $APP_USER tee /home/$APP_USER/backup.sh > /dev/null <<EOF
#!/bin/bash

# Database backup
BACKUP_DIR="/home/$APP_USER/backups"
DATE=\$(date +%Y%m%d_%H%M%S)
DB_NAME="$DB_NAME"
DB_USER="$DB_USER"

mkdir -p \$BACKUP_DIR

# Create database backup
pg_dump -U \$DB_USER -h localhost \$DB_NAME > \$BACKUP_DIR/db_backup_\$DATE.sql

# Compress backup
gzip \$BACKUP_DIR/db_backup_\$DATE.sql

# Keep only last 7 days of backups
find \$BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: db_backup_\$DATE.sql.gz"
EOF

sudo -u $APP_USER chmod +x /home/$APP_USER/backup.sh
print_success "Backup script created"

# Step 17: Install Certbot for SSL
print_status "Installing Certbot for SSL..."
sudo apt install -y certbot python3-certbot-nginx
print_success "Certbot installed"

# Step 18: Create setup summary
print_status "Creating setup summary..."
sudo -u $APP_USER tee /home/$APP_USER/setup_summary.txt > /dev/null <<EOF
CRM Application Setup Summary
============================

Application Details:
- Application Name: $APP_NAME
- Application User: $APP_USER
- Application Directory: /home/$APP_USER/$APP_NAME

Database Details:
- Database Name: $DB_NAME
- Database User: $DB_USER
- Database Password: $DB_PASSWORD

Server Details:
- Domain: $DOMAIN
- API Port: 3001
- JWT Secret: $JWT_SECRET

Next Steps:
1. Update your domain DNS to point to this server
2. Run: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN
3. Start the application: cd /home/$APP_USER/$APP_NAME && pm2 start ecosystem.config.js
4. Save PM2 configuration: pm2 save

Access Information:
- Application URL: https://$DOMAIN
- SSH Access: ssh $APP_USER@$(hostname -I | awk '{print $1}')
- Database: psql -h localhost -U $DB_USER -d $DB_NAME

Backup:
- Backup script: /home/$APP_USER/backup.sh
- Setup daily backup: crontab -e (add: 0 2 * * * /home/$APP_USER/backup.sh)

Monitoring:
- PM2 status: pm2 status
- PM2 logs: pm2 logs
- Nginx logs: sudo tail -f /var/log/nginx/access.log
- System monitoring: htop
EOF

print_success "Setup summary created at /home/$APP_USER/setup_summary.txt"

# Final success message
print_success "Ubuntu VPS setup completed successfully!"
print_status "Please review the setup summary at /home/$APP_USER/setup_summary.txt"
print_status "Next steps:"
echo "1. Update your domain DNS to point to this server"
echo "2. Run: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "3. Start the application: cd /home/$APP_USER/$APP_NAME && pm2 start ecosystem.config.js"
echo "4. Save PM2 configuration: pm2 save"

# Display setup summary
echo ""
echo "=== SETUP SUMMARY ==="
cat /home/$APP_USER/setup_summary.txt 