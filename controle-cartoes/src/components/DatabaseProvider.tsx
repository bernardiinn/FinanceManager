import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Pessoa, Cartao, User } from '../types';
import { unifiedDatabaseService } from '../services/unifiedDatabaseService';
import { getBrowserCapabilities } from '../utils/uuid';
import { useSession } from '../hooks/useSession';

interface DatabaseContextType {
  // Data
  pessoas: Pessoa[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  
  // Actions
  refreshData: () => Promise<void>;
  addPessoa: (pessoa: Omit<Pessoa, 'id' | 'cartoes'>) => Promise<Pessoa>;
  updatePessoa: (pessoa: Pessoa) => Promise<void>;
  deletePessoa: (id: string) => Promise<void>;
  addCartao: (pessoaId: string, cartao: Omit<Cartao, 'id'>) => Promise<Cartao>;
  updateCartao: (cartao: Cartao) => Promise<void>;
  deleteCartao: (cartaoId: string) => Promise<void>;
  getCartaoById: (cartaoId: string) => Cartao | undefined;
  markInstallmentAsPaid: (cartaoId: string, installmentNumber: number) => Promise<void>;
  markInstallmentAsUnpaid: (cartaoId: string, installmentNumber: number) => Promise<void>;
  
  // User management
  currentUser: User | null;
  allUsers: User[];
  hasMultipleUsers: boolean;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useDatabaseContext = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabaseContext must be used within DatabaseProvider');
  }
  return context;
};

interface DatabaseProviderProps {
  children: React.ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useSession();
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Initialize database and load data
  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setError(null);
      
      await unifiedDatabaseService.initialize(user?.id?.toString());
      const pessoasData = await unifiedDatabaseService.getPessoas();
      setPessoas(pessoasData);
      setInitialized(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('❌ Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Initialize user management
  const refreshUserData = useCallback(async () => {
    try {
      await unifiedDatabaseService.initialize(user?.id?.toString());
      const activeUser = await unifiedDatabaseService.getActiveUser();
      const allUserProfiles = await unifiedDatabaseService.getAllProfiles();
      
      setCurrentUser(activeUser);
      setAllUsers(allUserProfiles);
    } catch (err) {
      console.warn('Failed to load user data:', err);
    }
  }, [user?.id]);

  // Re-initialize and load data when session changes
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    // Initialize user and data
    const init = async () => {
      await refreshUserData();
      await refreshData();
    };
    init();
  }, [isLoading, isAuthenticated, user?.id, refreshData, refreshUserData]);

  // Database actions
  const addPessoa = async (pessoa: Omit<Pessoa, 'id' | 'cartoes'>): Promise<Pessoa> => {
    try {
      const newPessoa = await unifiedDatabaseService.createPessoa(pessoa);
      // Immediately add to local state for instant UI feedback
      setPessoas(prevPessoas => [...prevPessoas, newPessoa]);
      // Then refresh data to ensure consistency
      await refreshData();
      return newPessoa;
    } catch (err) {
      // If error, refresh data to restore correct state
      await refreshData();
      const message = err instanceof Error ? err.message : 'Failed to add pessoa';
      setError(message);
      throw err;
    }
  };

  const updatePessoa = async (pessoa: Pessoa): Promise<void> => {
    try {
      await unifiedDatabaseService.updatePessoa(pessoa);
      // Immediately update local state for instant UI feedback
      setPessoas(prevPessoas => 
        prevPessoas.map(p => p.id === pessoa.id ? pessoa : p)
      );
      // Then refresh data to ensure consistency
      await refreshData();
    } catch (err) {
      // If error, refresh data to restore correct state
      await refreshData();
      const message = err instanceof Error ? err.message : 'Failed to update pessoa';
      setError(message);
      throw err;
    }
  };

  const deletePessoa = async (id: string): Promise<void> => {
    try {
      await unifiedDatabaseService.deletePessoa(id);
      // Immediately remove from local state for instant UI feedback
      setPessoas(prevPessoas => prevPessoas.filter(p => p.id !== id));
      // Then refresh data to ensure consistency
      await refreshData();
    } catch (err) {
      // If error, refresh data to restore correct state
      await refreshData();
      const message = err instanceof Error ? err.message : 'Failed to delete pessoa';
      setError(message);
      throw err;
    }
  };

  const addCartao = async (pessoaId: string, cartao: Omit<Cartao, 'id'>): Promise<Cartao> => {
    try {
      const newCartao = await unifiedDatabaseService.createCartao(pessoaId, cartao) as unknown as Cartao;
      // Immediately update local state for instant UI feedback
      setPessoas(prevPessoas => 
        prevPessoas.map(p => 
          p.id === pessoaId 
            ? { ...p, cartoes: [...(p.cartoes || []), newCartao] }
            : p
        )
      );
      // Then refresh data to ensure consistency
      await refreshData();
      return newCartao;
    } catch (err) {
      // If error, refresh data to restore correct state
      await refreshData();
      const message = err instanceof Error ? err.message : 'Failed to add cartão';
      setError(message);
      throw err;
    }
  };

  const updateCartao = async (cartao: Cartao): Promise<void> => {
    try {
      await unifiedDatabaseService.updateCartao(cartao as unknown as Record<string, unknown>);
      // Immediately update local state for instant UI feedback
      setPessoas(prevPessoas => 
        prevPessoas.map(p => ({
          ...p,
          cartoes: p.cartoes?.map(c => c.id === cartao.id ? cartao : c) || []
        }))
      );
      // Then refresh data to ensure consistency
      await refreshData();
    } catch (err) {
      // If error, refresh data to restore correct state
      await refreshData();
      const message = err instanceof Error ? err.message : 'Failed to update cartão';
      setError(message);
      throw err;
    }
  };

  const deleteCartao = async (cartaoId: string): Promise<void> => {
    try {
      await unifiedDatabaseService.deleteCartao(cartaoId);
      // Immediately update local state for instant UI feedback
      setPessoas(prevPessoas => 
        prevPessoas.map(p => ({
          ...p,
          cartoes: p.cartoes?.filter(c => c.id !== cartaoId) || []
        }))
      );
      // Then refresh data to ensure consistency
      await refreshData();
    } catch (err) {
      // If error, refresh data to restore correct state
      await refreshData();
      const message = err instanceof Error ? err.message : 'Failed to delete cartão';
      setError(message);
      throw err;
    }
  };

  const getCartaoById = (cartaoId: string): Cartao | undefined => {
    // Find cartão in current data
    for (const pessoa of pessoas) {
      const cartao = pessoa.cartoes?.find(c => c.id === cartaoId);
      if (cartao) return cartao;
    }
    return undefined;
  };

  const markInstallmentAsPaid = async (cartaoId: string, installmentNumber: number): Promise<void> => {
    try {
      await unifiedDatabaseService.markInstallmentAsPaid(cartaoId, installmentNumber);
      await refreshData(); // Reload data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark installment as paid';
      setError(message);
      throw err;
    }
  };

  const markInstallmentAsUnpaid = async (cartaoId: string, installmentNumber: number): Promise<void> => {
    try {
      await unifiedDatabaseService.markInstallmentAsUnpaid(cartaoId, installmentNumber);
      await refreshData(); // Reload data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark installment as unpaid';
      setError(message);
      throw err;
    }
  };

  // Show loading screen while initializing
  if (loading && !initialized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Carregando dados...</p>
          <p className="text-sm text-gray-500 mt-2">Inicializando banco de dados...</p>
        </div>
      </div>
    );
  }

  // Show error screen if initialization failed
  if (error && !initialized) {
    const capabilities = getBrowserCapabilities();
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Erro ao inicializar banco de dados
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
            {error}
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
            <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-2">
              Diagnóstico do navegador:
            </p>
            <div className="text-xs text-left space-y-1">
              <div>WebAssembly: {capabilities.hasWebAssembly ? '✅' : '❌'}</div>
              <div>Crypto API: {capabilities.hasCrypto ? '✅' : '❌'}</div>
              <div>IndexedDB: {capabilities.hasIndexedDB ? '✅' : '❌'}</div>
              <div>Service Worker: {capabilities.hasServiceWorker ? '✅' : '❌'}</div>
            </div>
            {!capabilities.hasWebAssembly && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                ⚠️ WebAssembly não suportado - necessário para o banco de dados
              </p>
            )}
          </div>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Recarregar página
            </button>
            <button
              onClick={() => {
                // Clear any cached data and retry
                if ('caches' in window) {
                  caches.keys().then(names => names.forEach(name => caches.delete(name)));
                }
                // Clear sessionStorage only (no localStorage in new architecture)
                sessionStorage.clear();
                setTimeout(() => window.location.reload(), 500);
              }}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              Limpar cache e recarregar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const contextValue: DatabaseContextType = {
    // Data
    pessoas,
    loading,
    error,
    initialized,
    
    // Actions
    refreshData,
    addPessoa,
    updatePessoa,
    deletePessoa,
    addCartao,
    updateCartao,
    deleteCartao,
    getCartaoById,
    markInstallmentAsPaid,
    markInstallmentAsUnpaid,
    
    // User management
    currentUser,
    allUsers,
    hasMultipleUsers: allUsers.length > 1,
  };

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
};

export default DatabaseProvider;
