# VM Deployment Setup Script for Windows
# Version: v0.1-initial
# Purpose: Configure Windows Firewall rules for VM external access

Write-Host "🚀 Setting up VM Deployment - Initial Deploy v0.1" -ForegroundColor Green
Write-Host "⚙️ Environment: vm-internal | Access Mode: ip-only" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "🪟 Configuring Windows Firewall for external access..." -ForegroundColor Yellow

try {
    # Create inbound rule for frontend (port 5173)
    Write-Host "🔓 Creating firewall rule for port 5173 (Frontend)..." -ForegroundColor Cyan
    New-NetFirewallRule -DisplayName "FinanceManager Frontend (TCP 5173)" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow -Profile Any
    
    # Create inbound rule for backend (port 3001)
    Write-Host "🔓 Creating firewall rule for port 3001 (Backend)..." -ForegroundColor Cyan
    New-NetFirewallRule -DisplayName "FinanceManager Backend (TCP 3001)" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow -Profile Any
    
    Write-Host ""
    Write-Host "✅ Windows Firewall configuration complete!" -ForegroundColor Green
    
    # Display created rules
    Write-Host ""
    Write-Host "📋 Created Firewall Rules:" -ForegroundColor Cyan
    Get-NetFirewallRule -DisplayName "*FinanceManager*" | Select-Object DisplayName, Direction, Action, Enabled | Format-Table
    
} catch {
    Write-Host "❌ Error configuring firewall: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You may need to configure the firewall manually through Windows Defender Firewall." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🌐 Next Steps:" -ForegroundColor Green
Write-Host "1. Start the backend: cd backend && npm start" -ForegroundColor White
Write-Host "2. Start the frontend: npm run dev:vm" -ForegroundColor White
Write-Host "3. Test external access from another device:" -ForegroundColor White
Write-Host "   - Frontend: http://<VM-IP>:5173" -ForegroundColor Yellow
Write-Host "   - Backend Health: http://<VM-IP>:3001/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ VM deployment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
