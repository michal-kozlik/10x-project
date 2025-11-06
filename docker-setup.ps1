# Quick setup script for Docker environment
# This script helps you configure the required environment variables

Write-Host "=== Sudoku Solver Docker Setup ===" -ForegroundColor Blue
Write-Host ""

$envPath = Join-Path $PSScriptRoot ".env"

if (Test-Path $envPath) {
    Write-Host "⚠️  .env file already exists at: $envPath" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "Setup cancelled. Please edit .env manually." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "Please provide your Supabase credentials:" -ForegroundColor Green
Write-Host ""
Write-Host "Note: Frontend uses Supabase for AUTH only" -ForegroundColor Cyan
Write-Host "      Backend connects directly to PostgreSQL database" -ForegroundColor Cyan
Write-Host ""

# Get Supabase URL
$supabaseUrl = Read-Host "Supabase Project URL (e.g., https://xxxxx.supabase.co)"
if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
    $supabaseUrl = "https://your-project.supabase.co"
    Write-Host "Using placeholder: $supabaseUrl" -ForegroundColor Yellow
}

# Get Supabase Anon Key (for frontend auth)
$supabaseAnonKey = Read-Host "Supabase Anonymous Key (eyJ...) - for frontend auth"
if ([string]::IsNullOrWhiteSpace($supabaseAnonKey)) {
    $supabaseAnonKey = "your-anon-key-here"
    Write-Host "Using placeholder: $supabaseAnonKey" -ForegroundColor Yellow
}

# Get Connection String (for backend database access)
$connectionString = Read-Host "PostgreSQL Connection String (Host=...) - for backend database"
if ([string]::IsNullOrWhiteSpace($connectionString)) {
    $connectionString = "Host=db.your-project.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=your-password"
    Write-Host "Using placeholder: $connectionString" -ForegroundColor Yellow
}

# Create .env file
$envContent = @"
# Supabase Configuration
# Generated on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# Frontend - Supabase Auth (PUBLIC_ prefix required for Astro/Vite)
# Frontend ONLY uses Supabase for authentication, not database access
PUBLIC_SUPABASE_URL=$supabaseUrl
PUBLIC_SUPABASE_KEY=$supabaseAnonKey

# Backend - PostgreSQL Connection String
# Backend connects directly to Supabase PostgreSQL database
SUPABASE_CONNECTION_STRING=$connectionString

# Note: This file contains sensitive credentials.
# Make sure it's listed in .gitignore (it should be already)
"@

Set-Content -Path $envPath -Value $envContent -Encoding UTF8

Write-Host ""
Write-Host "✅ .env file created successfully at: $envPath" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Blue
Write-Host "1. Review .env file and update any placeholder values" -ForegroundColor White
Write-Host "2. Run: docker-compose up -d" -ForegroundColor White
Write-Host "3. Access frontend at: http://localhost:3000" -ForegroundColor White
Write-Host "4. Access backend at: http://localhost:5149" -ForegroundColor White
Write-Host ""
