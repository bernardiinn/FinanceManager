/**
 * Admin Authentication Middleware
 * Only allows access to designated admin users
 */

const jwt = require('jsonwebtoken');
const { getRow } = require('../database');

// Admin email addresses (you can modify this list)
const ADMIN_EMAILS = [
  'admin@controle-cartoes.com',
  'bernardo.lamartins@gmail.com', // Add your email here
  // Add more admin emails as needed
];

/**
 * Middleware to check if user is an admin
 */
const requireAdmin = async (req, res, next) => {
  try {
    console.log('🔐 Admin middleware called for:', req.method, req.path);
    
    // First check if user is authenticated
    const authHeader = req.headers['authorization'];
    console.log('📝 Auth header:', authHeader ? 'Present' : 'Missing');
    
    const token = authHeader && authHeader.split(' ')[1];
    console.log('🎫 Token:', token ? 'Present' : 'Missing');

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ 
        message: 'Access denied. No token provided.' 
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log('✅ Token decoded successfully, userId:', decoded.userId);
    } catch (error) {
      console.log('❌ Token verification failed:', error.message);
      return res.status(401).json({ 
        message: 'Access denied. Invalid token.' 
      });
    }

    // Get user info
    const user = await getRow(
      'SELECT id, email, name FROM users WHERE id = ?',
      [decoded.userId]
    );

    console.log('👤 User found:', user ? `${user.name} (${user.email})` : 'None');

    if (!user) {
      console.log('❌ User not found in database');
      return res.status(401).json({ 
        message: 'Access denied. User not found.' 
      });
    }

    // Check if user is admin
    console.log('🔐 Admin emails list:', ADMIN_EMAILS);
    console.log('📧 User email:', user.email);
    
    if (!ADMIN_EMAILS.includes(user.email)) {
      console.log('❌ User is not an admin');
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    console.log('✅ Admin access granted');
    
    // Add user info to request
    req.user = user;
    req.isAdmin = true;

    next();
  } catch (error) {
    console.error('❌ Admin auth error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
};

/**
 * Middleware to check if current user can access admin dashboard
 * (less strict than requireAdmin - just checks if email is in admin list)
 */
const checkAdminAccess = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.isAdmin = false;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await getRow(
      'SELECT id, email, name FROM users WHERE id = ?',
      [decoded.userId]
    );

    req.isAdmin = user && ADMIN_EMAILS.includes(user.email);
    req.user = user;

    next();
  } catch (error) {
    req.isAdmin = false;
    next();
  }
};

module.exports = {
  requireAdmin,
  checkAdminAccess,
  ADMIN_EMAILS
};
