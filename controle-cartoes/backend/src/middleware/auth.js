/**
 * Authentication middleware
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getRow, runQuery } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware to authenticate JWT tokens and validate session in database
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Try to decode JWT without strict expiration check
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        // JWT is expired, but we can still extract payload and check session in DB
        decoded = jwt.decode(token);
        if (!decoded) {
          return res.status(401).json({ error: 'Invalid token format' });
        }
      } else {
        // Other JWT errors (malformed, wrong signature, etc.)
        return res.status(403).json({ error: 'Invalid token' });
      }
    }
    
    // Check if session exists and is active in database (this is the source of truth)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = await getRow(
      'SELECT s.*, u.email, u.name FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token_hash = ? AND s.is_active = 1 AND s.expires_at > datetime("now")',
      [tokenHash]
    );

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Update session activity
    await runQuery(
      'UPDATE sessions SET last_activity = CURRENT_TIMESTAMP WHERE token_hash = ? AND is_active = 1',
      [tokenHash]
    );

    // Add user info to request
    req.user = {
      userId: session.user_id,
      email: session.email,
      name: session.name
    };

    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Optional authentication middleware
 * Adds user info if token is present but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      // Try to decode JWT (ignore expiration for optional auth)
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (jwtError) {
        if (jwtError.name === 'TokenExpiredError') {
          decoded = jwt.decode(token);
        }
        // For optional auth, continue even if JWT has other errors
      }

      if (decoded) {
        // Check session in database
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const session = await getRow(
          'SELECT s.*, u.email, u.name FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token_hash = ? AND s.is_active = 1 AND s.expires_at > datetime("now")',
          [tokenHash]
        );

        if (session) {
          req.user = {
            userId: session.user_id,
            email: session.email,
            name: session.name
          };
        }
      }
    } catch (err) {
      // Silently ignore errors for optional auth
    }
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth
};
