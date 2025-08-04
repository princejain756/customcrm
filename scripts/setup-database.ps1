# PowerShell script to set up CRM Basic database
# Run this script from the project root directory

Write-Host "🚀 CRM Basic Database Setup" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

# Check if .env file exists
if (!(Test-Path ".env")) {
    Write-Host "📄 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env file created. Please update it with your PostgreSQL credentials." -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Edit the .env file with your database password before continuing!" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter after updating the .env file to continue"
}

# Load environment variables from .env file
Get-Content ".env" | ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.+)$") {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Variable -Name $name -Value $value
    }
}

Write-Host "🔍 Using database configuration:" -ForegroundColor Cyan
Write-Host "   Host: $POSTGRES_HOST" -ForegroundColor Gray
Write-Host "   Port: $POSTGRES_PORT" -ForegroundColor Gray
Write-Host "   Database: $POSTGRES_DB" -ForegroundColor Gray
Write-Host "   User: $POSTGRES_USER" -ForegroundColor Gray
Write-Host ""

# Test PostgreSQL connection
Write-Host "🔌 Testing PostgreSQL connection..." -ForegroundColor Yellow

$env:PGPASSWORD = $POSTGRES_PASSWORD

try {
    # Try to connect to PostgreSQL
    $connectionTest = psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d postgres -c "SELECT 1;" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL connection successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ PostgreSQL connection failed!" -ForegroundColor Red
        Write-Host "Error: $connectionTest" -ForegroundColor Red
        Write-Host ""
        Write-Host "🔧 Troubleshooting tips:" -ForegroundColor Yellow
        Write-Host "   1. Make sure PostgreSQL is running" -ForegroundColor Gray
        Write-Host "   2. Check your credentials in .env file" -ForegroundColor Gray
        Write-Host "   3. Verify the host and port settings" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "❌ Error testing connection: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Make sure psql is installed and in your PATH" -ForegroundColor Yellow
    Write-Host "   You can also run the SQL script manually in pgAdmin" -ForegroundColor Gray
    exit 1
}

# Create database
Write-Host "🗄️ Creating database '$POSTGRES_DB'..." -ForegroundColor Yellow

$createDbResult = psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d postgres -c "CREATE DATABASE $POSTGRES_DB;" 2>&1

if ($LASTEXITCODE -eq 0 -or $createDbResult -like "*already exists*") {
    Write-Host "✅ Database '$POSTGRES_DB' ready!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create database!" -ForegroundColor Red
    Write-Host "Error: $createDbResult" -ForegroundColor Red
    exit 1
}

# Run setup script
Write-Host "📝 Running database setup script..." -ForegroundColor Yellow

$setupResult = psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -f "scripts\manual-database-setup.sql" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database setup completed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Database setup failed!" -ForegroundColor Red
    Write-Host "Error: $setupResult" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 You can run the script manually:" -ForegroundColor Yellow
    Write-Host "   1. Open pgAdmin or your SQL client" -ForegroundColor Gray
    Write-Host "   2. Connect to the '$POSTGRES_DB' database" -ForegroundColor Gray
    Write-Host "   3. Run the contents of scripts\manual-database-setup.sql" -ForegroundColor Gray
    exit 1
}

# Verify setup
Write-Host "🔍 Verifying database setup..." -ForegroundColor Yellow

$verifyResult = psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT COUNT(*) FROM leads; SELECT COUNT(*) FROM users;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database verification successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Database setup complete!" -ForegroundColor Green
    Write-Host "=============================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Sample data created:" -ForegroundColor Cyan
    Write-Host "   - 3 Users with different roles" -ForegroundColor Gray
    Write-Host "   - 2 Organizations" -ForegroundColor Gray
    Write-Host "   - 3 Sample leads" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔑 Login credentials - password: password123:" -ForegroundColor Cyan
    Write-Host "   - admin@crmbasic.com (Admin)" -ForegroundColor Gray
    Write-Host "   - sales@crmbasic.com (Sales Manager)" -ForegroundColor Gray
    Write-Host "   - rep@crmbasic.com (Sales Rep)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🚀 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Run: npm install" -ForegroundColor Gray
    Write-Host "   2. Run: npm run dev:start" -ForegroundColor Gray
    Write-Host "   3. Open: http://localhost:5173" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "⚠️ Setup completed but verification failed" -ForegroundColor Yellow
    Write-Host "The database might still be working. Try starting the application." -ForegroundColor Gray
}

# Clear password from environment
$env:PGPASSWORD = $null

Write-Host "Press Enter to exit..." -ForegroundColor Gray
Read-Host
