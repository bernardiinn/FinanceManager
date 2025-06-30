/**
 * Finance Service - Business logic for financial calculations
 */

import type { Pessoa, Cartao } from '../types';

export interface FinancialSummary {
  totalLent: number;
  totalReceived: number;
  totalOutstanding: number;
  completedCards: number;
  activeCards: number;
  overdueCards: number;
}

export interface PersonSummary {
  id: string;
  name: string;
  totalLent: number;
  total: number; // alias for totalLent for backward compatibility
  totalReceived: number;
  paid: number; // alias for totalReceived for backward compatibility
  outstanding: number;
  cardsCount: number;
  totalCards: number; // alias for cardsCount for backward compatibility
  activeCards: number;
  completedCards: number;
  overdueCards: number;
}

export interface MonthlyReport {
  month: string;
  totalLent: number;
  totalReceived: number;
  newCards: number;
  completedCards: number;
}

class FinanceService {
  /**
   * Calculate total amount received for a card
   */
  calcularValorRecebido(cartao: Cartao): number {
    if (cartao.numero_de_parcelas === 0) return 0;
    return (cartao.valor_total * cartao.parcelas_pagas) / cartao.numero_de_parcelas;
  }

  /**
   * Calculate outstanding amount for a card
   */
  calcularSaldoCartao(cartao: Cartao): number {
    return cartao.valor_total - this.calcularValorRecebido(cartao);
  }

  /**
   * Check if a card is completed (all installments paid)
   */
  isCartaoCompleto(cartao: Cartao): boolean {
    return cartao.parcelas_pagas >= cartao.numero_de_parcelas;
  }

  /**
   * Check if a card is overdue (simplified - could be enhanced with dates)
   */
  isCartaoAtrasado(cartao: Cartao): boolean {
    // For now, consider a card overdue if it has less than 50% payments completed
    // In a real scenario, this would use actual due dates
    const completionRate = cartao.numero_de_parcelas > 0 
      ? cartao.parcelas_pagas / cartao.numero_de_parcelas 
      : 0;
    return completionRate < 0.5 && cartao.parcelas_pagas > 0;
  }

  /**
   * Calculate financial summary for a person
   */
  calcularSaldoPessoa(pessoa: Pessoa): PersonSummary {
    const totalLent = pessoa.cartoes.reduce((sum, cartao) => sum + cartao.valor_total, 0);
    const totalReceived = pessoa.cartoes.reduce((sum, cartao) => sum + this.calcularValorRecebido(cartao), 0);
    const outstanding = totalLent - totalReceived;
    const completedCards = pessoa.cartoes.filter(cartao => this.isCartaoCompleto(cartao)).length;
    const overdueCards = pessoa.cartoes.filter(cartao => this.isCartaoAtrasado(cartao)).length;
    const activeCards = pessoa.cartoes.filter(cartao => !this.isCartaoCompleto(cartao)).length;

    return {
      id: pessoa.id,
      name: pessoa.nome,
      totalLent,
      total: totalLent, // alias for backward compatibility
      totalReceived,
      paid: totalReceived, // alias for backward compatibility
      outstanding,
      cardsCount: pessoa.cartoes.length,
      totalCards: pessoa.cartoes.length, // alias for backward compatibility
      activeCards,
      completedCards,
      overdueCards,
    };
  }

  /**
   * Calculate overall financial summary
   */
  calcularResumoFinanceiro(pessoas: Pessoa[]): FinancialSummary {
    const totalLent = pessoas.reduce((sum, pessoa) => 
      sum + pessoa.cartoes.reduce((s, cartao) => s + cartao.valor_total, 0), 0
    );

    const totalReceived = pessoas.reduce((sum, pessoa) => 
      sum + pessoa.cartoes.reduce((s, cartao) => s + this.calcularValorRecebido(cartao), 0), 0
    );

    const totalOutstanding = totalLent - totalReceived;

    const allCards = pessoas.flatMap(pessoa => pessoa.cartoes);
    const completedCards = allCards.filter(cartao => this.isCartaoCompleto(cartao)).length;
    const activeCards = allCards.filter(cartao => !this.isCartaoCompleto(cartao)).length;
    const overdueCards = allCards.filter(cartao => this.isCartaoAtrasado(cartao)).length;

    return {
      totalLent,
      totalReceived,
      totalOutstanding,
      completedCards,
      activeCards,
      overdueCards,
    };
  }

  /**
   * Get people with outstanding balances
   */
  getPessoasComSaldo(pessoas: Pessoa[]): PersonSummary[] {
    return pessoas
      .map(pessoa => this.calcularSaldoPessoa(pessoa))
      .filter(summary => summary.outstanding > 0)
      .sort((a, b) => b.outstanding - a.outstanding);
  }

  /**
   * Get monthly reports (simplified for demo)
   */
  getRelatorioMensal(pessoas: Pessoa[]): MonthlyReport[] {
    // This is a simplified version. In a real app, you'd store transaction dates
    const currentMonth = new Date().toLocaleDateString('pt-BR', { 
      year: 'numeric', 
      month: 'long' 
    });

    const summary = this.calcularResumoFinanceiro(pessoas);
    const allCards = pessoas.flatMap(pessoa => pessoa.cartoes);

    return [
      {
        month: currentMonth,
        totalLent: summary.totalLent,
        totalReceived: summary.totalReceived,
        newCards: allCards.length,
        completedCards: summary.completedCards,
      }
    ];
  }

  /**
   * Format currency value
   */
  formatCurrency(value: number, currency: string = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(value);
  }

  /**
   * Calculate completion percentage for a card
   */
  calcularPercentualCompleto(cartao: Cartao): number {
    if (cartao.numero_de_parcelas === 0) return 0;
    return Math.min((cartao.parcelas_pagas / cartao.numero_de_parcelas) * 100, 100);
  }

  /**
   * Get risk level for a person based on their payment history
   */
  calcularNivelRisco(pessoa: Pessoa): 'low' | 'medium' | 'high' {
    if (pessoa.cartoes.length === 0) return 'low';

    const completedCards = pessoa.cartoes.filter(cartao => this.isCartaoCompleto(cartao)).length;
    const overdueCards = pessoa.cartoes.filter(cartao => this.isCartaoAtrasado(cartao)).length;
    const completionRate = completedCards / pessoa.cartoes.length;

    if (overdueCards > 2 || completionRate < 0.3) return 'high';
    if (overdueCards > 0 || completionRate < 0.7) return 'medium';
    return 'low';
  }

  /**
   * Export data to CSV format
   */
  exportToCSV(pessoas: Pessoa[]): string {
    const headers = [
      'Pessoa',
      'Cartão',
      'Valor Total',
      'Parcelas Totais',
      'Parcelas Pagas',
      'Valor Recebido',
      'Saldo Pendente',
      'Status'
    ];

    const rows = pessoas.flatMap(pessoa =>
      pessoa.cartoes.map(cartao => [
        pessoa.nome,
        cartao.descricao,
        this.formatCurrency(cartao.valor_total),
        cartao.numero_de_parcelas.toString(),
        cartao.parcelas_pagas.toString(),
        this.formatCurrency(this.calcularValorRecebido(cartao)),
        this.formatCurrency(this.calcularSaldoCartao(cartao)),
        this.isCartaoCompleto(cartao) ? 'Quitado' : 'Pendente'
      ])
    );

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
}

export const financeService = new FinanceService();
