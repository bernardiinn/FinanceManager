/**
 * Main server file for Controle de Cartões Backend
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const { createTables } = require('./src/database');
const authRoutes = require('./src/routes/auth');
const dataRoutes = require('./src/routes/data');
const adminRoutes = require('./src/routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting - More permissive for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increase limit to 1000 requests per windowMs for development
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: '*', // Allow all origins for testing
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Controle de Cartões API is running',
    timestamp: new Date().toISOString(),
    deployment: {
      environment: process.env.ENVIRONMENT || 'vm-internal',
      version: process.env.VERSION || 'v0.1-initial',
      access_mode: process.env.ACCESS_MODE || 'ip-only',
      vm_mode: process.env.VM_MODE === 'true',
      host: process.env.HOST || '0.0.0.0',
      port: PORT
    },
    endpoints: {
      auth: '/api/auth',
      data: '/api/data',
      admin: '/admin',
      health: '/health'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    await createTables();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 Backend running on 0.0.0.0:3001 (VM Mode - Initial Deploy)');
      console.log('⚙️ Environment: vm-internal | Version: v0.1-initial | Access Mode: ip-only');
      console.log(`📡 Health check available at: http://0.0.0.0:${PORT}/health`);
      console.log(`🌐 External access: http://<VM-IP>:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
