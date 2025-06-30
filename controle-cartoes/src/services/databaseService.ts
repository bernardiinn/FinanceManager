/**
 * SQLite Database Service for Controle Cartões
 * 
 * Provides a SQLite-backed database layer using sql.js
 * for browser-based PWA functionality with offline support.
 */

import type { Pessoa, Cartao } from '../types';
import { generateUUID } from '../utils/uuid';

interface DatabaseConfig {
  dbName: string;
  userId?: string;
}

class DatabaseService {
  private SQL: any = null;
  private db: any = null;
  private initialized = false;
  private dbName = 'cartoes.db';
  private userId: string | null = null;

  /**
   * Initialize the SQLite database
   */
  async initialize(config?: DatabaseConfig): Promise<void> {
    if (this.initialized) return;

    try {
      
      // Use a simple, direct approach for SQL.js import
      let initSqlJs: any;
      
      // First try: check if SQL.js is already loaded in window
      if (typeof window !== 'undefined' && (window as any).initSqlJs) {
        initSqlJs = (window as any).initSqlJs;
      } else {
        // Second try: load from public directory
        
        if (typeof window !== 'undefined') {
          const script = document.createElement('script');
          script.src = '/sql.js/sql-wasm.js';
          script.async = false; // Load synchronously to avoid race conditions
          
          await new Promise<void>((resolve, reject) => {
            script.onload = () => {
              if ((window as any).initSqlJs) {
                resolve();
              } else {
                reject(new Error('initSqlJs not found after loading script'));
              }
            };
            script.onerror = (error) => {
              console.error('❌ Failed to load sql-wasm.js script:', error);
              reject(new Error('Failed to load sql-wasm.js'));
            };
            document.head.appendChild(script);
          });
          
          initSqlJs = (window as any).initSqlJs;
        } else {
          throw new Error('Window object not available');
        }
      }
      
      if (typeof initSqlJs !== 'function') {
        throw new Error(`initSqlJs is not a function, got: ${typeof initSqlJs}. SQL.js may not be properly installed or imported.`);
      }
      
      // Initialize SQL.js with proper WASM file location
      this.SQL = await initSqlJs({
        locateFile: (file: string) => {
          // First try from public directory
          if (file.endsWith('.wasm')) {
            return `/sql.js/${file}`;
          }
          // Fallback to CDN
          return `https://sql.js.org/dist/${file}`;
        }
      });


      // Set user-specific database name if provided
      if (config?.userId) {
        this.userId = config.userId;
        this.dbName = `cartoes_${config.userId}.db`;
      } else if (config?.dbName) {
        this.dbName = config.dbName;
      }

      // Try to load existing database from IndexedDB/storage
      await this.loadDatabase();

      // Create tables if they don't exist
      await this.createTables();

      // Setup auto-save
      this.setupAutoSave();

      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }

  // === GASTOS (EXPENSES) CRUD OPERATIONS ===

  /**
   * Create a new gasto (expense)
   */
  async createGasto(gasto: any): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const id = generateUUID();
    const stmt = this.db.prepare(`
      INSERT INTO gastos (id, descricao, valor, categoria, data, observacoes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      id,
      gasto.descricao,
      gasto.valor,
      gasto.categoria || null,
      gasto.data,
      gasto.observacoes || null
    ]);
    stmt.free();

    await this.saveDatabase();
    return { ...gasto, id };
  }

  /**
   * Get all gastos (expenses)
   */
  async getGastos(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM gastos ORDER BY data DESC');
    const gastos: any[] = [];
    const columns = stmt.getColumnNames();
    
    while (stmt.step()) {
      const values = stmt.get();
      const row: any = {};
      columns.forEach((col, index) => {
        row[col] = values[index];
      });
      gastos.push(row);
    }
    
    stmt.free();
    return gastos;
  }

  /**
   * Get gasto by ID
   */
  async getGastoById(id: string): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM gastos WHERE id = ?');
    stmt.bind([id]);
    
    let result = null;
    if (stmt.step()) {
      const columns = stmt.getColumnNames();
      const values = stmt.get();
      result = {};
      columns.forEach((col, index) => {
        result[col] = values[index];
      });
    }
    stmt.free();
    return result;
  }

  /**
   * Update gasto
   */
  async updateGasto(gasto: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      UPDATE gastos 
      SET descricao = ?, valor = ?, categoria = ?, data = ?, observacoes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run([
      gasto.descricao,
      gasto.valor,
      gasto.categoria || null,
      gasto.data,
      gasto.observacoes || null,
      gasto.id
    ]);
    stmt.free();

    await this.saveDatabase();
  }

  /**
   * Delete gasto
   */
  async deleteGasto(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('DELETE FROM gastos WHERE id = ?');
    stmt.run([id]);
    stmt.free();

    await this.saveDatabase();
  }

  // === RECORRENCIAS (RECURRING TRANSACTIONS) CRUD OPERATIONS ===

  /**
   * Create a new recorrencia
   */
  async createRecorrencia(recorrencia: any): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const id = generateUUID();
    const stmt = this.db.prepare(`
      INSERT INTO recorrencias (id, nome, valor, categoria, tipo, frequencia, data_inicio, data_fim, ativo, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      id,
      recorrencia.nome,
      recorrencia.valor,
      recorrencia.categoria || null,
      recorrencia.tipo,
      recorrencia.frequencia,
      recorrencia.data_inicio,
      recorrencia.data_fim || null,
      recorrencia.ativo !== false, // Default to true
      recorrencia.observacoes || null
    ]);
    stmt.free();

    await this.saveDatabase();
    return { ...recorrencia, id };
  }

  /**
   * Get all recorrencias
   */
  async getRecorrencias(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM recorrencias ORDER BY nome');
    const recorrencias: any[] = [];
    const columns = stmt.getColumnNames();
    
    while (stmt.step()) {
      const values = stmt.get();
      const row: any = {};
      columns.forEach((col, index) => {
        row[col] = values[index];
      });
      recorrencias.push(row);
    }
    
    stmt.free();
    return recorrencias;
  }

  /**
   * Get recorrencia by ID
   */
  async getRecorrenciaById(id: string): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM recorrencias WHERE id = ?');
    stmt.bind([id]);
    
    let result = null;
    if (stmt.step()) {
      const columns = stmt.getColumnNames();
      const values = stmt.get();
      result = {};
      columns.forEach((col, index) => {
        result[col] = values[index];
      });
    }
    stmt.free();
    return result;
  }

  /**
   * Update recorrencia
   */
  async updateRecorrencia(recorrencia: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      UPDATE recorrencias 
      SET nome = ?, valor = ?, categoria = ?, tipo = ?, frequencia = ?, data_inicio = ?, data_fim = ?, ativo = ?, observacoes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run([
      recorrencia.nome,
      recorrencia.valor,
      recorrencia.categoria || null,
      recorrencia.tipo,
      recorrencia.frequencia,
      recorrencia.data_inicio,
      recorrencia.data_fim || null,
      recorrencia.ativo !== false,
      recorrencia.observacoes || null,
      recorrencia.id
    ]);
    stmt.free();

    await this.saveDatabase();
  }

  /**
   * Delete recorrencia
   */
  async deleteRecorrencia(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('DELETE FROM recorrencias WHERE id = ?');
    stmt.run([id]);
    stmt.free();

    await this.saveDatabase();
  }

  // === SETTINGS CRUD OPERATIONS ===

  /**
   * Get setting value
   */
  async getSetting(key: string, defaultValue: any = null): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
    stmt.bind([key]);
    
    let result = defaultValue;
    if (stmt.step()) {
      const value = stmt.get()[0];
      try {
        result = JSON.parse(value);
      } catch {
        result = value;
      }
    }
    stmt.free();
    return result;
  }

  /**
   * Set setting value
   */
  async setSetting(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run([key, serializedValue]);
    stmt.free();

    await this.saveDatabase();
  }

  /**
   * Get all settings
   */
  async getAllSettings(): Promise<Record<string, any>> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT key, value FROM settings');
    const settings: Record<string, any> = {};
    
    while (stmt.step()) {
      const [key, value] = stmt.get();
      try {
        settings[key] = JSON.parse(value);
      } catch {
        settings[key] = value;
      }
    }
    
    stmt.free();
    return settings;
  }

  // === USER PROFILES CRUD OPERATIONS ===

  /**
   * Create user profile
   */
  async createUserProfile(profile: any): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const id = generateUUID();
    const stmt = this.db.prepare(`
      INSERT INTO user_profiles (id, name, email, is_active)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run([
      id,
      profile.name,
      profile.email || null,
      profile.is_active !== false
    ]);
    stmt.free();

    await this.saveDatabase();
    return { ...profile, id };
  }

  /**
   * Get all user profiles
   */
  async getUserProfiles(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM user_profiles ORDER BY name');
    const profiles: any[] = [];
    const columns = stmt.getColumnNames();
    
    while (stmt.step()) {
      const values = stmt.get();
      const row: any = {};
      columns.forEach((col, index) => {
        row[col] = values[index];
      });
      profiles.push(row);
    }
    
    stmt.free();
    return profiles;
  }

  /**
   * Get active user profile
   */
  async getActiveUserProfile(): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM user_profiles WHERE is_active = 1 LIMIT 1');
    
    let result = null;
    if (stmt.step()) {
      const columns = stmt.getColumnNames();
      const values = stmt.get();
      result = {};
      columns.forEach((col, index) => {
        result[col] = values[index];
      });
    }
    stmt.free();
    return result;
  }

  /**
   * Set active user
   */
  async setActiveUser(userId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // First, deactivate all users
    const deactivateStmt = this.db.prepare('UPDATE user_profiles SET is_active = 0');
    deactivateStmt.run();
    deactivateStmt.free();

    // Then activate the selected user and update last_active
    const activateStmt = this.db.prepare(`
      UPDATE user_profiles 
      SET is_active = 1, last_active = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    activateStmt.run([userId]);
    activateStmt.free();

    await this.saveDatabase();
  }

  /**
   * Export database as binary data
   */
  async exportDatabaseBinary(): Promise<Uint8Array> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    return this.db.export();
  }

  /**
   * Load database from IndexedDB (via OPFS/absurd-sql) or create new one
   */
  private async loadDatabase(): Promise<void> {
    if (!this.SQL) throw new Error('SQL.js not initialized');

    try {
      // Try to load existing database from IndexedDB first
      const existingData = await this.loadFromIndexedDB();
      
      if (existingData) {
        this.db = new this.SQL.Database(existingData);
      } else {
        // Try to use OPFS for persistent storage (modern browsers)
        if ('showDirectoryPicker' in window || 'storage' in navigator) {
          
          // For now, create in-memory database with plan to use absurd-sql
          this.db = new this.SQL.Database();
          
          // No legacy localStorage migration needed - app is fully DB-backed
          
        } else {
          // Fallback to memory database for older browsers
          this.db = new this.SQL.Database();
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to load from persistent storage, using memory database:', error);
      this.db = new this.SQL.Database();
    }
  }

  /**
   * Migrate data from legacy localStorage database
   */
  private async migrateLegacyData(legacyDb: any): Promise<void> {
    try {
      // Get all tables from legacy database
      const tables = ['pessoas', 'cartoes', 'installments', 'gastos', 'recorrencias', 'settings', 'user_profiles'];
      
      for (const table of tables) {
        try {
          const stmt = legacyDb.prepare(`SELECT * FROM ${table}`);
          while (stmt.step()) {
            const row = stmt.getAsObject();
            
            // Insert into new database
            const columns = Object.keys(row);
            const placeholders = columns.map(() => '?').join(', ');
            const values = columns.map(col => row[col]);
            
            const insertStmt = this.db.prepare(`
              INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) 
              VALUES (${placeholders})
            `);
            insertStmt.run(values);
            insertStmt.free();
          }
          stmt.free();
        } catch (error) {
        }
      }
    } catch (error) {
      console.warn('⚠️ Legacy data migration failed:', error);
    }
  }

  /**
   * Create database tables and indexes
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const schema = `
      -- Pessoas table
      CREATE TABLE IF NOT EXISTS pessoas (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        telefone TEXT,
        email TEXT,
        observacoes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Cartoes table
      CREATE TABLE IF NOT EXISTS cartoes (
        id TEXT PRIMARY KEY,
        pessoa_id TEXT NOT NULL,
        descricao TEXT NOT NULL,
        valor_total REAL NOT NULL,
        numero_de_parcelas INTEGER NOT NULL,
        parcelas_pagas INTEGER DEFAULT 0,
        data_compra DATE NOT NULL,
        observacoes TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pessoa_id) REFERENCES pessoas(id) ON DELETE CASCADE
      );

      -- Installments table for detailed tracking
      CREATE TABLE IF NOT EXISTS installments (
        id TEXT PRIMARY KEY,
        cartao_id TEXT NOT NULL,
        number INTEGER NOT NULL,
        value REAL NOT NULL,
        due_date DATE NOT NULL,
        paid_date DATE,
        is_paid BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cartao_id) REFERENCES cartoes(id) ON DELETE CASCADE,
        UNIQUE(cartao_id, number)
      );

      -- Gastos (Expenses) table
      CREATE TABLE IF NOT EXISTS gastos (
        id TEXT PRIMARY KEY,
        descricao TEXT NOT NULL,
        valor REAL NOT NULL,
        categoria TEXT,
        data DATE NOT NULL,
        observacoes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Recorrencias (Recurring Transactions) table
      CREATE TABLE IF NOT EXISTS recorrencias (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        valor REAL NOT NULL,
        categoria TEXT,
        tipo TEXT NOT NULL CHECK (tipo IN ('income', 'expense')),
        frequencia TEXT NOT NULL CHECK (frequencia IN ('monthly', 'weekly', 'daily', 'yearly')),
        data_inicio DATE NOT NULL,
        data_fim DATE,
        ativo BOOLEAN DEFAULT TRUE,
        observacoes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Settings table for app configuration
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- User profiles for multi-user support
      CREATE TABLE IF NOT EXISTS user_profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        is_active BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_active DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Sessions table for authentication
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        device_info TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_cartoes_pessoa_id ON cartoes(pessoa_id);
      CREATE INDEX IF NOT EXISTS idx_cartoes_status ON cartoes(status);
      CREATE INDEX IF NOT EXISTS idx_installments_cartao_id ON installments(cartao_id);
      CREATE INDEX IF NOT EXISTS idx_installments_paid ON installments(is_paid);
      CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);
      CREATE INDEX IF NOT EXISTS idx_gastos_data ON gastos(data);
      CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos(categoria);
      CREATE INDEX IF NOT EXISTS idx_recorrencias_ativo ON recorrencias(ativo);
      CREATE INDEX IF NOT EXISTS idx_recorrencias_tipo ON recorrencias(tipo);
      CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles(is_active);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
    `;

    this.db.exec(schema);
  }

  /**
   * Setup auto-save to IndexedDB/OPFS instead of localStorage
   */
  private setupAutoSave(): void {
    // Save every 10 seconds for better performance
    setInterval(() => {
      this.persistDatabase();
    }, 10000);

    // Save on page unload
    window.addEventListener('beforeunload', () => {
      this.persistDatabase();
    });

    // Save on visibility change (mobile app switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.persistDatabase();
      }
    });
  }

  /**
   * Persist database to proper storage (not localStorage)
   */
  private persistDatabase(): void {
    if (!this.db) return;

    try {
      // For now, we'll use a simple approach
      const data = this.db.export();
      
      // Use IndexedDB instead of localStorage for larger data capacity
      this.saveToIndexedDB(data);
      
    } catch (error) {
      console.warn('⚠️ Failed to persist database:', error);
    }
  }

  /**
   * Save to IndexedDB instead of localStorage
   */
  private async saveToIndexedDB(data: Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
      const dbName = 'ControleCartoesDB';
      const request = indexedDB.open(dbName, 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['databases'], 'readwrite');
        const store = transaction.objectStore('databases');
        
        store.put({
          id: this.dbName,
          data: Array.from(data),
          lastModified: Date.now()
        });
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('databases')) {
          db.createObjectStore('databases', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Load from IndexedDB instead of localStorage
   */
  private async loadFromIndexedDB(): Promise<Uint8Array | null> {
    return new Promise((resolve, reject) => {
      const dbName = 'ControleCartoesDB';
      const request = indexedDB.open(dbName, 1);
      
      request.onerror = () => resolve(null); // Don't reject, just return null
      
      request.onsuccess = () => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains('databases')) {
          resolve(null);
          return;
        }
        
        const transaction = db.transaction(['databases'], 'readonly');
        const store = transaction.objectStore('databases');
        const getRequest = store.get(this.dbName);
        
        getRequest.onsuccess = () => {
          const result = getRequest.result;
          if (result && result.data) {
            resolve(new Uint8Array(result.data));
          } else {
            resolve(null);
          }
        };
        
        getRequest.onerror = () => resolve(null);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('databases')) {
          db.createObjectStore('databases', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Force save database to persistent storage
   */
  async saveDatabase(): Promise<void> {
    this.persistDatabase();
  }

  // === PESSOA CRUD OPERATIONS ===

  /**
   * Create a new pessoa with transaction support
   */
  async createPessoa(pessoa: Omit<Pessoa, 'id' | 'cartoes'>): Promise<Pessoa> {
    if (!this.db) throw new Error('Database not initialized');

    const id = generateUUID();
    
    // Use transaction to ensure data consistency
    this.db.exec('BEGIN TRANSACTION');
    
    try {
      const stmt = this.db.prepare(`
        INSERT INTO pessoas (id, nome, telefone, email, observacoes)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run([
        id,
        pessoa.nome,
        pessoa.telefone || null,
        pessoa.email || null,
        pessoa.observacoes || null
      ]);
      stmt.free();

      this.db.exec('COMMIT');
      await this.saveDatabase();
      
      return this.getPessoaById(id);
    } catch (error) {
      this.db.exec('ROLLBACK');
      
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('UNIQUE constraint failed')) {
          throw new Error('Esta pessoa já existe no sistema.');
        } else if (error.message.includes('NOT NULL constraint failed')) {
          throw new Error('Nome é obrigatório para criar uma pessoa.');
        }
      }
      
      throw error;
    }
  }

  /**
   * Get pessoa by ID
   */
  async getPessoaById(id: string): Promise<Pessoa> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM pessoas WHERE id = ?');
    stmt.bind([id]);
    
    let result = null;
    if (stmt.step()) {
      const columns = stmt.getColumnNames();
      const values = stmt.get();
      result = {};
      columns.forEach((col, index) => {
        result[col] = values[index];
      });
    }
    stmt.free();

    if (!result) {
      throw new Error(`Pessoa with id ${id} not found`);
    }

    const cartoes = await this.getCartoesByPessoaId(id);
    return { ...result, cartoes } as Pessoa;
  }

  /**
   * Get all pessoas with their cartoes
   */
  async getPessoas(): Promise<Pessoa[]> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT p.*,
             COUNT(c.id) as total_cartoes,
             COALESCE(SUM(
               CASE 
                 WHEN c.status = 'active' 
                 THEN c.valor_total - (c.valor_total * c.parcelas_pagas / c.numero_de_parcelas)
                 ELSE 0
               END
             ), 0) as saldo_devedor
      FROM pessoas p
      LEFT JOIN cartoes c ON p.id = c.pessoa_id
      GROUP BY p.id
      ORDER BY p.nome
    `);

    const pessoas: Pessoa[] = [];
    const columns = stmt.getColumnNames();
    
    while (stmt.step()) {
      const values = stmt.get();
      const row: any = {};
      columns.forEach((col, index) => {
        row[col] = values[index];
      });
      
      const cartoes = await this.getCartoesByPessoaId(row.id as string);
      pessoas.push({ ...row, cartoes } as Pessoa);
    }
    
    stmt.free();
    return pessoas;
  }

  /**
   * Update pessoa
   */
  async updatePessoa(pessoa: Pessoa): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      UPDATE pessoas 
      SET nome = ?, telefone = ?, email = ?, observacoes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run([
      pessoa.nome,
      pessoa.telefone || null,
      pessoa.email || null,
      pessoa.observacoes || null,
      pessoa.id
    ]);
    stmt.free();

    await this.saveDatabase();
  }

  /**
   * Delete pessoa (cascade deletes cartoes)
   */
  async deletePessoa(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('DELETE FROM pessoas WHERE id = ?');
    stmt.run([id]);
    stmt.free();

    await this.saveDatabase();
  }

  // === CARTAO CRUD OPERATIONS ===

  /**
   * Get cartoes by pessoa ID
   */
  async getCartoesByPessoaId(pessoaId: string): Promise<Cartao[]> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT c.*,
             COUNT(i.id) as total_installments,
             COUNT(CASE WHEN i.is_paid = 1 THEN 1 END) as paid_installments
      FROM cartoes c
      LEFT JOIN installments i ON c.id = i.cartao_id
      WHERE c.pessoa_id = ?
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);

    stmt.bind([pessoaId]);
    
    const cartoes: Cartao[] = [];
    const columns = stmt.getColumnNames();
    
    while (stmt.step()) {
      const values = stmt.get();
      const row: any = {};
      columns.forEach((col, index) => {
        row[col] = values[index];
      });
      
      const installments = await this.getInstallmentsByCartaoId(row.id as string);
      cartoes.push({ ...row, installments } as Cartao);
    }
    
    stmt.free();
    return cartoes;
  }

  /**
   * Create a new cartao with transaction support
   */
  async createCartao(pessoaId: string, cartao: Omit<Cartao, 'id' | 'pessoa_id'>): Promise<Cartao> {
    if (!this.db) throw new Error('Database not initialized');

    const id = generateUUID();
    
    // Use transaction to ensure data consistency
    this.db.exec('BEGIN TRANSACTION');
    
    try {
      // Insert cartao
      const stmt = this.db.prepare(`
        INSERT INTO cartoes (id, pessoa_id, descricao, valor_total, numero_de_parcelas, 
                            parcelas_pagas, data_compra, observacoes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        id,
        pessoaId,
        cartao.descricao,
        cartao.valor_total,
        cartao.numero_de_parcelas,
        cartao.parcelas_pagas || 0,
        cartao.data_compra,
        cartao.observacoes || null,
        cartao.status || 'active'
      ]);
      stmt.free();

      // Create installments if provided
      if (cartao.installments && cartao.installments.length > 0) {
        await this.createInstallments(id, cartao.installments);
      }

      this.db.exec('COMMIT');
      await this.saveDatabase();
      
      // Return the created cartao with installments
      const cartoes = await this.getCartoesByPessoaId(pessoaId);
      return cartoes.find(c => c.id === id)!;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  /**
   * Update cartao
   */
  async updateCartao(cartao: Cartao): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      UPDATE cartoes 
      SET descricao = ?, valor_total = ?, numero_de_parcelas = ?, parcelas_pagas = ?,
          data_compra = ?, observacoes = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run([
      cartao.descricao,
      cartao.valor_total,
      cartao.numero_de_parcelas,
      cartao.parcelas_pagas,
      cartao.data_compra,
      cartao.observacoes || null,
      cartao.status,
      cartao.id
    ]);
    stmt.free();

    await this.saveDatabase();
  }

  /**
   * Delete cartao
   */
  async deleteCartao(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('DELETE FROM cartoes WHERE id = ?');
    stmt.run([id]);
    stmt.free();

    await this.saveDatabase();
  }

  // === INSTALLMENT OPERATIONS ===

  /**
   * Get installments by cartao ID
   */
  async getInstallmentsByCartaoId(cartaoId: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT * FROM installments 
      WHERE cartao_id = ? 
      ORDER BY number
    `);

    stmt.bind([cartaoId]);
    
    const installments: any[] = [];
    const columns = stmt.getColumnNames();
    
    while (stmt.step()) {
      const values = stmt.get();
      const row: any = {};
      columns.forEach((col, index) => {
        row[col] = values[index];
      });
      installments.push(row);
    }
    
    stmt.free();
    return installments;
  }

  /**
   * Create installments for a cartao
   */
  async createInstallments(cartaoId: string, installments: any[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT INTO installments (id, cartao_id, number, value, due_date, paid_date, is_paid)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const installment of installments) {
      stmt.run([
        generateUUID(),
        cartaoId,
        installment.number,
        installment.value,
        installment.dueDate,
        installment.paidDate || null,
        installment.isPaid ? 1 : 0
      ]);
    }
    stmt.free();
  }

  /**
   * Mark installment as paid
   */
  async markInstallmentAsPaid(cartaoId: string, installmentNumber: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      UPDATE installments 
      SET is_paid = 1, paid_date = CURRENT_TIMESTAMP
      WHERE cartao_id = ? AND number = ?
    `);

    stmt.run([cartaoId, installmentNumber]);
    stmt.free();

    // Update cartao parcelas_pagas count
    const countStmt = this.db.prepare(`
      UPDATE cartoes 
      SET parcelas_pagas = (
        SELECT COUNT(*) FROM installments 
        WHERE cartao_id = ? AND is_paid = 1
      )
      WHERE id = ?
    `);

    countStmt.run([cartaoId, cartaoId]);
    countStmt.free();

    await this.saveDatabase();
  }

  // === ANALYTICS & REPORTS ===

  /**
   * Get financial summary
   */
  async getFinancialSummary(): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT 
        COUNT(DISTINCT p.id) as total_pessoas,
        COUNT(DISTINCT c.id) as total_cartoes,
        COALESCE(SUM(c.valor_total), 0) as valor_total_emprestado,
        COALESCE(SUM(c.valor_total * c.parcelas_pagas / c.numero_de_parcelas), 0) as valor_pago,
        COALESCE(SUM(
          CASE 
            WHEN c.status = 'active' 
            THEN c.valor_total - (c.valor_total * c.parcelas_pagas / c.numero_de_parcelas)
            ELSE 0
          END
        ), 0) as saldo_devedor,
        COUNT(CASE WHEN c.status = 'completed' THEN 1 END) as cartoes_quitados,
        COUNT(CASE WHEN c.status = 'active' THEN 1 END) as cartoes_ativos
      FROM pessoas p
      LEFT JOIN cartoes c ON p.id = c.pessoa_id
    `);

    let result = {};
    const columns = stmt.getColumnNames();
    
    if (stmt.step()) {
      const values = stmt.get();
      columns.forEach((col, index) => {
        result[col] = values[index];
      });
    }
    
    stmt.free();
    return result;
  }

  // === BACKUP & MIGRATION ===

  /**
   * Export database as binary data
   */
  async exportDatabase(): Promise<Uint8Array> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.export();
  }

  /**
   * Import database from binary data
   */
  async importDatabase(data: Uint8Array): Promise<void> {
    if (!this.SQL) throw new Error('SQL.js not initialized');

    // Close current database
    if (this.db) {
      this.db.close();
    }

    // Create new database from imported data
    this.db = new this.SQL.Database(data);
    
    // TODO: Save to backend API instead of localStorage
    await this.saveDatabase();
  }

  /**
   * Get database info and statistics
   */
  async getDatabaseInfo(): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM pessoas) as total_pessoas,
        (SELECT COUNT(*) FROM cartoes) as total_cartoes,
        (SELECT COUNT(*) FROM installments) as total_installments,
        (SELECT COUNT(*) FROM gastos) as total_gastos,
        (SELECT COUNT(*) FROM recorrencias) as total_recorrencias,
        (SELECT COUNT(*) FROM user_profiles) as total_users,
        ? as db_name,
        ? as user_id
    `);

    stmt.bind([this.dbName, this.userId || 'default']);
    
    let result = {};
    const columns = stmt.getColumnNames();
    
    if (stmt.step()) {
      const values = stmt.get();
      columns.forEach((col, index) => {
        result[col] = values[index];
      });
    }
    
    stmt.free();
    return result;
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      // Save before closing
      this.persistDatabase();
      
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }

  // === SESSION MANAGEMENT ===

  /**
   * Create a new session for a user
   * @param userId - ID of the user
   * @param deviceInfo - optional device info
   * @param ipAddress - optional IP address
   * @returns tokenHash
   */
  async createSession(userId: string, deviceInfo?: string, ipAddress?: string): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    const token = generateUUID();
    // sessions.id can be same as token
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes
    const stmt = this.db.prepare(
      `INSERT INTO sessions (id, user_id, token_hash, device_info, ip_address, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    stmt.run([
      token,
      userId,
      token,
      deviceInfo || null,
      ipAddress || null,
      expiresAt
    ]);
    stmt.free();
    await this.saveDatabase();
    return token;
  }

  /**
   * Validate a session token
   * @param tokenHash - session token
   * @returns userId if valid
   * @throws Error if invalid or expired
   */
  async validateSession(tokenHash: string): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    const stmt = this.db.prepare(
      `SELECT user_id, expires_at, is_active FROM sessions WHERE token_hash = ?`);
    stmt.bind([tokenHash]);
    let userId: string | null = null;
    let expiresAt: string;
    let isActive: number;
    if (stmt.step()) {
      [userId, expiresAt, isActive] = stmt.get();
    }
    stmt.free();
    if (!userId || isActive !== 1) {
      throw new Error('Invalid session');
    }
    // Check expiration
    if (new Date(expiresAt).getTime() <= Date.now()) {
      // expire session
      const delStmt = this.db.prepare(
        `UPDATE sessions SET is_active = 0 WHERE token_hash = ?`);
      delStmt.run([tokenHash]);
      delStmt.free();
      await this.saveDatabase();
      throw new Error('Session expired');
    }
    // Update last_activity
    const upd = this.db.prepare(
      `UPDATE sessions SET last_activity = CURRENT_TIMESTAMP WHERE token_hash = ?`);
    upd.run([tokenHash]);
    upd.free();
    await this.saveDatabase();
    return userId;
  }

  /**
   * Logout a session (deactivate)
   * @param tokenHash - session token
   */
  async logoutSession(tokenHash: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const stmt = this.db.prepare(
      `UPDATE sessions SET is_active = 0 WHERE token_hash = ?`);
    stmt.run([tokenHash]);
    stmt.free();
    await this.saveDatabase();
  }

  /**
   * Get the current active session token
   * @returns object with tokenHash and userId, or null
   */
  async getActiveSession(): Promise<{ tokenHash: string; userId: string; expiresAt: string } | null> {
    if (!this.db) throw new Error('Database not initialized');
    const stmt = this.db.prepare(
      `SELECT token_hash, user_id, expires_at FROM sessions WHERE is_active = 1 AND expires_at > CURRENT_TIMESTAMP ORDER BY last_activity DESC LIMIT 1`
    );
    let result: { tokenHash: string; userId: string } | null = null;
    if (stmt.step()) {
      const [tokenHash, userId, expiresAt] = stmt.get() as [string, string, string];
      result = { tokenHash, userId, expiresAt };
    }
    stmt.free();
    return result;
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
export default databaseService;
