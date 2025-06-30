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
    const gasto = {
      id: generateUUID(),
      ...gastoData,
      data: gastoData.data || new Date().toISOString().split('T')[0]
    };

    return unifiedDatabaseService.createGasto(gasto);
  }

  async updateGasto(gasto: Gasto): Promise<void> {
    const gastoIndex = (await this.getAllGastos()).findIndex(g => g.id === gasto.id);
    if (gastoIndex === -1) {
      throw new Error('Gasto not found');
    }

    return unifiedDatabaseService.updateGasto(gasto);
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
    const recorrencia = {
      id: generateUUID(),
      ...recorrenciaData,
      data_inicio: recorrenciaData.data_inicio || new Date().toISOString().split('T')[0],
      ativo: recorrenciaData.ativo !== false // Default to true
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
    // Get all active recorrencias
    const recorrencias = await this.getAllRecorrencias();
    const activeRecorrencias = recorrencias.filter(r => r.ativo);
    
    const newGastos: Gasto[] = [];
    const today = new Date();
    
    for (const recorrencia of activeRecorrencias) {
      // Check if we need to create a new transaction based on frequency
      const shouldCreateTransaction = this.shouldCreateRecurringTransaction(recorrencia, today);
      
      if (shouldCreateTransaction) {
        const newGasto = {
          id: generateUUID(),
          descricao: `[Recorrente] ${recorrencia.descricao}`,
          valor: recorrencia.valor,
          data: today.toISOString().split('T')[0],
          categoria: recorrencia.categoria,
          metodoPagamento: recorrencia.metodoPagamento,
          observacoes: `Gerado automaticamente de recorrência: ${recorrencia.descricao}`,
          recorrenteId: recorrencia.id,
        };
        
        // Create the gasto
        await this.createGasto(newGasto);
        newGastos.push(newGasto);
        
        // Update the recorrencia's last execution date
        await unifiedDatabaseService.updateRecorrencia({
          ...recorrencia,
          ultimaExecucao: today.toISOString().split('T')[0],
        });
      }
    }
    
    return newGastos;
  }
  
  private shouldCreateRecurringTransaction(recorrencia: Recorrencia, today: Date): boolean {
    if (!recorrencia.ativo) return false;
    
    const dataInicio = new Date(recorrencia.dataInicio);
    const ultimaExecucao = recorrencia.ultimaExecucao ? new Date(recorrencia.ultimaExecucao) : null;
    
    // If never executed and start date has passed
    if (!ultimaExecucao && dataInicio <= today) {
      return true;
    }
    
    // If already executed, check if enough time has passed based on frequency
    if (ultimaExecucao) {
      const daysSinceLastExecution = Math.floor((today.getTime() - ultimaExecucao.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (recorrencia.frequencia) {
        case 'diario':
          return daysSinceLastExecution >= 1;
        case 'semanal':
          return daysSinceLastExecution >= 7;
        case 'mensal':
          return daysSinceLastExecution >= 30;
        case 'bimestral':
          return daysSinceLastExecution >= 60;
        case 'trimestral':
          return daysSinceLastExecution >= 90;
        case 'semestral':
          return daysSinceLastExecution >= 180;
        case 'anual':
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

    // Get last month for comparison
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const lastMonthGastos = gastos.filter(gasto => {
      const gastoDate = new Date(gasto.data);
      return gastoDate.getMonth() === lastMonth && gastoDate.getFullYear() === lastMonthYear;
    });

    const lastMonthTotal = lastMonthGastos.reduce((sum, gasto) => sum + gasto.valor, 0);

    // Calculate categories
    const categorias = thisMonthGastos.reduce((acc, gasto) => {
      const categoria = gasto.categoria || 'Outros';
      acc[categoria] = (acc[categoria] || 0) + gasto.valor;
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categorias)
      .sort(([,a], [,b]) => b - a)[0];

    return {
      totalMesAtual: thisMonthTotal,
      totalMesAnterior: lastMonthTotal,
      totalGastos: gastos.length,
      gastosNesteMes: thisMonthGastos.length,
      categoriaComMaisGastos: topCategory ? topCategory[0] : 'Nenhuma',
      valorCategoriaComMaisGastos: topCategory ? topCategory[1] : 0,
      categorias: Object.entries(categorias).map(([nome, valor]) => ({ nome, valor }))
    };
  }

  async getMonthlyExpenseSummary(): Promise<MonthlyExpenseSummary[]> {
    const gastos = await this.getAllGastos();
    const now = new Date();
    const summary: MonthlyExpenseSummary[] = [];

    // Get last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth();
      const year = date.getFullYear();

      const monthGastos = gastos.filter(gasto => {
        const gastoDate = new Date(gasto.data);
        return gastoDate.getMonth() === month && gastoDate.getFullYear() === year;
      });

      const total = monthGastos.reduce((sum, gasto) => sum + gasto.valor, 0);

      summary.push({
        mes: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        total: total,
        quantidade: monthGastos.length
      });
    }

    return summary;
  }

  async getCategoryBreakdown(): Promise<Array<{ categoria: string; total: number; count: number }>> {
    const gastos = await this.getAllGastos();
    const categoryMap = new Map<string, { total: number; count: number }>();

    gastos.forEach(gasto => {
      const categoria = gasto.categoria || 'Outros';
      const current = categoryMap.get(categoria) || { total: 0, count: 0 };
      categoryMap.set(categoria, {
        total: current.total + gasto.valor,
        count: current.count + 1
      });
    });

    return Array.from(categoryMap.entries())
      .map(([categoria, data]) => ({ categoria, ...data }))
      .sort((a, b) => b.total - a.total);
  }

  // === RECURRING TRANSACTIONS ANALYTICS ===
  
  async getRecurringTransactionsSummary(): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    activeTransactions: number;
  }> {
    const recorrencias = await this.getAllRecorrencias();
    const activeRecorrencias = recorrencias.filter(r => r.ativo);

    const income = activeRecorrencias
      .filter(r => r.tipo === 'income')
      .reduce((sum, r) => sum + r.valor, 0);

    const expenses = activeRecorrencias
      .filter(r => r.tipo === 'expense')
      .reduce((sum, r) => sum + r.valor, 0);

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netIncome: income - expenses,
      activeTransactions: activeRecorrencias.length
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
        // Check if recorrencia already exists
        const existing = await this.getRecorrenciaById(recorrencia.id);
        if (!existing) {
          await unifiedDatabaseService.createRecorrencia(recorrencia);
        }
      } catch (error) {
        console.warn('Failed to import recorrencia:', recorrencia.nome, error);
      }
    }
  }
}

// Export singleton instance
export const expenseService = new ExpenseService();
export default expenseService;
