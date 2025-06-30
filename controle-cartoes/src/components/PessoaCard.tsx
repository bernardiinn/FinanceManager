/**
 * Enhanced Person Card Component - Mobile-First PWA Design
 * Fully responsive with modern UX and accessibility features
 */

import React from 'react';
import { Phone, Mail, CreditCard, AlertTriangle, DollarSign, Calendar } from 'lucide-react';
import { financeService } from '../services/financeService';
import type { Pessoa } from '../types';
import { Card } from './ui/Layout';

interface PessoaCardProps {
  pessoa: Pessoa;
  onEdit?: () => void;
  onViewDetails?: () => void;
  showActions?: boolean;
  showFinancialSummary?: boolean;
  compact?: boolean;
}

export const PessoaCard: React.FC<PessoaCardProps> = ({ 
  pessoa, 
  onEdit, 
  onViewDetails,
  showActions = false,
  showFinancialSummary = true,
  compact = false
}) => {
  const summary = financeService.calcularSaldoPessoa(pessoa);
  const riskLevel = financeService.calcularNivelRisco(pessoa);
  
  // Calculate derived values that might be missing
  const activeCards = pessoa.cartoes.filter(cartao => !financeService.isCartaoCompleto(cartao)).length;
  
  const initials = pessoa.nome
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const getRiskConfig = () => {
    switch (riskLevel) {
      case 'high':
        return {
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          label: 'Alto Risco',
          icon: <AlertTriangle size={12} />,
        };
      case 'medium':
        return {
          color: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
          label: 'Médio Risco',
          icon: <AlertTriangle size={12} />,
        };
      case 'low':
      default:
        return {
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          label: 'Baixo Risco',
          icon: <AlertTriangle size={12} />,
        };
    }
  };

  const riskConfig = getRiskConfig();

  if (compact) {
    return (
      <Card className="p-4 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {initials}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {pessoa.nome}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CreditCard size={14} />
              <span>{summary.cardsCount} cartões</span>
            </div>
          </div>

          {/* Amount */}
          {showFinancialSummary && (summary.outstanding || 0) > 0 && (
            <div className="text-right flex-shrink-0">
              <p className="font-semibold text-amber-600 dark:text-amber-400">
                R$ {(summary.outstanding || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                pendente
              </p>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
          {initials}
        </div>

        {/* Person Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate">
              {pessoa.nome}
            </h3>
            {riskLevel !== 'low' && (
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${riskConfig.color} ${riskConfig.bgColor}`}>
                {riskConfig.icon}
                {riskConfig.label}
              </span>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-1">
            {pessoa.telefone && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Phone size={14} />
                <span className="truncate">{pessoa.telefone}</span>
              </div>
            )}
            {pessoa.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Mail size={14} />
                <span className="truncate">{pessoa.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-1">
            <CreditCard size={14} />
            <span>Cartões</span>
          </div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {summary.cardsCount}
          </p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-1">
            <Calendar size={14} />
            <span>Ativos</span>
          </div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {activeCards}
          </p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-1">
            <DollarSign size={14} />
            <span>Pendente</span>
          </div>
          <p className={`font-semibold ${(summary.outstanding || 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
            R$ {(summary.outstanding || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Financial Summary */}
      {showFinancialSummary && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Total emprestado:
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              R$ {(summary.totalLent || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Já recebido:
            </span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              R$ {(summary.totalReceived || 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Notes */}
      {pessoa.observacoes && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {pessoa.observacoes}
          </p>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-200"
            >
              Ver Detalhes
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Editar
            </button>
          )}
        </div>
      )}
    </Card>
  );
};

export default PessoaCard;
