/**
 * Database setup and configuration for SQLite
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, '..', 'data', 'controle-cartoes.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Create tables
const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Pessoas table
      db.run(`
        CREATE TABLE IF NOT EXISTS pessoas (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          nome TEXT NOT NULL,
          telefone TEXT,
          observacoes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Cartoes table
      db.run(`
        CREATE TABLE IF NOT EXISTS cartoes (
          id TEXT PRIMARY KEY,
          pessoa_id TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          descricao TEXT NOT NULL,
          valor_total REAL NOT NULL,
          parcelas_totais INTEGER NOT NULL,
          parcelas_pagas INTEGER DEFAULT 0,
          valor_pago REAL DEFAULT 0,
          data_vencimento DATE NOT NULL,
          observacoes TEXT,
          tipo_cartao TEXT DEFAULT 'credito',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (pessoa_id) REFERENCES pessoas (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Gastos table
      db.run(`
        CREATE TABLE IF NOT EXISTS gastos (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          descricao TEXT NOT NULL,
          valor REAL NOT NULL,
          data DATE NOT NULL,
          categoria TEXT NOT NULL,
          metodo_pagamento TEXT NOT NULL,
          observacoes TEXT,
          recorrente_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Recorrencias table
      db.run(`
        CREATE TABLE IF NOT EXISTS recorrencias (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          descricao TEXT NOT NULL,
          valor REAL NOT NULL,
          categoria TEXT NOT NULL,
          metodo_pagamento TEXT NOT NULL,
          frequencia TEXT NOT NULL,
          data_inicio DATE NOT NULL,
          ultima_execucao DATE,
          ativo BOOLEAN DEFAULT 1,
          observacoes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Sessions table for better session management
      db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          token_hash TEXT NOT NULL,
          device_info TEXT,
          ip_address TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // User settings table
      db.run(`
        CREATE TABLE IF NOT EXISTS user_settings (
          user_id INTEGER PRIMARY KEY,
          settings JSON,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
};

// Helper function to run queries with promises
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

// Helper function to get single row
const getRow = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Helper function to get all rows
const getAllRows = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

module.exports = {
  db,
  createTables,
  runQuery,
  getRow,
  getAllRows,
  DB_PATH
};
