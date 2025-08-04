@echo off
echo 🚀 CRM Basic Database Setup
echo =============================
echo.

echo 📄 Checking environment file...
if not exist ".env" (
    echo Creating .env file from template...
    copy ".env.example" ".env"
    echo ✅ .env file created. Please update it with your PostgreSQL credentials.
    echo.
    pause
)

echo 🔍 Reading configuration from .env file...
for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
    if "%%a"=="POSTGRES_HOST" set POSTGRES_HOST=%%b
    if "%%a"=="POSTGRES_PORT" set POSTGRES_PORT=%%b
    if "%%a"=="POSTGRES_DB" set POSTGRES_DB=%%b
    if "%%a"=="POSTGRES_USER" set POSTGRES_USER=%%b
    if "%%a"=="POSTGRES_PASSWORD" set POSTGRES_PASSWORD=%%b
)

echo    Host: %POSTGRES_HOST%
echo    Port: %POSTGRES_PORT%
echo    Database: %POSTGRES_DB%
echo    User: %POSTGRES_USER%
echo.

echo 🔌 Testing PostgreSQL connection...
set PGPASSWORD=%POSTGRES_PASSWORD%

psql -h %POSTGRES_HOST% -p %POSTGRES_PORT% -U %POSTGRES_USER% -d postgres -c "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL connection failed!
    echo.
    echo 🔧 Troubleshooting tips:
    echo    1. Make sure PostgreSQL is running
    echo    2. Check your credentials in .env file
    echo    3. Verify the host and port settings
    pause
    exit /b 1
)
echo ✅ PostgreSQL connection successful!

echo 🗄️ Creating database '%POSTGRES_DB%'...
psql -h %POSTGRES_HOST% -p %POSTGRES_PORT% -U %POSTGRES_USER% -d postgres -c "CREATE DATABASE %POSTGRES_DB%;" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Database '%POSTGRES_DB%' created!
) else (
    echo ✅ Database '%POSTGRES_DB%' already exists or created!
)

echo 📝 Running database setup script...
psql -h %POSTGRES_HOST% -p %POSTGRES_PORT% -U %POSTGRES_USER% -d %POSTGRES_DB% -f "scripts\manual-database-setup.sql"
if %errorlevel% neq 0 (
    echo ❌ Database setup failed!
    echo.
    echo 💡 You can run the script manually:
    echo    1. Open pgAdmin or your SQL client
    echo    2. Connect to the '%POSTGRES_DB%' database
    echo    3. Run the contents of scripts\manual-database-setup.sql
    pause
    exit /b 1
)

echo ✅ Database setup completed successfully!
echo.
echo 🎉 Database setup complete!
echo =============================
echo.
echo 📊 Sample data created:
echo    - 3 Users with different roles
echo    - 2 Organizations
echo    - 3 Sample leads
echo.
echo 🔑 Login credentials - password: password123:
echo    - admin@crmbasic.com (Admin)
echo    - sales@crmbasic.com (Sales Manager)
echo    - rep@crmbasic.com (Sales Rep)
echo.
echo 🚀 Next steps:
echo    1. Run: npm install
echo    2. Run: npm run dev:start
echo    3. Open: http://localhost:5173
echo.

set PGPASSWORD=
echo Press any key to exit...
pause >nul
