# 🗄️ Manual PostgreSQL Database Setup Guide

Follow these steps to manually create the AutoCRM database in PostgreSQL.

## Prerequisites

- PostgreSQL installed and running
- Access to PostgreSQL client (pgAdmin, psql, or any SQL client)
- Database credentials ready

## Step-by-Step Instructions

### Step 1: Copy Environment File

```bash
cp .env.example .env
```

Update the `.env` file with your PostgreSQL credentials (you've already done this).

### Step 2: Connect to PostgreSQL

**Option A: Using psql command line**
```bash
psql -U postgres -h localhost -p 5433
```

**Option B: Using pgAdmin**
- Open pgAdmin
- Connect to your PostgreSQL server
- Right-click on Databases → Query Tool

### Step 3: Create the Database

Run this SQL command first:
```sql
CREATE DATABASE autocrm;
```

### Step 4: Connect to the New Database

**In psql:**
```bash
\c autocrm
```

**In pgAdmin:**
- Refresh the database list
- Right-click on `autocrm` database → Query Tool

### Step 5: Run the Setup Script

Copy and paste the entire content from `scripts/manual-database-setup.sql` into your SQL client and execute it.

Or if using psql:
```bash
psql -U postgres -h localhost -p 5433 -d autocrm -f scripts/manual-database-setup.sql
```

### Step 6: Verify the Setup

After running the script, you should see output showing:
- Organizations: 2
- Users: 3  
- Leads: 3
- Lead Activities: 3

## What Gets Created

### Tables:
1. **organizations** - Company information
2. **users** - User authentication and profiles
3. **leads** - Lead management data
4. **lead_activities** - Activity tracking

### Sample Data:
- **3 Users**: admin@autocrm.com, sales@autocrm.com, rep@autocrm.com
- **2 Organizations**: AutoCRM Solutions, Demo Company Ltd
- **3 Sample Leads**: John Smith, Sarah Johnson, Mike Davis
- **3 Activities**: Various lead interactions

### Login Credentials:
All users have password: `password123`
- admin@autocrm.com (Admin)
- sales@autocrm.com (Sales Manager)  
- rep@autocrm.com (Sales Rep)

## Troubleshooting

### Connection Issues:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgres  # Mac
```

### Permission Issues:
```sql
-- Grant permissions if needed
GRANT ALL PRIVILEGES ON DATABASE autocrm TO postgres;
```

### Port Issues:
- Verify the port in your .env file matches your PostgreSQL installation
- Default ports: 5432 (standard) or 5433 (custom)

## Next Steps

After database setup is complete:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the application:**
   ```bash
   npm run dev:start
   ```

3. **Test the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Login with: admin@autocrm.com / password123

## Verification Commands

Run these in your PostgreSQL client to verify everything is working:

```sql
-- Check all tables exist
\dt

-- Check sample data
SELECT COUNT(*) as total_leads FROM leads;
SELECT COUNT(*) as total_users FROM users;

-- View sample leads
SELECT lead_number, name, company, status FROM leads;
```

---

**Ready to proceed!** Once the database is set up, you can start using the AutoCRM application immediately.
