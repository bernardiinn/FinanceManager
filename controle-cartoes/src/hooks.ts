/**
 * Database-first Custom Hooks
 * 
 * Replaces localStorage-dependent hooks with database-backed implementations
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { unifiedDatabaseService } from './services/unifiedDatabaseService';
import { useDatabaseContext } from './components/DatabaseProvider';

// Database-backed app data hook
export const useAppData = () => {
  const context = useDatabaseContext();
  
  return {
    pessoas: context.pessoas,
    loading: context.loading,
    error: context.error,
    initialized: context.initialized,
    
    // CRUD operations
    addPessoa: context.addPessoa,
    updatePessoa: context.updatePessoa,
    deletePessoa: context.deletePessoa,
    addCartao: context.addCartao,
    updateCartao: context.updateCartao,
    deleteCartao: context.deleteCartao,
    getCartaoById: context.getCartaoById,
    markInstallmentAsPaid: context.markInstallmentAsPaid,
    
    // Legacy compatibility
    reloadFromStorage: context.refreshData,
    setPessoas: () => {
      // Deprecated - use database operations instead
    },
    refreshData: context.refreshData,
    
    // User management
    currentUser: context.currentUser,
    allUsers: context.allUsers,
    hasMultipleUsers: context.hasMultipleUsers,
  };
};

// Payment tracking hook for managing installments
export const usePaymentTracking = () => {
  const { markInstallmentAsPaid: dbMarkAsPaid, refreshData } = useAppData();
  
  const markInstallmentAsPaid = async (cartaoId: string, installmentNumber: number) => {
    await dbMarkAsPaid(cartaoId, installmentNumber);
    await refreshData();
  };
  
  const markInstallmentAsUnpaid = async (_cartaoId: string, _installmentNumber: number) => {
    console.warn('markInstallmentAsUnpaid not yet implemented');
  };
  
  const getNextInstallment = (cartao: any) => {
    if (!cartao.installments) return null;
    return cartao.installments.find((inst: any) => !inst.paid);
  };
  
  const getOverdueInstallmentsCount = (cartao: any) => {
    if (!cartao.installments) return 0;
    const today = new Date();
    return cartao.installments.filter((inst: any) => 
      !inst.paid && new Date(inst.dueDate) < today
    ).length;
  };
  
  const getPaymentHistory = (cartao: any) => {
    if (!cartao.installments) return [];
    return cartao.installments.filter((inst: any) => inst.paid);
  };
  
  return {
    markInstallmentAsPaid,
    markInstallmentAsUnpaid,
    getNextInstallment,
    getOverdueInstallmentsCount,
    getPaymentHistory,
  };
};

// Financial summary hook for analytics
export const useFinancialSummary = () => {
  const { pessoas } = useAppData();
  
  return useMemo(() => {
    if (!pessoas) {
      return {
        totalDebt: 0,
        totalPaid: 0,
        totalRemaining: 0,
        activeLoans: 0,
        completedLoans: 0,
        overdueLoans: 0,
        averageInstallment: 0,
        monthlyPayments: [],
      };
    }
    
    let totalDebt = 0;
    let totalPaid = 0;
    let activeLoans = 0;
    let completedLoans = 0;
    let overdueLoans = 0;
    const today = new Date();
    
    pessoas.forEach(pessoa => {
      if (pessoa.cartoes) {
        pessoa.cartoes.forEach(cartao => {
          if (cartao.installments) {
            const totalAmount = cartao.installments.reduce((sum: number, inst: any) => sum + inst.amount, 0);
            const paidAmount = cartao.installments
              .filter((inst: any) => inst.paid)
              .reduce((sum: number, inst: any) => sum + inst.amount, 0);
            
            totalDebt += totalAmount;
            totalPaid += paidAmount;
            
            const isPaid = cartao.installments.every((inst: any) => inst.paid);
            const hasOverdue = cartao.installments.some((inst: any) => 
              !inst.paid && new Date(inst.dueDate) < today
            );
            
            if (isPaid) {
              completedLoans++;
            } else {
              activeLoans++;
              if (hasOverdue) {
                overdueLoans++;
              }
            }
          }
        });
      }
    });
    
    const totalRemaining = totalDebt - totalPaid;
    const averageInstallment = activeLoans > 0 ? totalRemaining / activeLoans : 0;
    
    return {
      totalDebt,
      totalPaid,
      totalRemaining,
      activeLoans,
      completedLoans,
      overdueLoans,
      averageInstallment,
    };
  }, [pessoas]);
};

// Theme hook - DB-backed with session storage fallback for immediate UI updates
export const useTheme = () => {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    
    // Check sessionStorage for immediate UI consistency
    const savedInSession = sessionStorage.getItem('theme');
    if (savedInSession === 'light' || savedInSession === 'dark') return savedInSession;
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    // Store in sessionStorage for immediate UI consistency across tabs
    sessionStorage.setItem('theme', mode);
    
    // TODO: Save to database via API for persistence across sessions
    // This would be done through a user preferences endpoint
    
    // Apply theme to document
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(mode);
    
    // Ensure dark class is properly toggled for Tailwind
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [mode]);

  const toggleTheme = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const theme = useMemo(() => ({
    mode,
    isDark: mode === 'dark',
    isLight: mode === 'light',
  }), [mode]);

  return { theme, toggleTheme };
};

// Media query hook for responsive design
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

// Database-backed settings hook
export const useSettings = () => {
  const [settings, setSettings] = useState({
    currency: 'BRL',
    dateFormat: 'DD/MM/YYYY',
    notifications: true,
    passcodeEnabled: false,
    backupReminder: true,
  });
  
  const [loading, setLoading] = useState(true);

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const dbSettings = await unifiedDatabaseService.getSettings();
        setSettings(dbSettings);
      } catch (error) {
        console.warn('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = async (newSettings: any) => {
    try {
      await unifiedDatabaseService.saveSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  };

  const updateSetting = async (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    await updateSettings(newSettings);
  };

  return {
    settings,
    updateSettings,
    updateSetting,
    loading
  };
};

// Database-backed backup hook
export const useBackup = () => {
  const exportData = async () => {
    try {
      const data = {
        pessoas: await unifiedDatabaseService.getPessoas(),
        gastos: await unifiedDatabaseService.getGastos(),
        recorrencias: await unifiedDatabaseService.getRecorrencias(),
        settings: await unifiedDatabaseService.getSettings(),
        exportDate: new Date().toISOString(),
        version: '2.0'
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `controle-cartoes-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Save last backup timestamp to database
      // TODO: Save backup timestamp via API to user preferences
      
      return true;
    } catch (error) {
      console.error('Export failed:', error);
      return false;
    }
  };

  const importData = async (data: any) => {
    try {
      // Validate data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format');
      }

      // Import pessoas
      if (data.pessoas && Array.isArray(data.pessoas)) {
        for (const pessoa of data.pessoas) {
          try {
            await unifiedDatabaseService.createPessoa(pessoa);
          } catch (error) {
            console.warn('Failed to import pessoa:', pessoa.nome, error);
          }
        }
      }

      // Import gastos
      if (data.gastos && Array.isArray(data.gastos)) {
        for (const gasto of data.gastos) {
          try {
            await unifiedDatabaseService.createGasto(gasto);
          } catch (error) {
            console.warn('Failed to import gasto:', gasto.descricao, error);
          }
        }
      }

      // Import recorrencias
      if (data.recorrencias && Array.isArray(data.recorrencias)) {
        for (const recorrencia of data.recorrencias) {
          try {
            await unifiedDatabaseService.createRecorrencia(recorrencia);
          } catch (error) {
            console.warn('Failed to import recorrencia:', recorrencia.nome, error);
          }
        }
      }

      // Import settings
      if (data.settings) {
        await unifiedDatabaseService.saveSettings(data.settings);
      }

      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  };

  const clearAllData = async () => {
    try {
      // Clear database data
      const pessoas = await unifiedDatabaseService.getPessoas();
      for (const pessoa of pessoas) {
        await unifiedDatabaseService.deletePessoa(pessoa.id);
      }

      const gastos = await unifiedDatabaseService.getGastos();
      for (const gasto of gastos) {
        await unifiedDatabaseService.deleteGasto(gasto.id);
      }

      const recorrencias = await unifiedDatabaseService.getRecorrencias();
      for (const recorrencia of recorrencias) {
        await unifiedDatabaseService.deleteRecorrencia(recorrencia.id);
      }

      // No localStorage cleanup needed - app is fully DB-backed
      
      return true;
    } catch (error) {
      console.error('Clear data failed:', error);
      return false;
    }
  };

  return {
    exportData,
    importData,
    clearAllData
  };
};

// Debounce hook (utility)
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Previous hook (utility)
export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

// Search/filter hook
export const useSearch = <T>(items: T[], searchKey: keyof T | ((item: T) => string)) => {
  const [query, setQuery] = useState('');
  
  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    
    const searchLower = query.toLowerCase();
    
    return items.filter(item => {
      const searchValue = typeof searchKey === 'function' 
        ? searchKey(item) 
        : String(item[searchKey]);
        
      return searchValue.toLowerCase().includes(searchLower);
    });
  }, [items, query, searchKey]);

  return {
    query,
    setQuery,
    filteredItems
  };
};

// Pagination hook
export const usePagination = <T>(items: T[], itemsPerPage: number = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  }, [items, currentPage, itemsPerPage]);
  
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);
  
  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
};

// Form validation hook
export const useFormValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationRules: Record<keyof T, (value: any) => string | null>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<keyof T, string | null>>({} as Record<keyof T, string | null>);
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);

  const validate = useCallback((fieldName?: keyof T) => {
    const fieldsToValidate = fieldName ? [fieldName] : Object.keys(validationRules) as (keyof T)[];
    const newErrors = { ...errors };

    fieldsToValidate.forEach(field => {
      const rule = validationRules[field];
      if (rule) {
        newErrors[field] = rule(values[field]);
      }
    });

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== null);
  }, [values, errors, validationRules]);

  const setValue = (field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const setError = (field: keyof T, error: string | null) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({} as Record<keyof T, string | null>);
    setTouched({} as Record<keyof T, boolean>);
  };

  return {
    values,
    errors,
    touched,
    setValue,
    setError,
    validate,
    reset,
    isValid: !Object.values(errors).some(error => error !== null)
  };
};
