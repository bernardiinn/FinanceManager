/**
 * Backend Data Service
 * Handles all data operations with the backend API
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
  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
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
    const response = await this.request('/data/pessoas');
    return response.pessoas || [];
  }

  async getPessoaById(id: string): Promise<Pessoa> {
    const response = await this.request(`/data/pessoas/${id}`);
    return response.pessoa;
  }

  async createPessoa(pessoa: Omit<Pessoa, 'id' | 'cartoes'>): Promise<Pessoa> {
    // Generate UUID for the pessoa
    const id = crypto.randomUUID();
    
    const response = await this.request('/data/pessoas', {
      method: 'POST',
      body: JSON.stringify({
        id,
        nome: pessoa.nome,
        telefone: pessoa.telefone,
        observacoes: pessoa.observacoes,
      }),
    });
    
    return response.pessoa;
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
    const response = await this.request('/data/cartoes');
    return response.cartoes || [];
  }

  async getCartoesByPessoa(pessoaId: string): Promise<Cartao[]> {
    const response = await this.request(`/data/pessoas/${pessoaId}/cartoes`);
    return response.cartoes || [];
  }

  async getCartaoById(id: string): Promise<Cartao> {
    const response = await this.request(`/data/cartoes/${id}`);
    return response.cartao;
  }

  async createCartao(pessoaId: string, cartao: Omit<Cartao, 'id'>): Promise<Cartao> {
    // Generate UUID for the cartao
    const id = crypto.randomUUID();
    
    const response = await this.request('/data/cartoes', {
      method: 'POST',
      body: JSON.stringify({
        id,
        pessoa_id: pessoaId,
        descricao: cartao.descricao,
        valor_total: cartao.valorTotal,
        parcelas_totais: cartao.parcelasTotais,
        parcelas_pagas: cartao.parcelasPagas || 0,
        valor_pago: cartao.valorPago || 0,
        data_vencimento: cartao.dataVencimento,
        observacoes: cartao.observacoes,
        tipo_cartao: cartao.tipoCartao || 'credito',
      }),
    });
    
    return response.cartao;
  }

  async updateCartao(cartao: Cartao): Promise<void> {
    await this.request(`/data/cartoes/${cartao.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        pessoa_id: cartao.pessoaId,
        descricao: cartao.descricao,
        valor_total: cartao.valorTotal,
        parcelas_totais: cartao.parcelasTotais,
        parcelas_pagas: cartao.parcelasPagas,
        valor_pago: cartao.valorPago,
        data_vencimento: cartao.dataVencimento,
        observacoes: cartao.observacoes,
        tipo_cartao: cartao.tipoCartao,
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

  // === GASTOS ===
  
  async getGastos(): Promise<Gasto[]> {
    const response = await this.request('/data/gastos');
    return response.gastos || [];
  }

  async getGastoById(id: string): Promise<Gasto> {
    const response = await this.request(`/data/gastos/${id}`);
    return response.gasto;
  }

  async createGasto(gasto: Omit<Gasto, 'id'>): Promise<Gasto> {
    const id = crypto.randomUUID();
    
    const response = await this.request('/data/gastos', {
      method: 'POST',
      body: JSON.stringify({
        id,
        descricao: gasto.descricao,
        valor: gasto.valor,
        data: gasto.data,
        categoria: gasto.categoria,
        metodo_pagamento: gasto.metodoPagamento,
        observacoes: gasto.observacoes,
        recorrente_id: gasto.recorrenteId,
      }),
    });
    
    return response.gasto;
  }

  async updateGasto(gasto: Gasto): Promise<void> {
    await this.request(`/data/gastos/${gasto.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        descricao: gasto.descricao,
        valor: gasto.valor,
        data: gasto.data,
        categoria: gasto.categoria,
        metodo_pagamento: gasto.metodoPagamento,
        observacoes: gasto.observacoes,
        recorrente_id: gasto.recorrenteId,
      }),
    });
  }

  async deleteGasto(id: string): Promise<void> {
    await this.request(`/data/gastos/${id}`, {
      method: 'DELETE',
    });
  }

  // === RECORRÊNCIAS ===
  
  async getRecorrencias(): Promise<Recorrencia[]> {
    const response = await this.request('/data/recorrencias');
    return response.recorrencias || [];
  }

  async getRecorrenciaById(id: string): Promise<Recorrencia> {
    const response = await this.request(`/data/recorrencias/${id}`);
    return response.recorrencia;
  }

  async createRecorrencia(recorrencia: Omit<Recorrencia, 'id'>): Promise<Recorrencia> {
    const id = crypto.randomUUID();
    
    const response = await this.request('/data/recorrencias', {
      method: 'POST',
      body: JSON.stringify({
        id,
        descricao: recorrencia.descricao,
        valor: recorrencia.valor,
        categoria: recorrencia.categoria,
        metodo_pagamento: recorrencia.metodoPagamento,
        frequencia: recorrencia.frequencia,
        data_inicio: recorrencia.dataInicio,
        observacoes: recorrencia.observacoes,
        ativo: recorrencia.ativo,
      }),
    });
    
    return response.recorrencia;
  }

  async updateRecorrencia(recorrencia: Recorrencia): Promise<void> {
    await this.request(`/data/recorrencias/${recorrencia.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        descricao: recorrencia.descricao,
        valor: recorrencia.valor,
        categoria: recorrencia.categoria,
        metodo_pagamento: recorrencia.metodoPagamento,
        frequencia: recorrencia.frequencia,
        data_inicio: recorrencia.dataInicio,
        observacoes: recorrencia.observacoes,
        ativo: recorrencia.ativo,
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
