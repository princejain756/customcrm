# Migration Guide: Supabase to PostgreSQL

This guide will help you migrate from Supabase to PostgreSQL for the ScanBill to Tally application.

## Overview

The migration involves replacing Supabase's managed services with direct PostgreSQL database access and implementing custom authentication and file storage solutions.

## Key Changes

### 1. Database Layer
- **Before**: Supabase PostgreSQL with managed client
- **After**: Direct PostgreSQL connection with Drizzle ORM

### 2. Authentication
- **Before**: Supabase Auth with built-in user management
- **After**: Custom JWT-based authentication

### 3. File Storage
- **Before**: Supabase Storage for bill images
- **After**: Local storage (configurable for cloud storage)

### 4. Real-time Features
- **Before**: Supabase real-time subscriptions
- **After**: Manual implementation (if needed)

## Migration Steps

### Step 1: Database Setup

1. **Install PostgreSQL** (if not already installed)
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   
   # macOS
   brew install postgresql
   
   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create Database**
   ```bash
   createdb scanbill_tally
   ```

3. **Run Migration Script**
   ```bash
   psql -d scanbill_tally -f scripts/migrate-to-postgresql.sql
   ```

### Step 2: Environment Configuration

1. **Copy Environment Template**
   ```bash
   cp .env.example .env
   ```

2. **Configure PostgreSQL Connection**
   ```env
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5433
   POSTGRES_DB=scanbill_tally
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_password_here
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   NODE_ENV=development
   ```

### Step 3: Install Dependencies

```bash
npm install pg drizzle-orm @types/pg bcryptjs jsonwebtoken @types/bcryptjs @types/jsonwebtoken dotenv
```

### Step 4: Test Migration

```bash
npm run test:db
```

## Data Migration (Optional)

If you have existing data in Supabase, you can migrate it using the following steps:

### 1. Export Supabase Data

```sql
-- Export organisations
COPY (SELECT * FROM organisations) TO '/tmp/organisations.csv' WITH CSV HEADER;

-- Export profiles
COPY (SELECT * FROM profiles) TO '/tmp/profiles.csv' WITH CSV HEADER;

-- Export leads
COPY (SELECT * FROM leads) TO '/tmp/leads.csv' WITH CSV HEADER;

-- Export other tables...
```

### 2. Import to PostgreSQL

```sql
-- Import organisations
COPY organisations FROM '/tmp/organisations.csv' WITH CSV HEADER;

-- Import profiles
COPY profiles FROM '/tmp/profiles.csv' WITH CSV HEADER;

-- Import leads
COPY leads FROM '/tmp/leads.csv' WITH CSV HEADER;

-- Import other tables...
```

## Configuration Changes

### Authentication Changes

**Before (Supabase):**
```typescript
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

**After (PostgreSQL):**
```typescript
import { authService } from '@/integrations/postgresql/auth';

const result = await authService.login({ email, password });
if (result) {
  // Handle successful login
}
```

### Database Queries

**Before (Supabase):**
```typescript
const { data, error } = await supabase
  .from('leads')
  .select('*')
  .eq('organisation_id', orgId);
```

**After (PostgreSQL):**
```typescript
import { postgresService } from '@/integrations/postgresql/service';

const leads = await postgresService.getLeadsByOrganisation(orgId);
```

## File Storage Migration

### Current Implementation

The application now uses local storage for bill images. For production, consider implementing cloud storage:

### AWS S3 Example

```typescript
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

async function uploadToS3(file: File, key: string) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file,
    ContentType: file.type,
  };
  
  return await s3.upload(params).promise();
}
```

## Testing the Migration

### 1. Database Connection Test

```bash
npm run test:db
```

Expected output:
```
🔍 Testing PostgreSQL connection...
✅ Connected to PostgreSQL successfully
✅ Query test successful: 2024-01-01 12:00:00+00
✅ Database schema test successful
📋 Available tables:
  - bill_scans
  - lead_logs
  - lead_order_items
  - lead_orders
  - leads
  - notifications
  - organisation_subscriptions
  - organisations
  - profiles
  - scanned_bills
  - subscription_types
✅ Sample data test: 1 organisations found
✅ Sample data test: 1 profiles found
✅ All tests passed! PostgreSQL migration is working correctly.
```

### 2. Application Test

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the application
3. Test login with default credentials:
   - Email: `admin@example.com`
   - Password: `password123`

4. Test bill scanning functionality
5. Test lead and order management

## Troubleshooting

### Common Issues

#### 1. Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
- Ensure PostgreSQL is running
- Check if the service is started: `sudo systemctl status postgresql`
- Verify connection parameters in `.env`

#### 2. Authentication Failed
```
Error: password authentication failed for user "postgres"
```

**Solution:**
- Reset PostgreSQL password: `sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'your_password';"`
- Update `.env` with correct password

#### 3. Database Not Found
```
Error: database "scanbill_tally" does not exist
```

**Solution:**
- Create the database: `createdb scanbill_tally`
- Run the migration script: `psql -d scanbill_tally -f scripts/migrate-to-postgresql.sql`

#### 4. Permission Denied
```
Error: permission denied for table
```

**Solution:**
- Grant permissions: `GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;`
- Grant sequence permissions: `GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;`

### Performance Optimization

1. **Connection Pooling**: The application uses connection pooling by default
2. **Indexes**: All necessary indexes are created in the migration script
3. **Query Optimization**: Use Drizzle ORM for optimized queries

## Production Deployment

### 1. Database Setup

- Use a managed PostgreSQL service (AWS RDS, Google Cloud SQL, etc.)
- Configure connection pooling
- Set up automated backups
- Configure monitoring and alerting

### 2. Environment Variables

```env
POSTGRES_HOST=your-production-db-host
POSTGRES_PORT=5433
POSTGRES_DB=scanbill_tally_prod
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=your-super-secure-jwt-secret
NODE_ENV=production
```

### 3. File Storage

For production, implement cloud storage:

```env
# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Or Google Cloud Storage
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_STORAGE_BUCKET=your-bucket-name
```

## Rollback Plan

If you need to rollback to Supabase:

1. **Keep Supabase Project**: Don't delete your Supabase project immediately
2. **Data Backup**: Export all data from PostgreSQL
3. **Code Revert**: Revert to the previous Supabase implementation
4. **Data Import**: Import data back to Supabase if needed

## Support

For migration support:

1. Check the troubleshooting section above
2. Review the application logs for detailed error messages
3. Test the database connection using the provided test script
4. Open an issue in the repository with detailed error information

## Next Steps

After successful migration:

1. **Monitor Performance**: Track database performance and optimize queries
2. **Implement Cloud Storage**: Set up cloud storage for production
3. **Add Monitoring**: Implement application monitoring and logging
4. **Security Review**: Conduct security audit of the new implementation
5. **Backup Strategy**: Implement automated backup and recovery procedures 