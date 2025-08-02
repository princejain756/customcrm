# ScanBill to Tally - PostgreSQL Version

A comprehensive CRM system for managing leads, orders, and bill scanning with Tally integration. This version uses PostgreSQL as the primary database instead of Supabase.

## Features

- **Lead Management**: Track leads from various sources with detailed information
- **Order Management**: Create and manage orders with multiple items
- **Bill Scanning**: OCR-powered bill scanning and data extraction
- **Invoice Generation**: Generate professional invoices with multiple templates
- **Tally Integration**: Export data to Tally accounting software
- **User Management**: Role-based access control with organization support
- **Real-time Updates**: Live updates for lead status and order progress
- **Reporting**: Comprehensive reports and analytics

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Shadcn/ui + Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based authentication
- **File Storage**: Local storage (configurable for cloud storage)
- **OCR**: Tesseract.js for bill text extraction
- **PDF Generation**: jsPDF for invoice generation

## Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd scanbill-to-tally
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb scanbill_tally
   
   # Run migration script
   psql -d scanbill_tally -f scripts/migrate-to-postgresql.sql
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your PostgreSQL credentials:
   ```env
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5433
   POSTGRES_DB=scanbill_tally
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_password_here
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   NODE_ENV=development
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## Database Schema

The application uses the following main tables:

- **organisations**: Company information
- **profiles**: User profiles with roles
- **leads**: Customer leads and information
- **lead_orders**: Orders associated with leads
- **lead_order_items**: Individual items in orders
- **scanned_bills**: Scanned bill data and images
- **lead_logs**: Activity logs for leads and orders
- **notifications**: User notifications

## Authentication

The application uses JWT-based authentication with the following features:

- User registration and login
- Role-based access control (admin, organisation_admin, manager, sales_person)
- Token-based session management
- Secure password hashing with bcrypt

## Default Login

For testing purposes, you can use:
- **Email**: admin@example.com
- **Password**: password123

## API Endpoints

The application provides RESTful API endpoints for:

- **Authentication**: `/api/auth/login`, `/api/auth/register`
- **Leads**: `/api/leads` (CRUD operations)
- **Orders**: `/api/orders` (CRUD operations)
- **Bills**: `/api/bills` (CRUD operations)
- **Organizations**: `/api/organizations` (CRUD operations)

## File Storage

Currently, the application uses local storage for bill images. For production, you can configure cloud storage services like AWS S3, Google Cloud Storage, or Azure Blob Storage.

## Development

### Project Structure

```
src/
├── components/          # React components
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
├── integrations/       # Database and external service integrations
│   └── postgresql/     # PostgreSQL client and services
├── lib/                # Utility functions and services
├── pages/              # Page components
└── types/              # TypeScript type definitions
```

### Key Services

- **PostgreSQLService**: Database operations using Drizzle ORM
- **AuthService**: JWT-based authentication
- **BillStorageService**: File storage and bill management
- **OCRService**: Text extraction from bill images
- **InvoiceService**: PDF invoice generation

### Adding New Features

1. **Database Changes**: Update schema in `src/integrations/postgresql/schema.ts`
2. **API Endpoints**: Add new routes in the appropriate service
3. **Frontend Components**: Create React components in `src/components/`
4. **Types**: Update TypeScript types in `src/types/`

## Deployment

### Production Setup

1. **Database**: Set up PostgreSQL on your server or use a managed service
2. **Environment Variables**: Configure production environment variables
3. **File Storage**: Set up cloud storage for bill images
4. **Build**: Run `npm run build` to create production build
5. **Serve**: Use a web server like nginx to serve the built files

### Environment Variables for Production

```env
POSTGRES_HOST=your-production-db-host
POSTGRES_PORT=5433
POSTGRES_DB=scanbill_tally_prod
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=your-super-secure-jwt-secret
NODE_ENV=production
```

## Migration from Supabase

This version has been migrated from Supabase to PostgreSQL. Key changes:

- **Database**: PostgreSQL instead of Supabase
- **Authentication**: JWT-based instead of Supabase Auth
- **File Storage**: Local storage instead of Supabase Storage
- **ORM**: Drizzle ORM instead of Supabase client

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue on GitHub or contact the development team.
