#!/bin/bash

# VM Deployment Setup Script
# Version: v0.1-initial
# Purpose: Configure firewall rules for VM external access

echo "🚀 Setting up VM Deployment - Initial Deploy v0.1"
echo "⚙️ Environment: vm-internal | Access Mode: ip-only"
echo ""

# Check OS type
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 Detected Linux - Setting up UFW firewall rules..."
    
    # Check if UFW is installed
    if ! command -v ufw &> /dev/null; then
        echo "❌ UFW not found. Please install UFW first:"
        echo "   sudo apt update && sudo apt install ufw"
        exit 1
    fi
    
    # Enable UFW if not already enabled
    sudo ufw --force enable
    
    # Allow required ports
    echo "🔓 Opening port 5173 for frontend..."
    sudo ufw allow 5173/tcp
    
    echo "🔓 Opening port 3001 for backend..."
    sudo ufw allow 3001/tcp
    
    # Reload UFW
    sudo ufw reload
    
    echo "✅ Linux firewall configuration complete!"
    echo ""
    echo "📋 UFW Status:"
    sudo ufw status numbered
    
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo "🪟 Detected Windows - Please configure Windows Firewall manually:"
    echo ""
    echo "1. Open Windows Defender Firewall with Advanced Security"
    echo "2. Create Inbound Rules for:"
    echo "   - TCP Port 5173 (Frontend)"
    echo "   - TCP Port 3001 (Backend)"
    echo ""
    echo "Or run these PowerShell commands as Administrator:"
    echo ""
    echo "New-NetFirewallRule -DisplayName 'FinanceManager Frontend' -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow"
    echo "New-NetFirewallRule -DisplayName 'FinanceManager Backend' -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow"
    
else
    echo "❓ Unknown OS type. Please manually configure firewall to allow:"
    echo "   - TCP Port 5173 (Frontend)"
    echo "   - TCP Port 3001 (Backend)"
fi

echo ""
echo "🌐 Next Steps:"
echo "1. Start the backend: cd backend && npm start"
echo "2. Start the frontend: npm run dev:vm"
echo "3. Test external access from another device:"
echo "   - Frontend: http://<VM-IP>:5173"
echo "   - Backend Health: http://<VM-IP>:3001/health"
echo ""
echo "✅ VM deployment setup complete!"
