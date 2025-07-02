/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// Backend service with limited type information from API responses

import type {
  Pessoa,
  Cartao
} from '../types';
import { backendDataService } from './backendDataService';

/**
 * Unified Database Service - Single source of truth for all app data
 * 
 * Routes all data operations through the      throw new Error('Campo obrigatório faltando: frequencia');ackend API with proper user isolation.
 * No localStorage or local SQLite usage - fully backend-driven.
 */

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
          createdAt: pessoa.createdAt || new Date().toISOString(),
          updatedAt: pessoa.updatedAt || new Date().toISOString(),
          cartoes: cartoes.map((cartao: any) => ({
            id: cartao.id,
            descricao: cartao.descricao,
            valor_total: cartao.valor_total,
            numero_de_parcelas: cartao.numero_de_parcelas || cartao.parcelas_totais,
            parcelas_pagas: cartao.parcelas_pagas,
            observacoes: cartao.observacoes,
            pessoa_id: cartao.pessoa_id,
            installments: cartao.installments || [],
            dueDay: cartao.dueDay || 1,
            currency: cartao.currency || 'BRL',
            status: cartao.status || 'active',
            createdAt: cartao.createdAt || new Date().toISOString(),
            updatedAt: cartao.updatedAt || new Date().toISOString(),
          } as Cartao)),
        } as Pessoa;
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
      createdAt: backendPessoa.createdAt || new Date().toISOString(),
      updatedAt: backendPessoa.updatedAt || new Date().toISOString(),
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
      createdAt: backendPessoa.createdAt || new Date().toISOString(),
      updatedAt: backendPessoa.updatedAt || new Date().toISOString(),
      cartoes: cartoes.map((cartao: any) => ({
        id: cartao.id,
        descricao: cartao.descricao,
        valor_total: cartao.valor_total,
        numero_de_parcelas: cartao.numero_de_parcelas || cartao.parcelas_totais,
        parcelas_pagas: cartao.parcelas_pagas,
        observacoes: cartao.observacoes,
        pessoa_id: cartao.pessoa_id,
        installments: cartao.installments || [],
        dueDay: cartao.dueDay || 1,
        currency: cartao.currency || 'BRL',
        status: cartao.status || 'active',
        createdAt: cartao.createdAt || new Date().toISOString(),
        updatedAt: cartao.updatedAt || new Date().toISOString(),
      } as Cartao)),
    } as Pessoa;
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
      valor_total: cartao.valor_total || cartao.valorTotal,
      numero_de_parcelas: cartao.numero_de_parcelas || cartao.parcelasTotais,
      parcelas_pagas: cartao.parcelas_pagas || cartao.parcelasPagas || 0,
      data_compra: cartao.data_compra || cartao.dataVencimento,
      observacoes: cartao.observacoes,
      categoria: cartao.categoria || cartao.tipoCartao || 'credito',
    } as any);
    
    // Transform back to frontend format with type assertion
    return {
      id: backendCartao.id,
      descricao: backendCartao.descricao,
      valor_total: (backendCartao as any).valor_total,
      numero_de_parcelas: (backendCartao as any).numero_de_parcelas,
      parcelas_pagas: (backendCartao as any).parcelas_pagas,
      observacoes: (backendCartao as any).observacoes,
      pessoa_id: (backendCartao as any).pessoa_id,
      installments: [],
      dueDay: 1,
      currency: 'BRL',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;
  }

  async updateCartao(cartao: any): Promise<void> {
    await this.ensureInitialized();
    
    // Transform to backend format with flexible typing
    await backendDataService.updateCartao({
      id: cartao.id,
      descricao: cartao.descricao,
      valor_total: cartao.valor_total || cartao.valorTotal,
      numero_de_parcelas: cartao.numero_de_parcelas || cartao.parcelasTotais,
      parcelas_pagas: cartao.parcelas_pagas || cartao.parcelasPagas,
      data_compra: cartao.data_compra || cartao.dataVencimento,
      observacoes: cartao.observacoes,
      categoria: cartao.categoria || cartao.tipoCartao,
    } as any);
  }

  async deleteCartao(cartaoId: string): Promise<void> {
    await this.ensureInitialized();
    await backendDataService.deleteCartao(cartaoId);
  }

  async getCartaoById(cartaoId: string): Promise<any> {
    await this.ensureInitialized();
    
    const backendCartao = await backendDataService.getCartaoById(cartaoId);
    
    // Transform to frontend format with type assertion
    return {
      id: backendCartao.id,
      descricao: backendCartao.descricao,
      valor_total: (backendCartao as any).valor_total,
      numero_de_parcelas: (backendCartao as any).numero_de_parcelas,
      parcelas_pagas: (backendCartao as any).parcelas_pagas,
      observacoes: (backendCartao as any).observacoes,
      pessoa_id: (backendCartao as any).pessoa_id,
      installments: [],
      dueDay: 1,
      currency: 'BRL',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;
  }

  async markInstallmentAsPaid(cartaoId: string, installmentNumber: number): Promise<void> {
    await this.ensureInitialized();
    await backendDataService.markInstallmentAsPaid(cartaoId, installmentNumber);
  }

  async markInstallmentAsUnpaid(cartaoId: string, installmentNumber: number): Promise<void> {
    await this.ensureInitialized();
    await backendDataService.markInstallmentAsUnpaid(cartaoId, installmentNumber);
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
      metodoPagamento: gasto.metodoPagamento || gasto.metodo_pagamento,
      observacoes: gasto.observacoes,
      recorrenteId: gasto.recorrenteId || gasto.recorrente_id,
      createdAt: gasto.createdAt || new Date().toISOString(),
      updatedAt: gasto.updatedAt || new Date().toISOString(),
    }));
  }

  async createGasto(gasto: any): Promise<any> {
    await this.ensureInitialized();
    const backendGasto = await backendDataService.createGasto({
      descricao: gasto.descricao,
      valor: gasto.valor,
      data: gasto.data,
      categoria: gasto.categoria,
      // Defensive: support both camelCase and snake_case, and throw if missing
      metodo_pagamento: gasto.metodo_pagamento || gasto.metodoPagamento,
      observacoes: gasto.observacoes,
      recorrente_id: gasto.recorrente_id || gasto.recorrenteId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);
    // Defensive: throw if required fields are missing (check input, not backendGasto)
    if (!gasto.descricao || !gasto.valor || !gasto.data || !gasto.categoria || !(gasto.metodo_pagamento || gasto.metodoPagamento)) {
      throw new Error('ID, descricao, valor, data, categoria, and metodo_pagamento are required');
    }
    
    // Transform back to frontend format
    return {
      id: backendGasto.id,
      descricao: backendGasto.descricao,
      valor: backendGasto.valor,
      data: backendGasto.data,
      categoria: backendGasto.categoria,
      metodoPagamento: (backendGasto as any).metodoPagamento || (backendGasto as any).metodo_pagamento,
      observacoes: backendGasto.observacoes,
      recorrenteId: (backendGasto as any).recorrenteId || (backendGasto as any).recorrente_id,
      createdAt: backendGasto.createdAt || new Date().toISOString(),
      updatedAt: backendGasto.updatedAt || new Date().toISOString(),
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
      createdAt: gasto.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);
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
        metodoPagamento: (backendGasto as any).metodoPagamento || (backendGasto as any).metodo_pagamento,
        observacoes: backendGasto.observacoes,
        recorrenteId: (backendGasto as any).recorrenteId || (backendGasto as any).recorrente_id,
        createdAt: backendGasto.createdAt || new Date().toISOString(),
        updatedAt: backendGasto.updatedAt || new Date().toISOString(),
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
      metodoPagamento: (recorrencia as any).metodo_pagamento || recorrencia.metodoPagamento,
      frequencia: recorrencia.frequencia,
      dataInicio: (recorrencia as any).data_inicio || recorrencia.dataInicio,
      ultimaExecucao: (recorrencia as any).ultima_execucao || recorrencia.ultimaExecucao,
      ativo: Boolean(recorrencia.ativo),
      createdAt: recorrencia.createdAt || new Date().toISOString(),
      updatedAt: recorrencia.updatedAt || new Date().toISOString(),
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);
    
    // Transform back to frontend format
    return {
      id: backendRecorrencia.id,
      descricao: backendRecorrencia.descricao,
      valor: backendRecorrencia.valor,
      categoria: backendRecorrencia.categoria,
      metodoPagamento: (backendRecorrencia as any).metodo_pagamento || backendRecorrencia.metodoPagamento,
      frequencia: backendRecorrencia.frequencia,
      dataInicio: (backendRecorrencia as any).data_inicio || backendRecorrencia.dataInicio,
      ultimaExecucao: (backendRecorrencia as any).ultima_execucao || backendRecorrencia.ultimaExecucao,
      ativo: Boolean(backendRecorrencia.ativo),
      createdAt: backendRecorrencia.createdAt || new Date().toISOString(),
      updatedAt: backendRecorrencia.updatedAt || new Date().toISOString(),
    } as any;
  }

  async updateRecorrencia(recorrencia: any): Promise<void> {
    await this.ensureInitialized();
    const frequencia = recorrencia.frequencia || recorrencia.frequency;
    if (!frequencia) {
      console.error('[updateRecorrencia] Missing required field: frequencia', recorrencia);
      throw new Error('Campo obrigat3rio faltando: frequencia');
    }
    const payload = {
      id: recorrencia.id,
      descricao: recorrencia.descricao,
      valor: recorrencia.valor,
      categoria: recorrencia.categoria,
      metodo_pagamento: recorrencia.metodo_pagamento || recorrencia.metodoPagamento,
      frequencia,
      data_inicio: recorrencia.data_inicio || recorrencia.dataInicio,
      ultima_execucao: recorrencia.ultima_execucao || recorrencia.ultimaExecucao || null,
      ativo: typeof recorrencia.ativo === 'boolean' ? recorrencia.ativo : Boolean(recorrencia.ativo),
      observacoes: recorrencia.observacoes,
      createdAt: recorrencia.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;
    
    await backendDataService.updateRecorrencia(payload);
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
        metodoPagamento: (backendRecorrencia as any).metodo_pagamento || backendRecorrencia.metodoPagamento,
        frequencia: backendRecorrencia.frequencia,
        dataInicio: (backendRecorrencia as any).data_inicio || backendRecorrencia.dataInicio,
        ultimaExecucao: (backendRecorrencia as any).ultima_execucao || backendRecorrencia.ultimaExecucao,
        ativo: Boolean(backendRecorrencia.ativo),
        createdAt: backendRecorrencia.createdAt || new Date().toISOString(),
        updatedAt: backendRecorrencia.updatedAt || new Date().toISOString(),
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

  async saveSettings(_settings: AppSettings): Promise<void> {
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

  async createUser(_data: { name: string; email?: string }): Promise<UserProfile> {
    await this.ensureInitialized();
    
    // User creation is handled by the backend registration system
    // This method is kept for compatibility but shouldn't be used
    throw new Error('User creation is handled by the authentication system');
  }

  async switchUser(_userId: string): Promise<UserProfile | null> {
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

  async importDatabase(_data: Uint8Array): Promise<void> {
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
