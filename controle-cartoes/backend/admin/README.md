# 🔐 Admin Dashboard - Controle de Cartões

## Overview

The Admin Dashboard provides a comprehensive interface for database management and system monitoring. Only designated admin users can access this dashboard.

## Access

**URL:** `http://your-server:3001/admin`

**Admin Users:** Only users with emails listed in the `ADMIN_EMAILS` array in `/backend/src/middleware/admin.js` can access the dashboard.

### Default Admin Setup

To add yourself as an admin:

1. Open `/backend/src/middleware/admin.js`
2. Add your email to the `ADMIN_EMAILS` array:
   ```javascript
   const ADMIN_EMAILS = [
     'admin@controle-cartoes.com',
     'your-email@domain.com', // Add your email here
   ];
   ```
3. Restart the backend server

## Features

### 1. 📊 Overview Dashboard
- **System Statistics**: Users, transactions, expenses, sessions
- **Recent Activity**: Latest user sessions and activities
- **Real-time Metrics**: Active sessions, new users, total amounts

### 2. 👥 User Management
- **User List**: All registered users with statistics
- **User Search**: Find users by name or email
- **User Details**: Detailed view of individual users including:
  - Personal information
  - People and cards managed
  - Expense history
  - Active sessions

### 3. 🗄️ Database Management
- **Table Overview**: All database tables with row counts and schema
- **Table Information**: Column details and data types
- **Database Backup**: Download complete database backup as JSON

### 4. 🔍 SQL Query Interface
- **Custom Queries**: Execute SELECT, INSERT, UPDATE, DELETE statements
- **Safety Features**: 
  - No DROP, TRUNCATE, or ALTER operations allowed
  - Query result preview
  - Error handling and validation

## Security Features

### Authentication
- JWT token-based authentication
- Admin-only access control
- Session management

### Query Safety
- Whitelist of allowed SQL operations
- Prevention of dangerous operations
- Input validation and sanitization

### Audit Trail
- Session tracking
- User activity monitoring
- Query execution logging

## Usage Examples

### Common Admin Tasks

1. **Check User Activity**
   ```sql
   SELECT u.name, u.email, COUNT(s.id) as active_sessions
   FROM users u
   LEFT JOIN sessions s ON u.id = s.user_id AND s.is_active = 1
   GROUP BY u.id;
   ```

2. **View Financial Summary**
   ```sql
   SELECT 
     COUNT(DISTINCT u.id) as total_users,
     COUNT(c.id) as total_cards,
     SUM(c.valor_total) as total_lent,
     SUM(c.valor_pago) as total_received
   FROM users u
   LEFT JOIN cartoes c ON u.id = c.user_id;
   ```

3. **Recent User Registrations**
   ```sql
   SELECT name, email, created_at
   FROM users
   WHERE created_at >= date('now', '-7 days')
   ORDER BY created_at DESC;
   ```

4. **Inactive Users**
   ```sql
   SELECT u.name, u.email, MAX(s.last_activity) as last_seen
   FROM users u
   LEFT JOIN sessions s ON u.id = s.user_id
   GROUP BY u.id
   HAVING last_seen < date('now', '-30 days') OR last_seen IS NULL;
   ```

### Database Maintenance

1. **Clean Old Sessions**
   ```sql
   DELETE FROM sessions 
   WHERE expires_at < datetime('now') OR is_active = 0;
   ```

2. **User Statistics Update**
   ```sql
   SELECT 
     p.nome,
     COUNT(c.id) as total_cards,
     SUM(c.valor_total) as total_lent,
     SUM(c.valor_pago) as total_received
   FROM pessoas p
   LEFT JOIN cartoes c ON p.id = c.pessoa_id
   GROUP BY p.id;
   ```

## Database Schema

### Main Tables
- **users**: User accounts and authentication
- **pessoas**: People who borrow cards
- **cartoes**: Card lending records
- **gastos**: Personal expenses
- **recorrencias**: Recurring transactions
- **sessions**: User sessions
- **user_settings**: User preferences

## Backup and Recovery

### Automatic Backup
- Click "Backup Database" to download a complete JSON backup
- Includes all tables and data
- Timestamped filename for organization

### Manual Backup
Use the query interface to export specific data:
```sql
-- Export all user data
SELECT * FROM users;

-- Export financial data
SELECT c.*, p.nome as pessoa_nome 
FROM cartoes c 
JOIN pessoas p ON c.pessoa_id = p.id;
```

## Troubleshooting

### Common Issues

1. **Access Denied**
   - Ensure your email is in the ADMIN_EMAILS array
   - Check that you're logged in with the correct account
   - Verify JWT token is valid

2. **Query Errors**
   - Check SQL syntax
   - Ensure table names are correct
   - Verify column names exist

3. **Connection Issues**
   - Verify backend server is running
   - Check network connectivity
   - Confirm correct port (default: 3001)

### Support

For technical support or feature requests, contact the system administrator or check the application logs in the backend console.

## Updates and Maintenance

The admin dashboard is automatically updated when you restart the backend server. No additional setup is required after the initial configuration.

---

**⚠️ Security Notice**: The admin dashboard provides powerful database access. Only grant admin privileges to trusted users and regularly review the admin user list.
