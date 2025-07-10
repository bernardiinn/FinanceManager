/**
 * Admin routes for database management
 */

const express = require('express');
const { requireAdmin } = require('../middleware/admin');
const { runQuery, getRow, getAllRows } = require('../database');
const path = require('path');

const router = express.Router();

// Serve admin dashboard HTML (public access for login)
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'admin', 'dashboard.html'));
});

// Serve admin CSS
router.get('/admin.css', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'admin', 'admin.css'));
});

// Serve admin JS
router.get('/dashboard.js', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'admin', 'dashboard.js'));
});

// Admin login check endpoint (doesn't require admin auth)
router.get('/api/check-admin', async (req, res) => {
  try {
    console.log('🔍 Admin check endpoint called');
    
    const authHeader = req.headers['authorization'];
    console.log('📝 Auth header:', authHeader ? 'Present' : 'Missing');
    
    const token = authHeader && authHeader.split(' ')[1];
    console.log('🎫 Token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ message: 'No token provided', isAdmin: false });
    }

    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log('✅ Token decoded successfully, userId:', decoded.userId);
    } catch (error) {
      console.log('❌ Token verification failed:', error.message);
      return res.status(401).json({ message: 'Invalid token', isAdmin: false });
    }

    const user = await getRow(
      'SELECT id, email, name FROM users WHERE id = ?',
      [decoded.userId]
    );

    console.log('👤 User found:', user ? `${user.name} (${user.email})` : 'None');

    if (!user) {
      console.log('❌ User not found in database');
      return res.status(401).json({ message: 'User not found', isAdmin: false });
    }

    const { ADMIN_EMAILS } = require('../middleware/admin');
    const isAdmin = ADMIN_EMAILS.includes(user.email);
    
    console.log('🔐 Admin emails list:', ADMIN_EMAILS);
    console.log('📧 User email:', user.email);
    console.log('✅ Is admin:', isAdmin);

    res.json({ 
      message: 'Token valid', 
      isAdmin: isAdmin,
      user: { id: user.id, email: user.email, name: user.name }
    });

  } catch (error) {
    console.error('❌ Admin check error:', error);
    res.status(500).json({ message: 'Internal server error', isAdmin: false });
  }
});

// All other admin routes require admin authentication
router.use(requireAdmin);

/**
 * DASHBOARD STATS
 */
router.get('/api/stats', async (req, res) => {
  try {
    // Get overall statistics
    const stats = {};

    // User statistics
    const userStats = await getRow(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) as new_users_week,
        COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as new_users_month
      FROM users
    `);

    // Transaction statistics
    const transactionStats = await getRow(`
      SELECT 
        COUNT(*) as total_cartoes,
        SUM(valor_total) as total_lent,
        SUM(valor_pago) as total_received,
        COUNT(CASE WHEN parcelas_pagas >= parcelas_totais THEN 1 END) as completed_cards
      FROM cartoes
    `);

    // Expense statistics
    const expenseStats = await getRow(`
      SELECT 
        COUNT(*) as total_gastos,
        SUM(valor) as total_spent,
        COUNT(CASE WHEN data >= date('now', '-30 days') THEN 1 END) as expenses_this_month
      FROM gastos
    `);

    // Session statistics
    const sessionStats = await getRow(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_sessions,
        COUNT(CASE WHEN created_at >= date('now', '-1 day') THEN 1 END) as sessions_today
      FROM sessions
    `);

    stats.users = userStats;
    stats.transactions = transactionStats;
    stats.expenses = expenseStats;
    stats.sessions = sessionStats;

    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

/**
 * USER MANAGEMENT
 */
router.get('/api/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let query = `
      SELECT 
        u.id, 
        u.email, 
        u.name, 
        u.created_at,
        u.updated_at,
        COUNT(DISTINCT p.id) as pessoas_count,
        COUNT(DISTINCT c.id) as cartoes_count,
        COUNT(DISTINCT g.id) as gastos_count,
        COUNT(DISTINCT s.id) as sessions_count
      FROM users u
      LEFT JOIN pessoas p ON u.id = p.user_id
      LEFT JOIN cartoes c ON u.id = c.user_id
      LEFT JOIN gastos g ON u.id = g.user_id
      LEFT JOIN sessions s ON u.id = s.user_id AND s.is_active = 1
    `;

    const params = [];
    if (search) {
      query += ` WHERE u.email LIKE ? OR u.name LIKE ?`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const users = await getAllRows(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM users';
    const countParams = [];
    if (search) {
      countQuery += ' WHERE email LIKE ? OR name LIKE ?';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const { total } = await getRow(countQuery, countParams);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

/**
 * USER DETAILS
 */
router.get('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // Get user basic info
    const user = await getRow(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's pessoas
    const pessoas = await getAllRows(
      'SELECT * FROM pessoas WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    // Get user's cartoes
    const cartoes = await getAllRows(`
      SELECT c.*, p.nome as pessoa_nome 
      FROM cartoes c 
      LEFT JOIN pessoas p ON c.pessoa_id = p.id 
      WHERE c.user_id = ? 
      ORDER BY c.created_at DESC
    `, [userId]);

    // Get user's gastos
    const gastos = await getAllRows(
      'SELECT * FROM gastos WHERE user_id = ? ORDER BY data DESC LIMIT 50',
      [userId]
    );

    // Get user's active sessions
    const sessions = await getAllRows(
      'SELECT * FROM sessions WHERE user_id = ? AND is_active = 1 ORDER BY last_activity DESC',
      [userId]
    );

    res.json({
      user,
      pessoas,
      cartoes,
      gastos,
      sessions
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Failed to fetch user details' });
  }
});

/**
 * DATABASE OPERATIONS
 */
router.get('/api/database/tables', async (req, res) => {
  try {
    const tables = await getAllRows(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

    const tablesInfo = [];
    for (const table of tables) {
      const info = await getRow(`
        SELECT COUNT(*) as count FROM ${table.name}
      `);
      
      const schema = await getAllRows(`
        PRAGMA table_info(${table.name})
      `);

      tablesInfo.push({
        name: table.name,
        count: info.count,
        schema: schema
      });
    }

    res.json(tablesInfo);
  } catch (error) {
    console.error('Error fetching table info:', error);
    res.status(500).json({ message: 'Failed to fetch table information' });
  }
});

/**
 * EXECUTE CUSTOM QUERY (BE CAREFUL!)
 */
router.post('/api/database/query', async (req, res) => {
  try {
    const { query, params = [] } = req.body;

    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    // Basic security check - only allow SELECT, UPDATE, INSERT, DELETE
    const trimmedQuery = query.trim().toUpperCase();
    const allowedStartWords = ['SELECT', 'UPDATE', 'INSERT', 'DELETE'];
    const isAllowed = allowedStartWords.some(word => trimmedQuery.startsWith(word));

    if (!isAllowed) {
      return res.status(400).json({ 
        message: 'Only SELECT, UPDATE, INSERT, DELETE queries are allowed' 
      });
    }

    // Prevent dangerous operations
    if (trimmedQuery.includes('DROP') || trimmedQuery.includes('TRUNCATE') || trimmedQuery.includes('ALTER')) {
      return res.status(400).json({ 
        message: 'DROP, TRUNCATE, and ALTER operations are not allowed' 
      });
    }

    let result;
    if (trimmedQuery.startsWith('SELECT')) {
      result = await getAllRows(query, params);
    } else {
      result = await runQuery(query, params);
    }

    res.json({
      success: true,
      result: result,
      rowCount: Array.isArray(result) ? result.length : (result.changes || 0)
    });

  } catch (error) {
    console.error('Query execution error:', error);
    res.status(500).json({ 
      message: 'Query execution failed', 
      error: error.message 
    });
  }
});

/**
 * BACKUP DATABASE
 */
router.get('/api/database/backup', async (req, res) => {
  try {
    // Get all data from all tables
    const backup = {};

    const tables = ['users', 'pessoas', 'cartoes', 'gastos', 'recorrencias', 'sessions', 'user_settings'];
    
    for (const table of tables) {
      try {
        backup[table] = await getAllRows(`SELECT * FROM ${table}`);
      } catch (error) {
        console.error(`Error backing up table ${table}:`, error);
        backup[table] = [];
      }
    }

    res.json({
      backup_date: new Date().toISOString(),
      tables: backup
    });

  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ message: 'Backup failed' });
  }
});

/**
 * SYSTEM LOGS (if you want to add logging)
 */
router.get('/api/logs', async (req, res) => {
  try {
    // This would require implementing a logging system
    // For now, return session activity as "logs"
    const logs = await getAllRows(`
      SELECT 
        s.created_at,
        s.last_activity,
        s.device_info,
        s.ip_address,
        u.email,
        u.name,
        'session_activity' as type
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.last_activity DESC
      LIMIT 100
    `);

    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Failed to fetch logs' });
  }
});

module.exports = router;
