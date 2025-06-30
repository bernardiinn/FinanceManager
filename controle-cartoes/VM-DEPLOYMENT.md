# VM Deployment Guide

> **Version:** v0.1-initial  
> **Environment:** vm-internal  
> **Access Mode:** ip-only (domain support coming later)

This guide helps you deploy the Finance Manager application to a Virtual Machine for external access.

## 🎯 Deployment Overview

The application consists of:
- **Frontend:** React + Vite (Port 5173)
- **Backend:** Node.js + Express (Port 3001)

Both services are configured to bind to `0.0.0.0` for external access.

## 🚀 Quick Start

### 1. Prepare the VM

Clone the repository to your VM:
```bash
git clone <repository-url>
cd controle-cartoes
```

### 2. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
cd ..
```

### 3. Configure Firewall

**Linux (Ubuntu/Debian):**
```bash
./setup-vm-deployment.sh
```

**Windows:**
```powershell
# Run as Administrator
.\setup-vm-deployment.ps1
```

**Manual Firewall Configuration:**

Linux (UFW):
```bash
sudo ufw allow 5173/tcp
sudo ufw allow 3001/tcp
sudo ufw reload
```

Windows (PowerShell as Admin):
```powershell
New-NetFirewallRule -DisplayName 'FinanceManager Frontend' -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow
New-NetFirewallRule -DisplayName 'FinanceManager Backend' -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
```

### 4. Start the Application

**Method 1: Manual Start**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
npm run dev:vm
```

**Method 2: Using Package Scripts**
```bash
# Start frontend for VM access
npm run dev:vm

# In another terminal, start backend
cd backend && npm start
```

## 🌐 Access URLs

Once running, the application will be accessible from any device on the network:

- **Frontend:** `http://<VM-IP>:5173`
- **Backend API:** `http://<VM-IP>:3001/api`
- **Health Check:** `http://<VM-IP>:3001/health`

### Finding Your VM IP Address

**Linux:**
```bash
ip addr show | grep inet
```

**Windows:**
```cmd
ipconfig
```

## 🔧 Configuration Details

### Frontend Configuration (vite.config.ts)
```typescript
server: {
  host: '0.0.0.0',  // Binds to all network interfaces
  port: 5173
}
```

### Backend Configuration (server.js)
```javascript
app.listen(3001, '0.0.0.0', () => {
  console.log('🚀 Backend running on 0.0.0.0:3001 (VM Mode - Initial Deploy)');
});
```

### Environment Variables

**Frontend (.env):**
```properties
VITE_API_URL=http://<VM-IP>:3001/api
VITE_ENVIRONMENT=vm-internal
VITE_VERSION=v0.1-initial
VITE_ACCESS_MODE=ip-only
```

**Backend (backend/.env):**
```properties
NODE_ENV=development
PORT=3001
HOST=0.0.0.0
ENVIRONMENT=vm-internal
VERSION=v0.1-initial
```

## 🧪 Testing External Access

### From Another Device

1. **Test Frontend:**
   - Open browser: `http://<VM-IP>:5173`
   - Should see the Finance Manager app with "Dev Mode – VM External Access Enabled" indicator

2. **Test Backend:**
   - Open browser: `http://<VM-IP>:3001/health`
   - Should return JSON with status "OK"

3. **Test Full Functionality:**
   - Try logging in/registering
   - Test creating and managing cards
   - Verify all features work properly

### From Mobile Device

1. Connect mobile device to same network as VM
2. Open mobile browser
3. Navigate to `http://<VM-IP>:5173`
4. Test touch interface and PWA features

## 🔍 Troubleshooting

### Common Issues

**Connection Refused:**
- Check if services are running
- Verify firewall rules are applied
- Ensure VM IP is correct

**CORS Errors:**
- Backend is configured to allow all origins (`origin: '*'`)
- Check console for specific CORS errors

**Database Issues:**
- SQLite database is created automatically
- Located at `backend/data/controle-cartoes.db`

### Logs and Debugging

**Frontend Logs:**
- Check browser console for errors
- Network tab for API call failures

**Backend Logs:**
- Terminal output shows all requests
- Check `backend/server.log` for persistent logs

### Service Status

**Check if ports are listening:**

Linux:
```bash
sudo netstat -tlnp | grep -E ':(5173|3001)'
```

Windows:
```cmd
netstat -an | findstr ":5173"
netstat -an | findstr ":3001"
```

## 🔄 Production Considerations

This initial deployment is configured for:
- ✅ External IP-based access
- ✅ Development mode with hot reload
- ✅ SQLite database
- ❌ SSL/HTTPS (future)
- ❌ Domain mapping (future)
- ❌ Production optimizations (future)

### Future Enhancements

1. **Domain Setup:** Configure DNS and update environment variables
2. **SSL Certificate:** Add HTTPS support
3. **Production Build:** Use `npm run build` and serve static files
4. **Database:** Consider PostgreSQL for production
5. **Reverse Proxy:** Add Nginx for better performance

## 📋 Deployment Checklist

- [ ] VM has Node.js installed
- [ ] Repository cloned and dependencies installed
- [ ] Firewall rules configured for ports 5173 and 3001
- [ ] Environment variables set correctly
- [ ] Both frontend and backend services start without errors
- [ ] External access tested from another device
- [ ] Mobile browser access verified
- [ ] All main features tested and working

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all configuration steps were followed
3. Check logs for specific error messages
4. Ensure VM has sufficient resources (RAM, disk space)

---

**Deployment Status:** Initial VM Setup Complete ✅  
**Version:** v0.1-initial  
**Access Mode:** IP-Only (Domain setup pending)
