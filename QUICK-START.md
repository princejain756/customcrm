# 🚀 Quick Start Guide - AutoCRM

Follow these steps to get your AutoCRM system up and running quickly!

## ⚡ Quick Setup (5 minutes)

### 1. Prerequisites Check
Make sure you have installed:
- ✅ **Node.js** (v18+) - [Download here](https://nodejs.org/)
- ✅ **PostgreSQL** (v12+) - [Download here](https://www.postgresql.org/download/)

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your database credentials
# Update POSTGRES_PASSWORD with your PostgreSQL password
```

### 3. Database Initialization
```bash
# Install dependencies
npm install

# Initialize database (creates autocrm database and tables)
npm run init:db
```

### 4. Start the Application
```bash
# Start both frontend and backend
npm run dev:start
```

The app will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 🔑 Default Login Credentials

Use these accounts to log in immediately:

| Email | Password | Role |
|-------|----------|------|
| `admin@autocrm.com` | `password123` | Admin |
| `sales@crmbasic.com` | `password123` | Sales Manager |
| `rep@crmbasic.com` | `password123` | Sales Rep |

## 🎯 First Steps

1. **Login** with any of the accounts above
2. **Create a lead** using the blue "Create Lead" button
3. **View leads** by clicking "View Leads" or the "Leads" tab
4. **Explore** the dashboard and features

## 🔧 Common Issues & Solutions

### Database Connection Failed
```bash
# Check if PostgreSQL is running
sudo service postgresql start  # Linux
brew services start postgresql # Mac
# Windows: Start via Services or pgAdmin
```

### Port Already in Use
```bash
# Change ports in .env file
PORT=3002           # Change backend port
# Frontend port can be changed in vite.config.ts
```

### Dependencies Issues
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📁 Project Structure

```
customcrm/
├── src/
│   ├── components/        # React components
│   │   ├── LeadCreation.tsx   # Create lead form
│   │   ├── LeadsList.tsx      # List all leads
│   │   └── ui/               # UI components
│   ├── pages/            # Main pages
│   │   └── Index.tsx         # Dashboard
│   └── lib/              # Utilities
│       └── api-client.ts     # API calls
├── scripts/              # Database scripts
│   ├── init-database.js      # DB setup script
│   └── setup-crmbasic-database.sql
├── server.js             # Express backend
└── package.json          # Dependencies
```

## 🚀 Next Steps

Once you have the basic system running:

1. **Customize the database** by editing `scripts/setup-crmbasic-database.sql`
2. **Add more lead fields** in the database schema and forms
3. **Configure email integration** for lead notifications
4. **Set up production environment** with proper security
5. **Add more CRM features** like:
   - Lead assignment
   - Email campaigns
   - Reports and analytics
   - Task management

## 📞 Need Help?

- Check the **full README-SETUP.md** for detailed documentation
- Review the **troubleshooting section** in README-SETUP.md
- Check browser console for frontend errors
- Check terminal output for backend errors

---

**Welcome to CRM Basic! 🎉**

Your Customer Relationship Management system is ready to help you manage leads and grow your business!
