#!/bin/bash

# Quick Deployment Script for CRM Application
# This script updates and restarts the application

set -e

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

# Configuration
APP_USER="crmuser"
APP_NAME="crm-app"
APP_DIR="/home/$APP_USER/$APP_NAME"

# Check if running as correct user
if [ "$USER" != "$APP_USER" ]; then
    print_error "This script should be run as $APP_USER"
    print_status "Run: sudo -u $APP_USER $0"
    exit 1
fi

print_status "Starting CRM application deployment..."

# Step 1: Navigate to application directory
print_status "Navigating to application directory..."
cd $APP_DIR

# Step 2: Pull latest changes
print_status "Pulling latest changes from repository..."
git pull origin main
print_success "Repository updated"

# Step 3: Install dependencies
print_status "Installing dependencies..."
npm install
print_success "Dependencies installed"

# Step 4: Build application
print_status "Building application..."
npm run build
print_success "Application built successfully"

# Step 5: Restart PM2 processes
print_status "Restarting PM2 processes..."
pm2 restart all
print_success "PM2 processes restarted"

# Step 6: Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save
print_success "PM2 configuration saved"

# Step 7: Check application status
print_status "Checking application status..."
pm2 status

# Step 8: Display recent logs
print_status "Recent application logs:"
pm2 logs --lines 10

print_success "Deployment completed successfully!"
print_status "Application should be available at your domain"
print_status "Check logs with: pm2 logs"
print_status "Monitor with: pm2 monit" 