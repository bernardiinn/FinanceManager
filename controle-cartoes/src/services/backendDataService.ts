/**
 * Backend Data Service
 * Handles all data operations wit  async getAllPessoas(): Promise<Pessoa[]> {
    const response = await this.request<{ pessoas: Pessoa[] }>('/api/pessoas');
    return (response as { pessoas: Pessoa[] }).pessoas || [];he backend API
 */

import { backendAuthService } from './backendAuthService';
import type { Pessoa, Cartao, Gasto, Recorrencia } from '../types';

class BackendDataService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  }

  /**
   * Make authenticated request to API
   */
  private async request<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const authState = backendAuthService.getAuthState();
    
    if (!authState.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    const url = `${this.apiUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authState.token}`,
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid, clear auth state
          await backendAuthService.logout();
          throw new Error('Session expired. Please login again.');
        }
        
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      }
      throw fetchError;
    }
  }

  // === PESSOAS ===
  
  async getPessoas(): Promise<Pessoa[]> {
    const response = await this.request<Record<string, unknown>>('/data/pessoas');
    return ((response as Record<string, unknown>).pessoas as Pessoa[]) || [];
  }

  async getPessoaById(id: string): Promise<Pessoa> {
    const response = await this.request<Record<string, unknown>>(`/data/pessoas/${id}`);
    return (response as Record<string, unknown>).pessoa as Pessoa;
  }

  async createPessoa(pessoa: Omit<Pessoa, 'id' | 'cartoes'>): Promise<Pessoa> {
    // Generate UUID for the pessoa
    const id = crypto.randomUUID();
    
    const response = await this.request<Record<string, unknown>>('/data/pessoas', {
      method: 'POST',
      body: JSON.stringify({
        id,
        nome: pessoa.nome,
        telefone: pessoa.telefone,
        observacoes: pessoa.observacoes,
      }),
    });
    
    return (response as Record<string, unknown>).pessoa as Pessoa;
  }

  async updatePessoa(pessoa: Pessoa): Promise<void> {
    await this.request(`/data/pessoas/${pessoa.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        nome: pessoa.nome,
        telefone: pessoa.telefone,
        observacoes: pessoa.observacoes,
      }),
    });
  }

  async deletePessoa(id: string): Promise<void> {
    await this.request(`/data/pessoas/${id}`, {
      method: 'DELETE',
    });
  }

  // === CARTÕES ===
  
  async getCartoes(): Promise<Cartao[]> {
    const response = await this.request<Record<string, unknown>>('/data/cartoes');
    return ((response as Record<string, unknown>).cartoes as Cartao[]) || [];
  }

  async getCartoesByPessoa(pessoaId: string): Promise<Cartao[]> {
    const response = await this.request<Record<string, unknown>>(`/data/pessoas/${pessoaId}/cartoes`);
    return ((response as Record<string, unknown>).cartoes as Cartao[]) || [];
  }

  async getCartaoById(id: string): Promise<Cartao> {
    const response = await this.request<Record<string, unknown>>(`/data/cartoes/${id}`);
    return (response as Record<string, unknown>).cartao as Cartao;
  }

  async createCartao(pessoaId: string, cartao: Omit<Cartao, 'id'>): Promise<Cartao> {
    // Generate UUID for the cartao
    const id = crypto.randomUUID();
    
    const response = await this.request<Record<string, unknown>>('/data/cartoes', {
      method: 'POST',
      body: JSON.stringify({
        id,
        pessoa_id: pessoaId,
        descricao: cartao.descricao,
        valor_total: cartao.valor_total,
        numero_de_parcelas: cartao.numero_de_parcelas,
        parcelas_pagas: cartao.parcelas_pagas || 0,
        data_compra: cartao.data_compra,
        observacoes: cartao.observacoes,
        categoria: cartao.categoria,
      }),
    });
    
    return (response as Record<string, unknown>).cartao as Cartao;
  }

  async updateCartao(cartao: Cartao): Promise<void> {
    await this.request(`/data/cartoes/${cartao.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        pessoa_id: cartao.pessoa_id,
        descricao: cartao.descricao,
        valor_total: cartao.valor_total,
        numero_de_parcelas: cartao.numero_de_parcelas,
        parcelas_pagas: cartao.parcelas_pagas,
        data_compra: cartao.data_compra,
        observacoes: cartao.observacoes,
        categoria: cartao.categoria,
      }),
    });
  }

  async deleteCartao(id: string): Promise<void> {
    await this.request(`/data/cartoes/${id}`, {
      method: 'DELETE',
    });
  }

  async markInstallmentAsPaid(cartaoId: string, installmentNumber: number): Promise<void> {
    await this.request(`/data/cartoes/${cartaoId}/pay-installment`, {
      method: 'POST',
      body: JSON.stringify({
        installment_number: installmentNumber,
      }),
    });
  }

  async markInstallmentAsUnpaid(cartaoId: string, installmentNumber: number): Promise<void> {
    await this.request(`/data/cartoes/${cartaoId}/unpay-installment`, {
      method: 'POST',
      body: JSON.stringify({
        installment_number: installmentNumber,
      }),
    });
  }

  // === GASTOS ===
  
  async getGastos(): Promise<Gasto[]> {
    const response = await this.request<Record<string, unknown>>('/data/gastos');
    const gastos = ((response as Record<string, unknown>).gastos as any[]) || [];
    
    // Transform snake_case to camelCase
    return gastos.map(gasto => ({
      ...gasto,
      metodoPagamento: gasto.metodo_pagamento,
      recorrenteId: gasto.recorrente_id,
      createdAt: gasto.created_at,
      updatedAt: gasto.updated_at
    }));
  }

  async getGastoById(id: string): Promise<Gasto> {
    const response = await this.request<Record<string, unknown>>(`/data/gastos/${id}`);
    const gasto = (response as Record<string, unknown>).gasto as any;
    
    // Transform snake_case to camelCase
    return {
      ...gasto,
      metodoPagamento: gasto.metodo_pagamento,
      recorrenteId: gasto.recorrente_id,
      createdAt: gasto.created_at,
      updatedAt: gasto.updated_at
    };
  }

  async createGasto(gasto: Omit<Gasto, 'id'>): Promise<Gasto> {
    const id = crypto.randomUUID();
    // Always map camelCase to snake_case for backend
    const payload: any = {
      id,
      descricao: gasto.descricao,
      valor: gasto.valor,
      data: gasto.data,
      categoria: gasto.categoria,
      metodo_pagamento: (gasto as any).metodo_pagamento || (gasto as any).metodoPagamento,
      observacoes: gasto.observacoes,
      recorrente_id: (gasto as any).recorrente_id || (gasto as any).recorrenteId,
    };
    // Remove camelCase fields if present
    delete payload.metodoPagamento;
    delete payload.recorrenteId;

    const response = await this.request<Record<string, unknown>>('/data/gastos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    const gastoResponse = (response as Record<string, unknown>).gasto as any;
    
    // Transform snake_case to camelCase
    return {
      ...gastoResponse,
      metodoPagamento: gastoResponse.metodo_pagamento,
      recorrenteId: gastoResponse.recorrente_id,
      createdAt: gastoResponse.created_at,
      updatedAt: gastoResponse.updated_at
    };
  }

  async updateGasto(gasto: Gasto): Promise<void> {
    // Always map camelCase to snake_case for backend
    const payload: any = {
      descricao: gasto.descricao,
      valor: gasto.valor,
      data: gasto.data,
      categoria: gasto.categoria,
      metodo_pagamento: (gasto as any).metodo_pagamento || (gasto as any).metodoPagamento,
      observacoes: gasto.observacoes,
      recorrente_id: (gasto as any).recorrente_id || (gasto as any).recorrenteId,
    };
    delete payload.metodoPagamento;
    delete payload.recorrenteId;

    await this.request(`/data/gastos/${gasto.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteGasto(id: string): Promise<void> {
    await this.request(`/data/gastos/${id}`, {
      method: 'DELETE',
    });
  }

  // === RECORRÊNCIAS ===
  
  async getRecorrencias(): Promise<Recorrencia[]> {
    const response = await this.request<Record<string, unknown>>('/data/recorrencias');
    const recorrencias = ((response as Record<string, unknown>).recorrencias as any[]) || [];
    
    // Transform snake_case to camelCase
    return recorrencias.map(recorrencia => ({
      ...recorrencia,
      metodoPagamento: recorrencia.metodo_pagamento,
      dataInicio: recorrencia.data_inicio,
      dataFim: recorrencia.data_fim,
      ultimaExecucao: recorrencia.ultima_execucao,
      createdAt: recorrencia.created_at,
      updatedAt: recorrencia.updated_at
    }));
  }

  async getRecorrenciaById(id: string): Promise<Recorrencia> {
    const response = await this.request<Record<string, unknown>>(`/data/recorrencias/${id}`);
    const recorrencia = (response as Record<string, unknown>).recorrencia as any;
    
    // Transform snake_case to camelCase
    return {
      ...recorrencia,
      metodoPagamento: recorrencia.metodo_pagamento,
      dataInicio: recorrencia.data_inicio,
      dataFim: recorrencia.data_fim,
      ultimaExecucao: recorrencia.ultima_execucao,
      createdAt: recorrencia.created_at,
      updatedAt: recorrencia.updated_at
    };
  }

  async createRecorrencia(recorrencia: Omit<Recorrencia, 'id'>): Promise<Recorrencia> {
    const id = crypto.randomUUID();
    
    const response = await this.request<Record<string, unknown>>('/data/recorrencias', {
      method: 'POST',
      body: JSON.stringify({
        id,
        descricao: recorrencia.descricao,
        valor: recorrencia.valor,
        categoria: recorrencia.categoria,
        metodo_pagamento: recorrencia.metodoPagamento,
        frequencia: recorrencia.frequencia,
        data_inicio: recorrencia.dataInicio,
        ativo: recorrencia.ativo,
      }),
    });
    
    const recorrenciaResponse = (response as Record<string, unknown>).recorrencia as any;
    
    // Transform snake_case to camelCase
    return {
      ...recorrenciaResponse,
      metodoPagamento: recorrenciaResponse.metodo_pagamento,
      dataInicio: recorrenciaResponse.data_inicio,
      dataFim: recorrenciaResponse.data_fim,
      ultimaExecucao: recorrenciaResponse.ultima_execucao,
      createdAt: recorrenciaResponse.created_at,
      updatedAt: recorrenciaResponse.updated_at
    };
  }

  async updateRecorrencia(recorrencia: any): Promise<void> {
    await this.request(`/data/recorrencias/${recorrencia.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        descricao: recorrencia.descricao,
        valor: recorrencia.valor,
        categoria: recorrencia.categoria,
        metodo_pagamento: recorrencia.metodo_pagamento || recorrencia.metodoPagamento,
        frequencia: recorrencia.frequencia,
        data_inicio: recorrencia.data_inicio || recorrencia.dataInicio,
        ultima_execucao: recorrencia.ultima_execucao || recorrencia.ultimaExecucao,
        ativo: recorrencia.ativo,
        observacoes: recorrencia.observacoes,
      }),
    });
  }

  async deleteRecorrencia(id: string): Promise<void> {
    await this.request(`/data/recorrencias/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleRecorrencia(id: string, ativo: boolean): Promise<void> {
    await this.request(`/data/recorrencias/${id}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ ativo }),
    });
  }
}

// Export singleton instance
export const backendDataService = new BackendDataService();
export default backendDataService;
