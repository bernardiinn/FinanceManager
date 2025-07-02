/**
 * Cloud Sync Service - JWT-based Authentication
 * Simplified authentication system that relies purely on server-side session management
 * No localStorage dependencies - all session state is managed server-side
 */

import type { Pessoa, Cartao, Gasto, Recorrencia } from '../types';

interface User {
  id: number;
  email: string;
  name: string;
}

interface SessionInfo {
  id: string;
  expiresAt: string;
  createdAt: string;
  lastActivity: string;
  deviceInfo: string;
}

interface AuthResponse {
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

interface SyncData {
  pessoas: Pessoa[];
  cartoes: Cartao[];
  gastos: Gasto[];
  recorrencias: Recorrencia[];
  settings: Record<string, unknown>;
}

class CloudSyncService {
  private apiUrl: string;
  private token: string | null = null;
  private user: User | null = null;
  private sessionInfo: SessionInfo | null = null;

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
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
      console.error(`[CloudSyncService] Fetch error:`, fetchError);
      const message = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      throw new Error(`Network request failed: ${message}`);
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<User> {
    
    const response: AuthResponse = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    
    this.token = response.token;
    this.user = response.user;
    
    // Validate session immediately after login
    await this.validateSession();

    return this.user;
  }

  /**
   * Register new user
   */
  async register(email: string, password: string, name: string): Promise<User> {

    const response: AuthResponse = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    
    this.token = response.token;
    this.user = response.user;
    
    // Validate session immediately after registration
    await this.validateSession();

    return this.user;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    
    try {
      if (this.token) {
        await this.request('/auth/logout', {
          method: 'POST',
        });
      }
    } catch {
      // Ignore logout errors
    }
    
    // Clear local state
    this.token = null;
    this.user = null;
    this.sessionInfo = null;
    
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
      const response: SessionValidationResponse = await this.request('/auth/validate');
      
      this.user = response.user;
      this.sessionInfo = response.session;
      
      return true;
      
    } catch {
      this.token = null;
      this.user = null;
      this.sessionInfo = null;
      return false;
    }
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<User> {
    const response = await this.request<{ user: User }>('/auth/profile');
    this.user = (response as { user: User }).user;
    if (!this.user) {
      throw new Error('Failed to get user profile');
    }
    return this.user;
  }

  /**
   * Get current session info for UI
   */
  getSessionInfo(): {
    isAuthenticated: boolean;
    user: User | null;
    expiresAt: number | null;
    timeRemaining: number | null;
    sessionDuration: number | null;
    deviceInfo: string | null;
    lastActivity: number | null;
    sessionId: string | null;
  } {
    // If we have token and user, we're authenticated (even if sessionInfo is still loading)
    if (!this.token || !this.user) {
      return {
        isAuthenticated: false,
        user: null,
        expiresAt: null,
        timeRemaining: null,
        sessionDuration: null,
        deviceInfo: null,
        lastActivity: null,
        sessionId: null,
      };
    }

    // If sessionInfo is not available yet, return basic authenticated state
    if (!this.sessionInfo) {
      return {
        isAuthenticated: true,
        user: this.user,
        expiresAt: null,
        timeRemaining: null,
        sessionDuration: null,
        deviceInfo: null,
        lastActivity: null,
        sessionId: null,
      };
    }

    const expiresAt = new Date(this.sessionInfo.expiresAt).getTime();
    const createdAt = new Date(this.sessionInfo.createdAt).getTime();
    const lastActivity = new Date(this.sessionInfo.lastActivity).getTime();
    const currentTime = Date.now();

    return {
      isAuthenticated: true,
      user: this.user,
      expiresAt,
      timeRemaining: expiresAt - currentTime,
      sessionDuration: currentTime - createdAt,
      deviceInfo: this.sessionInfo.deviceInfo,
      lastActivity,
      sessionId: this.sessionInfo.id,
    };
  }

  /**
   * Get session analytics (simplified)
   */
  getSessionAnalytics(): Record<string, unknown> {
    if (!this.sessionInfo) {
      return {
        totalSessions: 0,
        averageSessionDuration: 0,
        lastLoginDate: 0,
        longestSession: 0,
        recentActivity: [],
      };
    }

    const createdAt = new Date(this.sessionInfo.createdAt).getTime();
    const currentTime = Date.now();
    const sessionDuration = currentTime - createdAt;

    return {
      totalSessions: 1, // Current session only
      averageSessionDuration: sessionDuration,
      lastLoginDate: createdAt,
      longestSession: sessionDuration,
      recentActivity: [
        {
          action: 'login',
          timestamp: createdAt,
          details: { deviceInfo: this.sessionInfo.deviceInfo }
        }
      ],
    };
  }

  /**
   * Get user sessions from server
   */
  async getUserSessions(): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.request<{ sessions: Record<string, unknown>[] }>('/auth/sessions');
      return ((response as { sessions: Record<string, unknown>[] }).sessions) || [];
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return [];
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!(this.token && this.user);
  }

  /**
   * Data sync methods (unchanged)
   */
  async syncData(data: SyncData): Promise<void> {
    await this.request('/data/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getData(): Promise<SyncData> {
    return this.request('/data');
  }

  async uploadData(data: SyncData): Promise<void> {
    await this.request('/data/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const cloudSyncService = new CloudSyncService();