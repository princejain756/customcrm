# CRM Basic - Customer Relationship Management System

A modern, full-featured CRM application built with React, TypeScript, Node.js, and PostgreSQL. Features real lead management, user authentication, and a beautiful UI built with shadcn/ui components.

## 🚀 Features

- **Lead Management**: Create, view, update, and delete leads with full CRUD operations
- **User Authentication**: Secure JWT-based authentication system  
- **Real-time Notifications**: Toast notifications for user actions
- **Responsive Design**: Beautiful, mobile-first UI built with Tailwind CSS
- **Database Integration**: Full PostgreSQL integration with proper schema
- **Activity Tracking**: Track all lead interactions and activities
- **Role-based Access**: Support for different user roles (admin, sales_manager, sales_person)

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn** package manager

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd customcrm
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

#### Option A: Automatic Setup (Recommended)

1. Copy the environment file:
```bash
cp .env.example .env
```

2. Edit `.env` with your PostgreSQL credentials:
```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=crmbasic
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password_here
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=3001
NODE_ENV=development
```

3. Run the database initialization script:
```bash
npm run init:db
```

This will:
- Create the `crmbasic` database
- Set up all tables and relationships
- Insert sample data
- Create sample users

#### Option B: Manual Setup

1. Create the database manually:
```sql
CREATE DATABASE crmbasic;
```

2. Run the setup script:
```bash
psql -U postgres -d crmbasic -f scripts/setup-crmbasic-database.sql
```

### 4. Start the Application

```bash
npm run dev:start
```

This command starts both the backend API server (port 3001) and the frontend development server (port 5173).

## 🔑 Default Login Credentials

After running the database initialization, you can log in with these sample accounts:

- **Admin**: `admin@crmbasic.com` / `password123`
- **Sales Manager**: `sales@crmbasic.com` / `password123`  
- **Sales Rep**: `rep@crmbasic.com` / `password123`

## 📊 Database Schema

The application uses the following main tables:

### Organizations
- Company/organization information
- Used for multi-tenant support

### Users  
- User authentication and profile data
- Role-based access control
- Linked to organizations

### Leads
- Lead contact information
- Status and priority tracking
- Assignment to users
- Auto-generated lead numbers

### Lead Activities
- Activity log for each lead
- Track emails, calls, meetings, notes
- Audit trail for all interactions

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/validate` - Token validation
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile/:userId` - Get user profile
- `PUT /api/auth/profile/:userId` - Update user profile

### Leads
- `GET /api/leads` - Get all leads
- `POST /api/leads` - Create new lead
- `GET /api/leads/:id` - Get single lead with activities
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### System
- `GET /api/health` - Health check
- `GET /api/test` - Database connection test

## 🎨 Frontend Features

### Lead Creation Page
- Form validation with real-time feedback
- All required and optional fields
- Status and priority indicators
- Auto-navigation after creation
- Error handling with notifications

### Components
- Reusable UI components from shadcn/ui
- Responsive design for all screen sizes
- Loading states and error handling
- Toast notifications for user feedback

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Input validation and sanitization
- CORS configuration
- SQL injection prevention

## 📱 UI/UX Features

- Modern, clean design
- Dark/light theme support (via next-themes)
- Responsive layout
- Keyboard shortcuts support
- Loading indicators
- Error boundaries
- Toast notifications

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
POSTGRES_HOST=your-prod-host
POSTGRES_PORT=5432
POSTGRES_DB=crmbasic
POSTGRES_USER=your-prod-user
POSTGRES_PASSWORD=your-secure-password
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
PORT=3001
```

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm run server
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start frontend only
- `npm run server` - Start backend only  
- `npm run dev:start` - Start both frontend and backend
- `npm run build` - Build for production
- `npm run init:db` - Initialize database
- `npm run test:db` - Test database connection
- `npm run test:api` - Test API endpoints

### Project Structure

```
customcrm/
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   └── LeadCreation.tsx
│   ├── lib/              # Utility libraries
│   │   ├── api-client.ts # API client
│   │   └── utils.ts      # Helper functions
│   ├── pages/            # Page components
│   └── contexts/         # React contexts
├── scripts/              # Database and utility scripts
├── public/               # Static assets
├── server.js             # Express server
└── package.json          # Dependencies and scripts
```

## 🐛 Troubleshooting

### Database Connection Issues
1. Verify PostgreSQL is running
2. Check credentials in `.env` file
3. Ensure database exists
4. Check network connectivity

### Permission Errors
1. Ensure PostgreSQL user has proper permissions
2. Grant database creation privileges if needed
3. Check file permissions on scripts

### Port Conflicts
1. Change ports in `.env` file if needed
2. Make sure ports 3001 and 5173 are available
3. Update CORS configuration if changing ports

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
1. Check the troubleshooting section
2. Review the database logs
3. Check browser console for frontend errors
4. Verify API endpoints with tools like Postman

---

**Happy CRM-ing! 🎉**
