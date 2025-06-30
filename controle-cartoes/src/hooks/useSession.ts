import { useState, useEffect, useCallback, useRef } from 'react';
import { backendAuthService } from '../services/backendAuthService';

interface SessionState {
  isAuthenticated: boolean;
  user: any | null;
  isLoading: boolean;
  timeRemaining: number | null;
  expiresAt: number | null;
  sessionId: string | null;
}

interface UseSessionReturn extends SessionState {
  login: (email: string, password?: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  validate: () => Promise<void>;
}

export const useSession = (): UseSessionReturn => {
  
  const [sessionState, setSessionState] = useState<SessionState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    timeRemaining: null,
    expiresAt: null,
    sessionId: null,
  });
  const timerRef = useRef<number | null>(null);


  // Clear any existing timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Initialize session on mount (simulates app startup/refresh)
  useEffect(() => {
    
    // Small delay to ensure services are initialized
    const initTimer = setTimeout(() => {
      validate();
    }, 100);

    return () => clearTimeout(initTimer);
  }, []); // Empty dependency array = runs once on mount

  // Update session state from backend auth service
  const updateSessionState = useCallback(() => {
    const authState = backendAuthService.getAuthState();
    
    setSessionState({
      isAuthenticated: authState.isAuthenticated,
      user: authState.user,
      isLoading: false,
      timeRemaining: authState.timeRemaining,
      expiresAt: authState.expiresAt,
      sessionId: authState.sessionId,
    });
  }, []);

  // Validate session from backend
  const validate = useCallback(async () => {
    setSessionState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const isValid = await backendAuthService.validateSession();
      
      if (isValid) {
      } else {
      }
      
      updateSessionState();
    } catch (error) {
      setSessionState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        timeRemaining: null,
        expiresAt: null,
        sessionId: null,
      });
    }
  }, [updateSessionState]);

  const login = useCallback(async (email: string, password?: string) => {
    setSessionState(prev => ({ ...prev, isLoading: true }));
    
    try {
      let user;
      if (password) {
        // Login with email and password
        user = await backendAuthService.login(email, password);
      } else {
        // For compatibility with existing code that only passes email
        // This would need to be updated in calling code to include password
        throw new Error('Password is required for backend authentication');
      }
      
      updateSessionState();
    } catch (error) {
      setSessionState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        timeRemaining: null,
        expiresAt: null,
        sessionId: null,
      });
      throw error;
    }
  }, [updateSessionState]);

  const register = useCallback(async (email: string, password: string, name: string) => {
    setSessionState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const user = await backendAuthService.register(email, password, name);
      updateSessionState();
    } catch (error) {
      setSessionState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        timeRemaining: null,
        expiresAt: null,
        sessionId: null,
      });
      throw error;
    }
  }, [updateSessionState]);

  const logout = useCallback(async () => {
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    try {
      await backendAuthService.logout();
    } catch (error) {
    }
    
    // Reset state
    setSessionState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      timeRemaining: null,
      expiresAt: null,
      sessionId: null,
    });
  }, []);

  // Effect to manage session expiration timer
  useEffect(() => {
    if (sessionState.expiresAt && sessionState.isAuthenticated) {
      // Clear existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Setup interval to update remaining time and auto logout
      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        const remain = sessionState.expiresAt! - now;
        
        
        if (remain <= 0) {
          logout();
        } else {
          setSessionState(prev => ({ ...prev, timeRemaining: remain }));
        }
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionState.expiresAt, sessionState.isAuthenticated, logout]);

  return { ...sessionState, login, register, logout, validate };
};
