/**
 * Backend Authentication Service
 * Handles authentication with the backend API using only in-memory storage
 * No localStorage, cookies, or persistent browser storage
 */

interface User {
  id: number;
  email: string;
  name: string;
}

interface LoginResponse {
  message: string;
  token: string;
  sessionId: string;
  user: User;
}

interface SessionValidationResponse {
  valid: boolean;
  user: User;
  session: {
    id: string;
    createdAt: string;
    lastActivity: string;
    expiresAt: string;
    deviceInfo: string;
  };
}

class BackendAuthService {
  private apiUrl: string;
  private token: string | null = null;
  private user: User | null = null;
  private sessionInfo: { 
    id?: string;
    expiresAt?: string;
    loginTime?: string;
    deviceInfo?: string;
  } | null = null;
  private readonly TOKEN_KEY = 'controle_cartoes_session_token';
  private readonly USER_KEY = 'controle_cartoes_session_user';

  constructor() {
    // Use environment variable or default to localhost
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    
    // One-time cleanup of all localStorage (since we're moving to sessionStorage only)
    this.cleanupLegacyStorage();
    
    // Restore session from sessionStorage on initialization
    this.restoreSession();
  }

  /**
   * Clean up legacy localStorage data (one-time cleanup)
   */
  private cleanupLegacyStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Get all localStorage keys that might be related to the old system
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('controle') || 
          key.includes('pessoa') || 
          key.includes('cartao') || 
          key.includes('gasto') || 
          key.includes('auth') ||
          key.includes('user') ||
          key.includes('session') ||
          key.includes('theme') ||
          key.includes('settings')
        )) {
          keysToRemove.push(key);
        }
      }
      
      if (keysToRemove.length > 0) {
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
    } catch (error) {
      console.error(`[BackendAuthService] ❌ Failed to cleanup legacy storage:`, error);
    }
  }

  /**
   * Restore session from sessionStorage
   */
  private restoreSession(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const storedToken = sessionStorage.getItem(this.TOKEN_KEY);
      const storedUser = sessionStorage.getItem(this.USER_KEY);
      
      if (storedToken && storedUser) {
        this.token = storedToken;
        this.user = JSON.parse(storedUser);
      }
    } catch (error) {
      console.error(`[BackendAuthService] ❌ Failed to restore session:`, error);
      this.clearStoredSession();
    }
  }

  /**
   * Store session in sessionStorage
   */
  private storeSession(): void {
    if (typeof window === 'undefined') return;
    
    try {
      if (this.token && this.user) {
        sessionStorage.setItem(this.TOKEN_KEY, this.token);
        sessionStorage.setItem(this.USER_KEY, JSON.stringify(this.user));
      }
    } catch (error) {
      console.error(`[BackendAuthService] ❌ Failed to store session:`, error);
    }
  }

  /**
   * Clear stored session
   */
  private clearStoredSession(): void {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.error(`[BackendAuthService] ❌ Failed to clear stored session:`, error);
    }
  }

  /**
   * Make authenticated request to API
   */
  private async request<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (fetchError) {
      console.error(`[BackendAuthService] Request failed:`, fetchError);
      throw fetchError;
    }
  }

  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<User> {
    
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Store token and user in memory and sessionStorage
    this.token = response.token;
    this.user = response.user;
    this.storeSession();
    
    
    // Validate session immediately to get session info
    await this.validateSession();

    return this.user;
  }

  /**
   * Register new user
   */
  async register(email: string, password: string, name: string): Promise<User> {

    const response = await this.request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    // Store token and user in memory and sessionStorage
    this.token = response.token;
    this.user = response.user;
    this.storeSession();
    
    
    // Validate session immediately to get session info
    await this.validateSession();

    return this.user;
  }

  /**
   * Validate current session with server
   */
  async validateSession(): Promise<boolean> {
    
    if (!this.token) {
      this.user = null;
      this.sessionInfo = null;
      return false;
    }


    try {
      const response = await this.request<SessionValidationResponse>('/auth/validate');
      
      this.user = response.user;
      this.sessionInfo = response.session;
      
      return true;
      
    } catch {
      
      this.token = null;
      this.user = null;
      this.sessionInfo = null;
      this.clearStoredSession();
      return false;
    }
  }

  /**
   * Logout user (clear memory and invalidate server session)
   */
  async logout(): Promise<void> {
    
    try {
      if (this.token) {
        await this.request('/auth/logout', {
          method: 'POST',
        });
      }
    } catch {
      // Ignore logout errors - we'll clear the session anyway
    }
    
    // Clear in-memory state and stored session
    this.token = null;
    this.user = null;
    this.sessionInfo = null;
    this.clearStoredSession();
    
  }

  /**
   * Get current authentication state
   */
  getAuthState(): {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    expiresAt: number | null;
    timeRemaining: number | null;
    sessionId: string | null;
  } {
    if (!this.token || !this.user) {
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        expiresAt: null,
        timeRemaining: null,
        sessionId: null,
      };
    }

    let expiresAt = null;
    let timeRemaining = null;
    let sessionId = null;

    if (this.sessionInfo) {
      expiresAt = this.sessionInfo.expiresAt ? new Date(this.sessionInfo.expiresAt).getTime() : null;
      timeRemaining = expiresAt ? expiresAt - Date.now() : null;
      sessionId = this.sessionInfo.id || null;
    }

    return {
      isAuthenticated: true,
      user: this.user,
      token: this.token,
      expiresAt,
      timeRemaining,
      sessionId,
    };
  }

  /**
   * Check if current session is expired
   */
  isSessionExpired(): boolean {
    if (!this.sessionInfo || !this.sessionInfo.expiresAt) return true;
    
    const expiresAt = new Date(this.sessionInfo.expiresAt).getTime();
    return Date.now() >= expiresAt;
  }

  /**
   * Sync data from backend (requires authentication)
   */
  async syncData(): Promise<unknown> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    return await this.request('/data/sync');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!(this.token && this.user && !this.isSessionExpired());
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.user;
  }

  /**
   * Get current token (for debugging only)
   */
  getCurrentToken(): string | null {
    return this.token;
  }
}

// Export singleton instance
export const backendAuthService = new BackendAuthService();
export default backendAuthService;
