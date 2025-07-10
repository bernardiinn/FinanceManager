// Admin Dashboard JavaScript with detailed logging

let authToken = localStorage.getItem('adminToken');
let currentUser = null;

console.log('🚀 Admin dashboard loaded');
console.log('🎫 Stored token:', authToken ? 'Present' : 'Not found');

if (authToken) {
    console.log('📱 Checking existing auth...');
    checkAuthAndLoad();
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    console.log('🔐 Attempting login with email:', email);
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        console.log('📡 Login response status:', response.status);
        const data = await response.json();
        console.log('📦 Login response data:', data);

        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('adminToken', authToken);
            currentUser = data.user;
            
            console.log('✅ Login successful, checking admin access...');
            
            // Check if user is admin using new endpoint
            const isAdmin = await checkAdminAccess();
            console.log('🔐 Admin check result:', isAdmin);
            
            if (isAdmin) {
                console.log('✅ Admin access granted, showing dashboard...');
                showDashboard();
                loadOverview();
            } else {
                console.log('❌ Admin access denied');
                showError('Access denied. Admin privileges required.');
            }
        } else {
            console.log('❌ Login failed:', data.message);
            showError(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('❌ Network error during login:', error);
        showError('Network error. Please try again.');
    }
});

async function checkAuthAndLoad() {
    try {
        console.log('🔍 Checking existing authentication...');
        const isAdmin = await checkAdminAccess();
        console.log('🔐 Existing auth admin check result:', isAdmin);
        
        if (isAdmin) {
            console.log('✅ Existing auth valid, showing dashboard...');
            showDashboard();
            loadOverview();
        } else {
            console.log('❌ Existing auth invalid, logging out...');
            logout();
        }
    } catch (error) {
        console.error('❌ Error checking existing auth:', error);
        logout();
    }
}

async function checkAdminAccess() {
    try {
        console.log('🔍 Checking admin access with token:', authToken ? 'Present' : 'Missing');
        
        const response = await fetch('/admin/api/check-admin', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        console.log('📡 Admin check response status:', response.status);
        const data = await response.json();
        console.log('📦 Admin check response data:', data);
        
        if (response.ok && data.isAdmin) {
            currentUser = data.user;
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('❌ Error checking admin access:', error);
        return false;
    }
}

function showDashboard() {
    console.log('📊 Showing dashboard...');
    document.getElementById('loginCard').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    if (currentUser) {
        document.getElementById('adminName').textContent = `Welcome, ${currentUser.name}`;
        console.log('👋 Welcome message set for:', currentUser.name);
    }
}

function logout() {
    console.log('🚪 Logging out...');
    localStorage.removeItem('adminToken');
    authToken = null;
    currentUser = null;
    document.getElementById('loginCard').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginError').style.display = 'none';
}

function showError(message) {
    console.log('❌ Showing error:', message);
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function showTab(tabName) {
    console.log('📑 Switching to tab:', tabName);
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    if (tabName === 'users') loadUsers();
    if (tabName === 'database') loadTables();
}

async function loadOverview() {
    try {
        console.log('📊 Loading overview stats...');
        const response = await fetch('/admin/api/stats', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log('📡 Stats response status:', response.status);
        
        if (response.ok) {
            const stats = await response.json();
            console.log('📊 Stats data:', stats);
            displayStats(stats);
            loadRecentLogs();
        } else {
            console.log('❌ Failed to load stats:', response.status);
        }
    } catch (error) {
        console.error('❌ Error loading overview:', error);
    }
}

function displayStats(stats) {
    console.log('📊 Displaying stats...');
    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${stats.users.total_users}</div>
            <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.users.new_users_week}</div>
            <div class="stat-label">New Users (Week)</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.transactions.total_cartoes}</div>
            <div class="stat-label">Total Cards</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">R$ ${(stats.transactions.total_lent || 0).toFixed(2)}</div>
            <div class="stat-label">Total Lent</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.expenses.total_gastos}</div>
            <div class="stat-label">Total Expenses</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.sessions.active_sessions}</div>
            <div class="stat-label">Active Sessions</div>
        </div>
    `;
}

async function loadRecentLogs() {
    try {
        const response = await fetch('/admin/api/logs', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            const logs = await response.json();
            displayLogs(logs);
        }
    } catch (error) {
        console.error('Error loading logs:', error);
    }
}

function displayLogs(logs) {
    const logsDiv = document.getElementById('recentLogs');
    if (logs.length === 0) {
        logsDiv.innerHTML = '<p>No recent activity</p>';
        return;
    }
    const table = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>User</th>
                        <th>Device</th>
                        <th>IP</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs.map(log => `
                        <tr>
                            <td>${new Date(log.last_activity).toLocaleString()}</td>
                            <td>${log.name} (${log.email})</td>
                            <td>${log.device_info || 'Unknown'}</td>
                            <td>${log.ip_address || 'Unknown'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    logsDiv.innerHTML = table;
}

async function loadUsers() {
    try {
        const search = document.getElementById('userSearch').value;
        const response = await fetch(`/admin/api/users?search=${search}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            const data = await response.json();
            displayUsers(data.users);
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function displayUsers(users) {
    const usersTable = document.getElementById('usersTable');
    if (users.length === 0) {
        usersTable.innerHTML = '<p>No users found</p>';
        return;
    }
    const table = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Created</th>
                        <th>People</th>
                        <th>Cards</th>
                        <th>Expenses</th>
                        <th>Sessions</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.id}</td>
                            <td>${user.name}</td>
                            <td>${user.email}</td>
                            <td>${new Date(user.created_at).toLocaleDateString()}</td>
                            <td>${user.pessoas_count}</td>
                            <td>${user.cartoes_count}</td>
                            <td>${user.gastos_count}</td>
                            <td>${user.sessions_count}</td>
                            <td>
                                <button onclick="viewUserDetails(${user.id})" class="btn" style="padding: 6px 12px; font-size: 12px;">
                                    View Details
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    usersTable.innerHTML = table;
}

async function viewUserDetails(userId) {
    try {
        const response = await fetch(`/admin/api/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            const data = await response.json();
            showUserModal(data);
        }
    } catch (error) {
        console.error('Error loading user details:', error);
    }
}

function showUserModal(userData) {
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; border-radius: 12px; padding: 30px; max-width: 800px; max-height: 80vh; overflow-y: auto;">
                <h2>${userData.user.name} (${userData.user.email})</h2>
                <p><strong>User ID:</strong> ${userData.user.id}</p>
                <p><strong>Created:</strong> ${new Date(userData.user.created_at).toLocaleString()}</p>
                <h3 style="margin-top: 20px;">Statistics</h3>
                <p><strong>People:</strong> ${userData.pessoas.length}</p>
                <p><strong>Cards:</strong> ${userData.cartoes.length}</p>
                <p><strong>Expenses:</strong> ${userData.gastos.length}</p>
                <p><strong>Active Sessions:</strong> ${userData.sessions.length}</p>
                <button onclick="this.parentElement.parentElement.remove()" class="btn" style="margin-top: 20px;">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function loadTables() {
    try {
        const response = await fetch('/admin/api/database/tables', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            const tables = await response.json();
            displayTables(tables);
        }
    } catch (error) {
        console.error('Error loading tables:', error);
    }
}

function displayTables(tables) {
    const tablesDiv = document.getElementById('tablesInfo');
    const table = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Table Name</th>
                        <th>Row Count</th>
                        <th>Columns</th>
                    </tr>
                </thead>
                <tbody>
                    ${tables.map(table => `
                        <tr>
                            <td><strong>${table.name}</strong></td>
                            <td>${table.count}</td>
                            <td>${table.schema.map(col => col.name).join(', ')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    tablesDiv.innerHTML = table;
}

async function executeQuery() {
    const query = document.getElementById('sqlQuery').value.trim();
    if (!query) {
        alert('Please enter a query');
        return;
    }
    try {
        const response = await fetch('/admin/api/database/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ query })
        });
        const data = await response.json();
        displayQueryResult(data, response.ok);
    } catch (error) {
        displayQueryResult({ message: 'Network error' }, false);
    }
}

function displayQueryResult(data, success) {
    const resultDiv = document.getElementById('queryResult');
    if (success) {
        resultDiv.innerHTML = `
            <div class="success">Query executed successfully! Rows affected: ${data.rowCount}</div>
            <div class="query-result">${JSON.stringify(data.result, null, 2)}</div>
        `;
    } else {
        resultDiv.innerHTML = `
            <div class="error">Error: ${data.message}</div>
        `;
    }
}

async function backupDatabase() {
    try {
        const response = await fetch('/admin/api/database/backup', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            const backup = await response.json();
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `database-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error('Backup error:', error);
        alert('Backup failed');
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction() {
        const later = () => {
            clearTimeout(timeout);
            func();
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function searchUsers() {
    loadUsers();
}
