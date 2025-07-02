/**
 * Expense Service - Database-first expense and recurring transaction management
 * 
 * Replaces localStorage with direct database operations through unifiedDatabaseService
 */

import { unifiedDatabaseService } from './unifiedDatabaseService';
import { generateUUID } from '../utils/uuid';
import type { 
  Gasto, 
  Recorrencia, 
  GastoFormData, 
  RecorrenciaFormData,
  GastoSummary,
  MonthlyExpenseSummary 
} from '../types';

class ExpenseService {
  // === EXPENSE MANAGEMENT ===
  
  async getAllGastos(): Promise<Gasto[]> {
    const gastos = await unifiedDatabaseService.getGastos();
    return gastos.sort((a, b) => 
      new Date(b.data).getTime() - new Date(a.data).getTime()
    );
  }

  async getGastoById(id: string): Promise<Gasto | null> {
    return unifiedDatabaseService.getGastoById(id);
  }

  async createGasto(gastoData: GastoFormData): Promise<Gasto> {
    // Remove both camelCase and snake_case from the spread, then set snake_case explicitly
    const { metodoPagamento, metodo_pagamento, ...rest } = gastoData as any;
    const metodoFinal = metodoPagamento || metodo_pagamento || '';
    if (!metodoFinal) {
      throw new Error('O campo "Método de Pagamento" é obrigatório para criar um gasto.');
    }
    const gasto = {
      id: generateUUID(),
      ...rest,
      metodo_pagamento: metodoFinal,
      data: gastoData.data || new Date().toISOString().split('T')[0]
    };
    return unifiedDatabaseService.createGasto(gasto);
  }

  async updateGasto(id: string, formData: GastoFormData): Promise<void> {
    const existingGasto = await this.getGastoById(id);
    if (!existingGasto) {
      throw new Error('Gasto not found');
    }
    const updatedGasto = {
      ...existingGasto,
      ...formData,
      id: existingGasto.id, // Ensure id is not overwritten
    };
    return unifiedDatabaseService.updateGasto(updatedGasto);
  }

  async deleteGasto(id: string): Promise<void> {
    return unifiedDatabaseService.deleteGasto(id);
  }

  // === RECURRING TRANSACTION MANAGEMENT ===
  
  async getAllRecorrencias(): Promise<Recorrencia[]> {
    const recorrencias = await unifiedDatabaseService.getRecorrencias();
    return recorrencias.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  async getRecorrenciaById(id: string): Promise<Recorrencia | null> {
    return unifiedDatabaseService.getRecorrenciaById(id);
  }

  async createRecorrencia(recorrenciaData: RecorrenciaFormData): Promise<Recorrencia> {
    const now = new Date().toISOString();
    const recorrencia = {
      id: generateUUID(),
      ...recorrenciaData,
      valor: typeof recorrenciaData.valor === 'string' ? parseFloat(recorrenciaData.valor) : recorrenciaData.valor,
      dataInicio: recorrenciaData.dataInicio || new Date().toISOString().split('T')[0],
      ativo: recorrenciaData.ativo !== false, // Default to true
      createdAt: now,
      updatedAt: now,
    };
    return unifiedDatabaseService.createRecorrencia(recorrencia);
  }

  async updateRecorrencia(recorrencia: Recorrencia): Promise<void> {
    const recorrenciaIndex = (await this.getAllRecorrencias()).findIndex(r => r.id === recorrencia.id);
    if (recorrenciaIndex === -1) {
      throw new Error('Recorrencia not found');
    }

    return unifiedDatabaseService.updateRecorrencia(recorrencia);
  }

  async deleteRecorrencia(id: string): Promise<void> {
    return unifiedDatabaseService.deleteRecorrencia(id);
  }

  // === RECURRING TRANSACTIONS ===
  
  async processRecurringTransactions(): Promise<Gasto[]> {
    const recorrencias = await this.getAllRecorrencias();
    const activeRecorrencias = recorrencias.filter(r => r.ativo);
    const newGastos: Gasto[] = [];
    const today = new Date();
    const nowIso = today.toISOString();
    for (const recorrencia of activeRecorrencias) {
      const shouldCreateTransaction = this.shouldCreateRecurringTransaction(recorrencia, today);
      if (shouldCreateTransaction) {
        if (!recorrencia.metodoPagamento) {
          throw new Error(
            `A recorrência "${recorrencia.descricao}" está sem método de pagamento. Edite a recorrência para corrigir e evitar erros ao criar o gasto.`
          );
        }
        const newGasto: Gasto = {
          id: generateUUID(),
          descricao: `[Recorrente] ${recorrencia.descricao}`,
          valor: recorrencia.valor,
          data: nowIso.split('T')[0],
          categoria: recorrencia.categoria,
          metodo_pagamento: recorrencia.metodoPagamento, // snake_case for backend
          observacoes: `Gerado automaticamente de recorrência: ${recorrencia.descricao}`,
          recorrenteId: recorrencia.id,
          createdAt: nowIso,
          updatedAt: nowIso,
        } as any; // Cast to any to allow snake_case
        await this.createGasto(newGasto);
        newGastos.push(newGasto);
        await unifiedDatabaseService.updateRecorrencia({
          ...recorrencia,
          ultimaExecucao: nowIso.split('T')[0],
          updatedAt: nowIso,
        });
      }
    }
    return newGastos;
  }
  
  private shouldCreateRecurringTransaction(recorrencia: Recorrencia, today: Date): boolean {
    if (!recorrencia.ativo) return false;
    const dataInicio = new Date(recorrencia.dataInicio);
    const ultimaExecucao = recorrencia.ultimaExecucao ? new Date(recorrencia.ultimaExecucao) : null;
    if (!ultimaExecucao && dataInicio <= today) {
      return true;
    }
    if (ultimaExecucao) {
      const daysSinceLastExecution = Math.floor((today.getTime() - ultimaExecucao.getTime()) / (1000 * 60 * 60 * 24));
      switch (recorrencia.frequencia) {
        case 'Semanal':
          return daysSinceLastExecution >= 7;
        case 'Mensal':
          return daysSinceLastExecution >= 30;
        case 'Anual':
          return daysSinceLastExecution >= 365;
        default:
          return false;
      }
    }
    return false;
  }

  // === ANALYTICS AND REPORTS ===
  
  async getExpenseSummary(): Promise<GastoSummary> {
    const gastos = await this.getAllGastos();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const thisMonthGastos = gastos.filter(gasto => {
      const gastoDate = new Date(gasto.data);
      return gastoDate.getMonth() === currentMonth && gastoDate.getFullYear() === currentYear;
    });
    const thisMonthTotal = thisMonthGastos.reduce((sum, gasto) => sum + gasto.valor, 0);
    const thisYearGastos = gastos.filter(gasto => {
      const gastoDate = new Date(gasto.data);
      return gastoDate.getFullYear() === currentYear;
    });
    const thisYearTotal = thisYearGastos.reduce((sum, gasto) => sum + gasto.valor, 0);
    const dailyTotals: Record<string, number> = {};
    gastos.forEach(gasto => {
      dailyTotals[gasto.data] = (dailyTotals[gasto.data] || 0) + gasto.valor;
    });
    const days = Object.keys(dailyTotals).length || 1;
    const mediaGastosDiario = gastos.length ? (gastos.reduce((sum, gasto) => sum + gasto.valor, 0) / days) : 0;
    const gastosPorCategoria: Record<string, number> = {};
    const gastosPorMetodo: Record<string, number> = {};
    gastos.forEach(gasto => {
      gastosPorCategoria[gasto.categoria] = (gastosPorCategoria[gasto.categoria] || 0) + gasto.valor;
      gastosPorMetodo[gasto.metodoPagamento] = (gastosPorMetodo[gasto.metodoPagamento] || 0) + gasto.valor;
    });
    return {
      totalGastos: gastos.length,
      gastosPorCategoria,
      gastosPorMetodo,
      gastosMes: thisMonthTotal,
      gastosAno: thisYearTotal,
      mediaGastosDiario,
    };
  }

  async getMonthlyExpenseSummary(): Promise<MonthlyExpenseSummary[]> {
    const gastos = await this.getAllGastos();
    const now = new Date();
    const summary: MonthlyExpenseSummary[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthGastos = gastos.filter(gasto => {
        const gastoDate = new Date(gasto.data);
        return gastoDate.getMonth() === month && gastoDate.getFullYear() === year;
      });
      const total = monthGastos.reduce((sum, gasto) => sum + gasto.valor, 0);
      const categorias: Record<string, number> = {};
      monthGastos.forEach(gasto => {
        categorias[gasto.categoria] = (categorias[gasto.categoria] || 0) + gasto.valor;
      });
      summary.push({
        month: `${year}-${String(month + 1).padStart(2, '0')}`,
        total,
        categorias,
        count: monthGastos.length,
      });
    }
    return summary;
  }

  async getRecurringTransactionsSummary(): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    activeTransactions: number;
  }> {
    const recorrencias = await this.getAllRecorrencias();
    const activeRecorrencias = recorrencias.filter(r => r.ativo);
    // No 'tipo' property, so treat all as expenses
    const expenses = activeRecorrencias.reduce((sum, r) => sum + r.valor, 0);
    return {
      totalIncome: 0,
      totalExpenses: expenses,
      netIncome: -expenses,
      activeTransactions: activeRecorrencias.length,
    };
  }

  // === FILTERS AND SEARCH ===
  
  async getGastosByCategory(categoria: string): Promise<Gasto[]> {
    const allGastos = await this.getAllGastos();
    return allGastos.filter(gasto => gasto.categoria === categoria);
  }

  async getGastosByDateRange(startDate: string, endDate: string): Promise<Gasto[]> {
    const allGastos = await this.getAllGastos();
    return allGastos.filter(gasto => {
      const gastoDate = new Date(gasto.data);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return gastoDate >= start && gastoDate <= end;
    });
  }

  async searchGastos(query: string): Promise<Gasto[]> {
    const allGastos = await this.getAllGastos();
    const searchLower = query.toLowerCase();
    
    return allGastos.filter(gasto => 
      gasto.descricao.toLowerCase().includes(searchLower) ||
      (gasto.categoria && gasto.categoria.toLowerCase().includes(searchLower)) ||
      (gasto.observacoes && gasto.observacoes.toLowerCase().includes(searchLower))
    );
  }

  // === EXPORT/IMPORT HELPERS ===
  
  async exportGastos(): Promise<Gasto[]> {
    return this.getAllGastos();
  }

  async exportRecorrencias(): Promise<Recorrencia[]> {
    return this.getAllRecorrencias();
  }

  async importGastos(gastos: Gasto[]): Promise<void> {
    for (const gasto of gastos) {
      try {
        // Check if gasto already exists
        const existing = await this.getGastoById(gasto.id);
        if (!existing) {
          await unifiedDatabaseService.createGasto(gasto);
        }
      } catch (error) {
        console.warn('Failed to import gasto:', gasto.descricao, error);
      }
    }
  }

  async importRecorrencias(recorrencias: Recorrencia[]): Promise<void> {
    for (const recorrencia of recorrencias) {
      try {
        const existing = await this.getRecorrenciaById(recorrencia.id);
        if (!existing) {
          await unifiedDatabaseService.createRecorrencia(recorrencia);
        }
      } catch (error) {
        console.warn('Failed to import recorrencia:', recorrencia.descricao, error);
      }
    }
  }

  // === RECURRING TRANSACTION LOGIC REWORK ===

  /**
   * Returns all active recorrencias that are due (should have a Gasto for the current period, but don't).
   * This does NOT create Gastos automatically.
   */
  async getPendingRecorrencias(): Promise<Array<{ recorrencia: Recorrencia; dueDate: string }>> {
    const recorrencias = await this.getAllRecorrencias();
    const activeRecorrencias = recorrencias.filter(r => r.ativo);
    const pending: Array<{ recorrencia: Recorrencia; dueDate: string }> = [];
    const today = new Date();

    for (const recorrencia of activeRecorrencias) {
      // Calculate the next expected due date
      const dueDate = this.getNextDueDate(recorrencia);
      if (!dueDate) continue;

      // Check if a Gasto already exists for this recorrencia and dueDate
      const allGastos = await this.getAllGastos();
      const alreadyPaid = allGastos.some(g => g.recorrenteId === recorrencia.id && g.data === dueDate);
      if (!alreadyPaid && new Date(dueDate) <= today) {
        pending.push({ recorrencia, dueDate });
      }
    }
    return pending;
  }

  /**
   * Helper to calculate the next due date for a recorrencia, based on frequency and last execution.
   * Returns a string in YYYY-MM-DD format, or null if not due yet.
   */
  getNextDueDate(recorrencia: Recorrencia): string | null {
    const freq = recorrencia.frequencia?.toLowerCase();
    const start = recorrencia.dataInicio ? new Date(recorrencia.dataInicio) : new Date();
    const last = recorrencia.ultimaExecucao ? new Date(recorrencia.ultimaExecucao) : null;
    let next: Date;
    if (!last) {
      next = start;
    } else {
      next = new Date(last);
      switch (freq) {
        case 'diario': next.setDate(next.getDate() + 1); break;
        case 'semanal': next.setDate(next.getDate() + 7); break;
        case 'mensal': next.setMonth(next.getMonth() + 1); break;
        case 'bimestral': next.setMonth(next.getMonth() + 2); break;
        case 'trimestral': next.setMonth(next.getMonth() + 3); break;
        case 'semestral': next.setMonth(next.getMonth() + 6); break;
        case 'anual': next.setFullYear(next.getFullYear() + 1); break;
        default: return null;
      }
    }
    // Return as YYYY-MM-DD
    return next.toISOString().split('T')[0];
  }

  /**
   * Mark a recorrencia as paid for a given due date. Creates a Gasto and updates ultimaExecucao.
   * Returns the created Gasto.
   */
  async payRecorrencia(recorrenciaId: string, paidDate: string): Promise<Gasto> {
    const recorrencia = await this.getRecorrenciaById(recorrenciaId);
    if (!recorrencia) throw new Error('Recorrência não encontrada');
    if (!recorrencia.metodoPagamento) {
      throw new Error(
        `A recorrência "${recorrencia.descricao}" está sem método de pagamento. Edite a recorrência para corrigir e evitar erros ao marcar como paga.`
      );
    }
    // Check if already paid
    const allGastos = await this.getAllGastos();
    const alreadyPaid = allGastos.some(g => g.recorrenteId === recorrenciaId && g.data === paidDate);
    if (alreadyPaid) throw new Error('Esta recorrência já foi paga para esta data');
    // Create the gasto
    const now = new Date().toISOString();
    const gasto: Gasto = {
      id: generateUUID(),
      descricao: `[Recorrente] ${recorrencia.descricao}`,
      valor: recorrencia.valor,
      data: paidDate,
      categoria: recorrencia.categoria,
      metodo_pagamento: recorrencia.metodoPagamento, // snake_case for backend
      observacoes: `Gerado automaticamente de recorrência: ${recorrencia.descricao}`,
      recorrenteId: recorrencia.id,
      createdAt: now,
      updatedAt: now,
    } as any; // Cast to any to allow snake_case
    await unifiedDatabaseService.createGasto(gasto);
    // Update ultimaExecucao
    await unifiedDatabaseService.updateRecorrencia({ ...recorrencia, ultimaExecucao: paidDate });
    return gasto;
  }
}

// Export singleton instance
export const expenseService = new ExpenseService();
export default expenseService;
