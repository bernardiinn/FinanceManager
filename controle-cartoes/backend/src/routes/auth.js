/**
 * Authentication routes
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { runQuery, getRow, getAllRows } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { generateUUID } = require('../utils/uuid');

const router = express.Router();

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 12;

// Helper function to create session
const createSession = async (userId, token, req) => {
  const sessionId = generateUUID();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  
  const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
  const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown IP';

  await runQuery(
    'INSERT INTO sessions (id, user_id, token_hash, device_info, ip_address, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
    [sessionId, userId, tokenHash, deviceInfo, ipAddress, expiresAt.toISOString()]
  );

  return sessionId;
};

// Helper function to update session activity
const updateSessionActivity = async (token) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await runQuery(
    'UPDATE sessions SET last_activity = CURRENT_TIMESTAMP WHERE token_hash = ? AND is_active = 1',
    [tokenHash]
  );
};

// Helper function to invalidate session
const invalidateSession = async (token) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await runQuery(
    'UPDATE sessions SET is_active = 0 WHERE token_hash = ?',
    [tokenHash]
  );
};

/**
 * Register new user
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Email, password, and name are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = await getRow(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (existingUser) {
      return res.status(409).json({ 
        error: 'User with this email already exists' 
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const result = await runQuery(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      [email.toLowerCase(), passwordHash, name]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.lastID, email: email.toLowerCase() },
      JWT_SECRET,
      { expiresIn: '30m' }
    );

    // Create session in database
    const sessionId = await createSession(result.lastID, token, req);

    res.status(201).json({
      message: 'User created successfully',
      token,
      sessionId,
      user: {
        id: result.lastID,
        email: email.toLowerCase(),
        name
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user
    const user = await getRow(
      'SELECT id, email, password_hash, name FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30m' }
    );

    // Create session in database
    const sessionId = await createSession(user.id, token, req);

    res.json({
      message: 'Login successful',
      token,
      sessionId,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get current user profile
 * GET /api/auth/profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // Update session activity
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      await updateSessionActivity(token);
    }

    const user = await getRow(
      'SELECT id, email, name, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Logout user (invalidate session)
 * POST /api/auth/logout
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      await invalidateSession(token);
    }

    res.json({ message: 'Logout successful' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Validate session
 * GET /api/auth/validate
 */
router.get('/validate', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Get detailed session info (middleware already validated session)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = await getRow(
      'SELECT * FROM sessions WHERE token_hash = ? AND is_active = 1',
      [tokenHash]
    );

    if (!session) {
      return res.status(401).json({ error: 'Session not found' });
    }

    res.json({
      valid: true,
      user: {
        id: req.user.userId,
        email: req.user.email,
        name: req.user.name
      },
      session: {
        id: session.id,
        createdAt: session.created_at,
        lastActivity: session.last_activity,
        expiresAt: session.expires_at,
        deviceInfo: session.device_info
      }
    });

  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get user sessions
 * GET /api/auth/sessions
 */
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await getAllRows(
      'SELECT id, device_info, ip_address, created_at, last_activity, expires_at, is_active FROM sessions WHERE user_id = ? ORDER BY last_activity DESC',
      [req.user.userId]
    );

    res.json({ sessions });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update user profile
 * PUT /api/auth/profile
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    await runQuery(
      'UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, req.user.userId]
    );

    const updatedUser = await getRow(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Change password
 * PUT /api/auth/change-password
 */
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'New password must be at least 6 characters long' 
      });
    }

    // Get current user
    const user = await getRow(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.userId]
    );

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Current password is incorrect' 
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await runQuery(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPasswordHash, req.user.userId]
    );

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
