/**
 * Recorrencias Page - Manage recurring transactions
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  RefreshCw, 
  Calendar,
  DollarSign,
  Clock,
  Edit2,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Activity,
  Target,
  TrendingUp
} from 'lucide-react';
import { PageLayout, Card, TwoColumnGrid } from '../components/ui/Layout';
import { PrimaryButton } from '../components/ui/FormComponents';
import { expenseService } from '../services/expenseService';
import { useToast } from '../components/Toast';
import type { Recorrencia } from '../types';

const Recorrencias: React.FC = () => {
  const [recorrencias, setRecorrencias] = useState<Recorrencia[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await expenseService.getAllRecorrencias();
      setRecorrencias(data || []);
    } catch (error) {
      console.error('Error loading recorrencias:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao carregar recorrências.',
      });
      setRecorrencias([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRecorrencia = async (id: string, currentStatus: boolean) => {
    try {
      const updated = await expenseService.updateRecorrencia(id, { ativo: !currentStatus });
      if (updated) {
        setRecorrencias(prev => 
          prev.map(rec => rec.id === id ? { ...rec, ativo: !currentStatus } : rec)
        );
        addToast({
          type: 'success',
          title: 'Sucesso',
          message: `Recorrência ${!currentStatus ? 'ativada' : 'desativada'} com sucesso.`,
        });
      }
    } catch (error) {
      console.error('Error toggling recorrencia:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao alterar status da recorrência.',
      });
    }
  };

  const handleDeleteRecorrencia = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta recorrência?')) return;

    try {
      const success = await expenseService.deleteRecorrencia(id);
      if (success) {
        setRecorrencias(prev => prev.filter(rec => rec.id !== id));
        addToast({
          type: 'success',
          title: 'Sucesso',
          message: 'Recorrência excluída com sucesso.',
        });
      } else {
        throw new Error('Failed to delete recorrencia');
      }
    } catch (error) {
      console.error('Error deleting recorrencia:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao excluir recorrência.',
      });
    }
  };

  const handleProcessRecurring = async () => {
    try {
      const newGastos = await expenseService.processRecurringTransactions();
      
      if (newGastos.length > 0) {
        addToast({
          type: 'success',
          title: 'Transações Processadas',
          message: `${newGastos.length} nova(s) transação(ões) gerada(s).`,
        });
      } else {
        addToast({
          type: 'info',
          title: 'Nenhuma Transação',
          message: 'Nenhuma nova transação foi gerada.',
        });
      }
      
      loadData(); // Reload to update ultimaExecucao
    } catch (error) {
      console.error('Error processing recurring transactions:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao processar transações recorrentes.',
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getFrequencyIcon = (frequencia: string) => {
    switch (frequencia) {
      case 'Semanal':
        return '📅';
      case 'Mensal':
        return '🗓️';
      case 'Anual':
        return '📆';
      default:
        return '⏱️';
    }
  };

  const getNextExecutionDate = (recorrencia: Recorrencia) => {
    if (!recorrencia.ativo) return null;
    
    const today = new Date();
    const startDate = new Date(recorrencia.dataInicio);
    const lastExecution = recorrencia.ultimaExecucao ? new Date(recorrencia.ultimaExecucao) : null;
    
    if (today < startDate) {
      return startDate;
    }
    
    if (!lastExecution) {
      return startDate;
    }
    
    const nextDate = new Date(lastExecution);
    switch (recorrencia.frequencia) {
      case 'Semanal':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'Mensal':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'Anual':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    
    return nextDate;
  };

  const getStatusInfo = (recorrencia: Recorrencia) => {
    if (!recorrencia.ativo) {
      return { status: 'inactive', label: 'Inativa', color: 'text-gray-500' };
    }
    
    const today = new Date();
    const nextExecution = getNextExecutionDate(recorrencia);
    
    if (!nextExecution) {
      return { status: 'error', label: 'Erro', color: 'text-red-500' };
    }
    
    if (nextExecution <= today) {
      return { status: 'pending', label: 'Pendente', color: 'text-orange-500' };
    }
    
    return { status: 'scheduled', label: 'Agendada', color: 'text-green-500' };
  };

  const activeRecorrencias = (recorrencias || []).filter(r => r?.ativo);
  const inactiveRecorrencias = (recorrencias || []).filter(r => !r?.ativo);

  if (loading) {
    return (
      <PageLayout
        title="Recorrências"
        subtitle="Carregando transações recorrentes..."
        icon={<RefreshCw size={24} />}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Carregando recorrências...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Transações Recorrentes"
      subtitle="Gerencie gastos que se repetem automaticamente"
      icon={<RefreshCw size={24} />}
      actions={
        <div className="flex flex-wrap gap-2">
          <PrimaryButton
            variant="outline"
            size="sm"
            onClick={handleProcessRecurring}
            icon={<Play size={16} />}
          >
            <span className="hidden sm:inline">Processar</span>
          </PrimaryButton>
          
          <PrimaryButton
            variant="outline"
            size="sm"
            onClick={loadData}
            icon={<RefreshCw size={16} />}
          >
            <span className="hidden sm:inline">Atualizar</span>
          </PrimaryButton>
          
          <Link to="/recorrencias/adicionar">
            <PrimaryButton
              size="sm"
              icon={<Plus size={16} />}
            >
              <span className="hidden sm:inline">Adicionar</span>
            </PrimaryButton>
          </Link>
        </div>
      }
    >

        {/* Summary Stats */}
        <TwoColumnGrid className="mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {activeRecorrencias.length}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Recorrências Ativas</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <DollarSign className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {formatCurrency(
                  activeRecorrencias
                    .filter(r => r.frequencia === 'Mensal')
                    .reduce((sum, r) => sum + r.valor, 0)
                )}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Valor Mensal Estimado</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                <Clock className="text-orange-600 dark:text-orange-400" size={24} />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {activeRecorrencias.filter(r => {
                  const nextDate = getNextExecutionDate(r);
                  return nextDate && nextDate <= new Date();
                }).length}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pendentes</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
                <Pause className="text-gray-600 dark:text-gray-400" size={24} />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {inactiveRecorrencias.length}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Inativas</p>
            </div>
          </Card>
        </TwoColumnGrid>

        {/* Active Recorrencias */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recorrências Ativas
            </h2>
          </div>

          {activeRecorrencias.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Nenhuma recorrência ativa cadastrada.
              </p>
              <Link to="/recorrencias/adicionar">
                <PrimaryButton>
                  <Plus size={16} className="mr-2" />
                  Adicionar Primeira Recorrência
                </PrimaryButton>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeRecorrencias.map((recorrencia) => {
                const statusInfo = getStatusInfo(recorrencia);
                const nextExecution = getNextExecutionDate(recorrencia);
                
                return (
                  <div
                    key={recorrencia.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {recorrencia.descricao}
                          </h3>
                          <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <span>
                              {getFrequencyIcon(recorrencia.frequencia)} {recorrencia.frequencia}
                            </span>
                            <span>🏷️ {recorrencia.categoria}</span>
                            <span>💳 {recorrencia.metodoPagamento}</span>
                            <span className={statusInfo.color}>
                              ● {statusInfo.label}
                            </span>
                          </div>
                          {nextExecution && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Próxima execução: {formatDate(nextExecution.toISOString().split('T')[0])}
                            </p>
                          )}
                          {recorrencia.ultimaExecucao && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Última execução: {formatDate(recorrencia.ultimaExecucao)}
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                            {formatCurrency(recorrencia.valor)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <PrimaryButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleRecorrencia(recorrencia.id, recorrencia.ativo)}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        <Pause size={16} />
                      </PrimaryButton>
                      
                      <Link to={`/recorrencias/${recorrencia.id}/editar`}>
                        <PrimaryButton variant="outline" size="sm">
                          <Edit2 size={16} />
                        </PrimaryButton>
                      </Link>
                      
                      <PrimaryButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRecorrencia(recorrencia.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900"
                      >
                        <Trash2 size={16} />
                      </PrimaryButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Inactive Recorrencias */}
        {inactiveRecorrencias.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recorrências Inativas
              </h2>
            </div>

            <div className="space-y-4">
              {inactiveRecorrencias.map((recorrencia) => (
                <div
                  key={recorrencia.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 opacity-75"
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-700 dark:text-gray-300">
                          {recorrencia.descricao}
                        </h3>
                        <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-500 dark:text-gray-500">
                          <span>
                            {getFrequencyIcon(recorrencia.frequencia)} {recorrencia.frequencia}
                          </span>
                          <span>🏷️ {recorrencia.categoria}</span>
                          <span>💳 {recorrencia.metodoPagamento}</span>
                          <span className="text-gray-500">● Inativa</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                          {formatCurrency(recorrencia.valor)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <PrimaryButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleRecorrencia(recorrencia.id, recorrencia.ativo)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Play size={16} />
                    </PrimaryButton>
                    
                    <Link to={`/recorrencias/${recorrencia.id}/editar`}>
                      <PrimaryButton variant="outline" size="sm">
                        <Edit2 size={16} />
                      </PrimaryButton>
                    </Link>
                    
                    <PrimaryButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRecorrencia(recorrencia.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900"
                    >
                      <Trash2 size={16} />
                    </PrimaryButton>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Quick Access */}
        <div className="flex justify-center mt-6">
          <Link to="/gastos">
            <PrimaryButton variant="outline" icon={<DollarSign size={16} />}>
              Ver Todos os Gastos
            </PrimaryButton>
          </Link>
        </div>
    </PageLayout>
  );
};

export default Recorrencias;
