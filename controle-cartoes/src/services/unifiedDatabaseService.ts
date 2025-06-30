/**
 * Unified Database Service - Single source of truth for all app data
 * 
 * Routes all data operations through the backend API with proper user isolation.
 * No localStorage or local SQLite usage - fully backend-driven.
 */

import { backendDataService } from './backendDataService';
import type { Pessoa, Gasto, Recorrencia } from '../types';

interface AppSettings {
  currency: string;
  dateFormat: string;
  notifications: boolean;
  passcodeEnabled: boolean;
  backupReminder: boolean;
}

interface ThemeSettings {
  mode: 'light' | 'dark';
  accentColor: string;
}

interface UserProfile {
  id: string;
  name: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  lastActive: string;
}

class UnifiedDatabaseService {
  private initialized = false;
  private currentUserId: string | null = null;

  /**
   * Initialize the service for the current user
   */
  async initialize(userId?: string): Promise<void> {
    if (this.initialized && (!userId || userId === this.currentUserId)) {
      return;
    }

    try {
      // Simply track the current user - all data flows through backend API
      this.currentUserId = userId || 'default';
      this.initialized = true;
      
    } catch (error) {
      console.error('❌ Failed to initialize unified database service:', error);
      throw error;
    }
  }

  // === PESSOAS ===
  async getPessoas(): Promise<Pessoa[]> {
    await this.ensureInitialized();
    
    // Get data from backend and transform to frontend format
    const pessoasFromBackend = await backendDataService.getPessoas();
    
    // For each pessoa, get their cartões
    const pessoasWithCartoes = await Promise.all(
      pessoasFromBackend.map(async (pessoa: any) => {
        const cartoes = await backendDataService.getCartoesByPessoa(pessoa.id);
        return {
          id: pessoa.id,
          nome: pessoa.nome,
          telefone: pessoa.telefone,
          observacoes: pessoa.observacoes,
          cartoes: cartoes.map((cartao: any) => ({
            id: cartao.id,
            pessoaId: cartao.pessoa_id,
            descricao: cartao.descricao,
            // New format
            valorTotal: cartao.valor_total,
            parcelasTotais: cartao.parcelas_totais,
            parcelasPagas: cartao.parcelas_pagas,
            valorPago: cartao.valor_pago,
            dataVencimento: cartao.data_vencimento,
            observacoes: cartao.observacoes,
            tipoCartao: cartao.tipo_cartao,
            // Legacy format for backward compatibility
            valor_total: cartao.valor_total,
            numero_de_parcelas: cartao.parcelas_totais,
            parcelas_pagas: cartao.parcelas_pagas,
            data_vencimento: cartao.data_vencimento,
            tipo_cartao: cartao.tipo_cartao || 'credito',
            pessoa_id: cartao.pessoa_id,
          })),
        };
      })
    );
    
    return pessoasWithCartoes;
  }

  async createPessoa(pessoa: Omit<Pessoa, 'id' | 'cartoes'>): Promise<Pessoa> {
    await this.ensureInitialized();
    
    const backendPessoa = await backendDataService.createPessoa(pessoa);
    
    return {
      id: backendPessoa.id,
      nome: backendPessoa.nome,
      telefone: backendPessoa.telefone,
      observacoes: backendPessoa.observacoes,
      cartoes: [],
    };
  }

  async updatePessoa(pessoa: Pessoa): Promise<void> {
    await this.ensureInitialized();
    await backendDataService.updatePessoa(pessoa);
  }

  async deletePessoa(id: string): Promise<void> {
    await this.ensureInitialized();
    await backendDataService.deletePessoa(id);
  }

  async getPessoaById(id: string): Promise<Pessoa> {
    await this.ensureInitialized();
    
    const backendPessoa = await backendDataService.getPessoaById(id);
    const cartoes = await backendDataService.getCartoesByPessoa(id);
    
    return {
      id: backendPessoa.id,
      nome: backendPessoa.nome,
      telefone: backendPessoa.telefone,
      observacoes: backendPessoa.observacoes,
      cartoes: cartoes.map((cartao: any) => ({
        id: cartao.id,
        pessoaId: cartao.pessoa_id,
        descricao: cartao.descricao,
        // New format
        valorTotal: cartao.valor_total,
        parcelasTotais: cartao.parcelas_totais,
        parcelasPagas: cartao.parcelas_pagas,
        valorPago: cartao.valor_pago,
        dataVencimento: cartao.data_vencimento,
        observacoes: cartao.observacoes,
        tipoCartao: cartao.tipo_cartao,
        // Legacy format for backward compatibility
        valor_total: cartao.valor_total,
        numero_de_parcelas: cartao.parcelas_totais,
        parcelas_pagas: cartao.parcelas_pagas,
        data_vencimento: cartao.data_vencimento,
        tipo_cartao: cartao.tipo_cartao || 'credito',
        pessoa_id: cartao.pessoa_id,
      })),
    };
  }

  // === CARTÕES ===
  async createCartao(pessoaId: string, cartao: any): Promise<any> {
    await this.ensureInitialized();
    
    if (!cartao) {
      throw new Error('Cartao data is required');
    }
    
    if (!cartao.descricao) {
      throw new Error('Cartao description (descricao) is required');
    }
    
    const backendCartao = await backendDataService.createCartao(pessoaId, {
      descricao: cartao.descricao,
      valorTotal: cartao.valorTotal,
      parcelasTotais: cartao.parcelasTotais,
      parcelasPagas: cartao.parcelasPagas || 0,
      valorPago: cartao.valorPago || 0,
      dataVencimento: cartao.dataVencimento,
      observacoes: cartao.observacoes,
      tipoCartao: cartao.tipoCartao || 'credito',
    });
    
    // Transform back to frontend format
    return {
      id: backendCartao.id,
      pessoaId: backendCartao.pessoa_id,
      descricao: backendCartao.descricao,
      // New format
      valorTotal: backendCartao.valor_total,
      parcelasTotais: backendCartao.parcelas_totais,
      parcelasPagas: backendCartao.parcelas_pagas,
      valorPago: backendCartao.valor_pago,
      dataVencimento: backendCartao.data_vencimento,
      observacoes: backendCartao.observacoes,
      tipoCartao: backendCartao.tipo_cartao,
      // Legacy format for backward compatibility
      valor_total: backendCartao.valor_total,
      numero_de_parcelas: backendCartao.parcelas_totais,
      parcelas_pagas: backendCartao.parcelas_pagas,
      data_vencimento: backendCartao.data_vencimento,
      tipo_cartao: backendCartao.tipo_cartao || 'credito',
      pessoa_id: backendCartao.pessoa_id,
    };
  }

  async updateCartao(cartao: any): Promise<void> {
    await this.ensureInitialized();
    
    // Transform to backend format
    await backendDataService.updateCartao({
      id: cartao.id,
      descricao: cartao.descricao,
      valorTotal: cartao.valorTotal,
      parcelasTotais: cartao.parcelasTotais,
      parcelasPagas: cartao.parcelasPagas,
      valorPago: cartao.valorPago,
      dataVencimento: cartao.dataVencimento,
      observacoes: cartao.observacoes,
      tipoCartao: cartao.tipoCartao,
    });
  }

  async deleteCartao(cartaoId: string): Promise<void> {
    await this.ensureInitialized();
    await backendDataService.deleteCartao(cartaoId);
  }

  async getCartaoById(cartaoId: string): Promise<any> {
    await this.ensureInitialized();
    
    const backendCartao = await backendDataService.getCartaoById(cartaoId);
    
    // Transform to frontend format
    return {
      id: backendCartao.id,
      pessoaId: backendCartao.pessoa_id,
      descricao: backendCartao.descricao,
      // New format
      valorTotal: backendCartao.valor_total,
      parcelasTotais: backendCartao.parcelas_totais,
      parcelasPagas: backendCartao.parcelas_pagas,
      valorPago: backendCartao.valor_pago,
      dataVencimento: backendCartao.data_vencimento,
      observacoes: backendCartao.observacoes,
      tipoCartao: backendCartao.tipo_cartao,
      // Legacy format for backward compatibility
      valor_total: backendCartao.valor_total,
      numero_de_parcelas: backendCartao.parcelas_totais,
      parcelas_pagas: backendCartao.parcelas_pagas,
      data_vencimento: backendCartao.data_vencimento,
      tipo_cartao: backendCartao.tipo_cartao || 'credito',
      pessoa_id: backendCartao.pessoa_id,
    };
  }

  async markInstallmentAsPaid(cartaoId: string, installmentNumber: number): Promise<void> {
    await this.ensureInitialized();
    await backendDataService.markInstallmentAsPaid(cartaoId, installmentNumber);
  }

  // === GASTOS ===
  async getGastos(): Promise<any[]> {
    await this.ensureInitialized();
    
    const backendGastos = await backendDataService.getGastos();
    
    // Transform to frontend format
    return backendGastos.map((gasto: any) => ({
      id: gasto.id,
      descricao: gasto.descricao,
      valor: gasto.valor,
      data: gasto.data,
      categoria: gasto.categoria,
      metodoPagamento: gasto.metodo_pagamento,
      observacoes: gasto.observacoes,
      recorrenteId: gasto.recorrente_id,
    }));
  }

  async createGasto(gasto: any): Promise<any> {
    await this.ensureInitialized();
    
    const backendGasto = await backendDataService.createGasto({
      descricao: gasto.descricao,
      valor: gasto.valor,
      data: gasto.data,
      categoria: gasto.categoria,
      metodoPagamento: gasto.metodoPagamento,
      observacoes: gasto.observacoes,
      recorrenteId: gasto.recorrenteId,
    });
    
    // Transform back to frontend format
    return {
      id: backendGasto.id,
      descricao: backendGasto.descricao,
      valor: backendGasto.valor,
      data: backendGasto.data,
      categoria: backendGasto.categoria,
      metodoPagamento: backendGasto.metodo_pagamento,
      observacoes: backendGasto.observacoes,
      recorrenteId: backendGasto.recorrente_id,
    };
  }

  async updateGasto(gasto: any): Promise<void> {
    await this.ensureInitialized();
    
    await backendDataService.updateGasto({
      id: gasto.id,
      descricao: gasto.descricao,
      valor: gasto.valor,
      data: gasto.data,
      categoria: gasto.categoria,
      metodoPagamento: gasto.metodoPagamento,
      observacoes: gasto.observacoes,
      recorrenteId: gasto.recorrenteId,
    });
  }

  async deleteGasto(id: string): Promise<void> {
    await this.ensureInitialized();
    await backendDataService.deleteGasto(id);
  }

  async getGastoById(id: string): Promise<any | null> {
    await this.ensureInitialized();
    
    try {
      const backendGasto = await backendDataService.getGastoById(id);
      
      // Transform to frontend format
      return {
        id: backendGasto.id,
        descricao: backendGasto.descricao,
        valor: backendGasto.valor,
        data: backendGasto.data,
        categoria: backendGasto.categoria,
        metodoPagamento: backendGasto.metodo_pagamento,
        observacoes: backendGasto.observacoes,
        recorrenteId: backendGasto.recorrente_id,
      };
    } catch (error) {
      return null;
    }
  }

  // === RECORRÊNCIAS ===
  async getRecorrencias(): Promise<any[]> {
    await this.ensureInitialized();
    
    const backendRecorrencias = await backendDataService.getRecorrencias();
    
    // Transform to frontend format
    return backendRecorrencias.map((recorrencia: any) => ({
      id: recorrencia.id,
      descricao: recorrencia.descricao,
      valor: recorrencia.valor,
      categoria: recorrencia.categoria,
      metodoPagamento: recorrencia.metodo_pagamento,
      frequencia: recorrencia.frequencia,
      dataInicio: recorrencia.data_inicio,
      ultimaExecucao: recorrencia.ultima_execucao,
      ativo: Boolean(recorrencia.ativo),
      observacoes: recorrencia.observacoes,
    }));
  }

  async createRecorrencia(recorrencia: any): Promise<any> {
    await this.ensureInitialized();
    
    const backendRecorrencia = await backendDataService.createRecorrencia({
      descricao: recorrencia.descricao,
      valor: recorrencia.valor,
      categoria: recorrencia.categoria,
      metodoPagamento: recorrencia.metodoPagamento,
      frequencia: recorrencia.frequencia,
      dataInicio: recorrencia.dataInicio,
      ativo: recorrencia.ativo,
      observacoes: recorrencia.observacoes,
    });
    
    // Transform back to frontend format
    return {
      id: backendRecorrencia.id,
      descricao: backendRecorrencia.descricao,
      valor: backendRecorrencia.valor,
      categoria: backendRecorrencia.categoria,
      metodoPagamento: backendRecorrencia.metodo_pagamento,
      frequencia: backendRecorrencia.frequencia,
      dataInicio: backendRecorrencia.data_inicio,
      ultimaExecucao: backendRecorrencia.ultima_execucao,
      ativo: Boolean(backendRecorrencia.ativo),
      observacoes: backendRecorrencia.observacoes,
    };
  }

  async updateRecorrencia(recorrencia: any): Promise<void> {
    await this.ensureInitialized();
    
    await backendDataService.updateRecorrencia({
      id: recorrencia.id,
      descricao: recorrencia.descricao,
      valor: recorrencia.valor,
      categoria: recorrencia.categoria,
      metodoPagamento: recorrencia.metodoPagamento,
      frequencia: recorrencia.frequencia,
      dataInicio: recorrencia.dataInicio,
      ativo: recorrencia.ativo,
      observacoes: recorrencia.observacoes,
    });
  }

  async deleteRecorrencia(id: string): Promise<void> {
    await this.ensureInitialized();
    await backendDataService.deleteRecorrencia(id);
  }

  async getRecorrenciaById(id: string): Promise<any | null> {
    await this.ensureInitialized();
    
    try {
      const backendRecorrencia = await backendDataService.getRecorrenciaById(id);
      
      // Transform to frontend format
      return {
        id: backendRecorrencia.id,
        descricao: backendRecorrencia.descricao,
        valor: backendRecorrencia.valor,
        categoria: backendRecorrencia.categoria,
        metodoPagamento: backendRecorrencia.metodo_pagamento,
        frequencia: backendRecorrencia.frequencia,
        dataInicio: backendRecorrencia.data_inicio,
        ultimaExecucao: backendRecorrencia.ultima_execucao,
        ativo: Boolean(backendRecorrencia.ativo),
        observacoes: backendRecorrencia.observacoes,
      };
    } catch (error) {
      return null;
    }
  }

  // === SETTINGS ===
  async getSettings(): Promise<AppSettings> {
    await this.ensureInitialized();
    
    // Settings are managed on backend - no longer uses local database
    // Return sensible defaults since settings API is not currently implemented
    return {
      currency: 'BRL',
      dateFormat: 'DD/MM/YYYY',
      notifications: true,
      passcodeEnabled: false,
      backupReminder: true,
    };
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await this.ensureInitialized();
    // TODO: Implement settings API on backend when needed
    // For now, settings are not persisted across sessions
  }

  async getTheme(): Promise<ThemeSettings> {
    await this.ensureInitialized();
    
    // Theme settings use sessionStorage for UI state only
    try {
      const savedTheme = sessionStorage.getItem('app_theme');
      if (savedTheme) {
        return JSON.parse(savedTheme);
      }
    } catch (error) {
      // Ignore errors
    }
    
    return {
      mode: 'light',
      accentColor: '#007bff',
    };
  }

  async saveTheme(theme: ThemeSettings): Promise<void> {
    await this.ensureInitialized();
    
    // Store theme in sessionStorage for UI state
    try {
      sessionStorage.setItem('app_theme', JSON.stringify(theme));
    } catch (error) {
      // Ignore errors
    }
  }

  // === USER PROFILES ===
  async getAllProfiles(): Promise<UserProfile[]> {
    await this.ensureInitialized();
    
    // User profiles are managed by the backend authentication system
    // For now, return the current user only
    if (this.currentUserId) {
      return [{
        id: this.currentUserId,
        name: 'Current User',
        email: '',
        isActive: true,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      }];
    }
    
    return [];
  }

  async getActiveUser(): Promise<UserProfile | null> {
    await this.ensureInitialized();
    
    // Active user is tracked by the backend authentication
    if (this.currentUserId) {
      return {
        id: this.currentUserId,
        name: 'Current User',
        email: '',
        isActive: true,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };
    }
    
    return null;
  }

  async createUser(data: { name: string; email?: string }): Promise<UserProfile> {
    await this.ensureInitialized();
    
    // User creation is handled by the backend registration system
    // This method is kept for compatibility but shouldn't be used
    throw new Error('User creation is handled by the authentication system');
  }

  async switchUser(userId: string): Promise<UserProfile | null> {
    await this.ensureInitialized();
    
    // User switching is handled by the backend authentication system
    // This method is kept for compatibility but shouldn't be used
    throw new Error('User switching is handled by the authentication system');
  }

  // === UTILITY ===
  async getDatabaseInfo(): Promise<any> {
    await this.ensureInitialized();
    
    // Database info is not needed for backend-driven architecture
    return {
      type: 'Backend SQLite',
      location: 'Remote Server',
      size: 'N/A',
      version: '1.0',
    };
  }

  async exportDatabase(): Promise<Uint8Array> {
    await this.ensureInitialized();
    
    // Export functionality would need to be implemented on the backend
    throw new Error('Database export not implemented for backend architecture');
  }

  async importDatabase(data: Uint8Array): Promise<void> {
    await this.ensureInitialized();
    
    // Import functionality would need to be implemented on the backend
    throw new Error('Database import not implemented for backend architecture');
  }

  /**
   * @deprecated No longer needed - app is fully backend-backed
   */
  async clearLegacyStorage(): Promise<void> {
    // No-op - legacy storage cleanup is handled by backendAuthService
  }

  /**
   * Ensure database is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

// Export singleton instance
export const unifiedDatabaseService = new UnifiedDatabaseService();
export default unifiedDatabaseService;
