/**
 * Enhanced Card Component for Credit Cards
 */

import React from 'react';
import { CreditCard, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { financeService } from '../services/financeService';
import type { Cartao } from '../types';
import Card from './ui/Card';

interface CartaoCardProps {
  cartao: Cartao;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

export const CartaoCard: React.FC<CartaoCardProps> = ({ 
  cartao, 
  onEdit, 
  onDelete, 
  showActions = false,
  compact = false 
}) => {
  const isCompleted = financeService.isCartaoCompleto(cartao);
  const isOverdue = financeService.isCartaoAtrasado(cartao);
  const valorRecebido = financeService.calcularValorRecebido(cartao);
  const saldoPendente = financeService.calcularSaldoCartao(cartao);
  const percentualCompleto = financeService.calcularPercentualCompleto(cartao);

  const getStatusConfig = () => {
    if (isCompleted) {
      return {
        color: 'var(--color-success)',
        icon: <CheckCircle />,
        text: 'Quitado',
        bgColor: 'rgba(40, 167, 69, 0.1)',
      };
    }
    if (isOverdue) {
      return {
        color: 'var(--color-danger)',
        icon: <AlertTriangle />,
        text: 'Atrasado',
        bgColor: 'rgba(220, 53, 69, 0.1)',
      };
    }
    return {
      color: 'var(--color-warning)',
      icon: <Clock />,
      text: 'Em andamento',
      bgColor: 'rgba(255, 193, 7, 0.1)',
    };
  };

  const status = getStatusConfig();

  if (compact) {
    return (
      <Card className="cartao-card cartao-card-compact" hover>
        <Card.Body padding="sm">
          <div className="cartao-compact-layout">
            <div className="cartao-compact-icon" style={{ color: status.color }}>
              <CreditCard size={20} />
            </div>
            
            <div className="cartao-compact-content">
              <h4 className="cartao-name">{cartao.descricao}</h4>
              <p className="cartao-amount">
                {financeService.formatCurrency(cartao.valor_total)}
              </p>
            </div>
            
            <div className="cartao-compact-status" style={{ color: status.color }}>
              {status.icon}
            </div>
          </div>
          
          <div className="cartao-progress-bar">
            <div 
              className="cartao-progress-fill"
              style={{ 
                width: `${percentualCompleto}%`,
                backgroundColor: status.color 
              }}
            />
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card 
      className="cartao-card" 
      hover 
      style={{ borderLeft: `4px solid ${status.color}` }}
    >
      <Card.Body>
        <div className="cartao-header">
          <div className="cartao-icon" style={{ color: status.color }}>
            <CreditCard size={24} />
          </div>
          
          <div className="cartao-title-section">
            <h3 className="cartao-name">{cartao.descricao}</h3>
            {cartao.categoria && (
              <span className="cartao-category">{cartao.categoria}</span>
            )}
          </div>
          
          <div className="cartao-status" style={{ backgroundColor: status.bgColor }}>
            <span style={{ color: status.color }}>
              {status.icon}
            </span>
            <span className="cartao-status-text" style={{ color: status.color }}>
              {status.text}
            </span>
          </div>
        </div>

        <div className="cartao-details">
          <div className="cartao-financial-grid">
            <div className="cartao-financial-item">
              <span className="cartao-label">Valor Total</span>
              <span className="cartao-value cartao-value-total">
                {financeService.formatCurrency(cartao.valor_total)}
              </span>
            </div>
            
            <div className="cartao-financial-item">
              <span className="cartao-label">Valor Recebido</span>
              <span className="cartao-value cartao-value-received">
                {financeService.formatCurrency(valorRecebido)}
              </span>
            </div>
            
            <div className="cartao-financial-item">
              <span className="cartao-label">Saldo Pendente</span>
              <span className={`cartao-value ${saldoPendente > 0 ? 'cartao-value-pending' : 'cartao-value-complete'}`}>
                {financeService.formatCurrency(saldoPendente)}
              </span>
            </div>
          </div>

          <div className="cartao-installments">
            <div className="cartao-installments-header">
              <span className="cartao-label">Parcelas</span>
              <span className="cartao-installments-fraction">
                {cartao.parcelas_pagas} / {cartao.numero_de_parcelas}
              </span>
            </div>
            
            <div className="cartao-progress-container">
              <div className="cartao-progress-bar">
                <div 
                  className="cartao-progress-fill"
                  style={{ 
                    width: `${percentualCompleto}%`,
                    backgroundColor: status.color 
                  }}
                />
              </div>
              <span className="cartao-progress-text">
                {Math.round(percentualCompleto)}%
              </span>
            </div>
          </div>

          {cartao.observacoes && (
            <div className="cartao-notes">
              <span className="cartao-label">Observações</span>
              <p className="cartao-notes-text">{cartao.observacoes}</p>
            </div>
          )}
        </div>

        {showActions && (onEdit || onDelete) && (
          <div className="cartao-actions">
            {onEdit && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onEdit}
              >
                Editar
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={onDelete}
              >
                Excluir
              </button>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default CartaoCard;