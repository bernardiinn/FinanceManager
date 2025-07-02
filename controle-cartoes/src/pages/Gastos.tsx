/**
 * Gastos (Expenses) Page - Main expenses management interface
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Filter, 
  Calendar,
  DollarSign,
  TrendingUp,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { PageLayout, Card, TwoColumnGrid } from '../components/ui/Layout';
import { PrimaryButton } from '../components/ui/FormComponents';
import { Input } from '../components/ui/Input';
import { expenseService } from '../services/expenseService';
import { useToast } from '../components/Toast';
import type { Gasto, MonthlyExpenseSummary } from '../types';

interface FilterState {
  search: string;
  category: string;
  paymentMethod: string;
  startDate: string;
  endDate: string;
}

const Gastos: React.FC = () => {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [filteredGastos, setFilteredGastos] = useState<Gasto[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyExpenseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    paymentMethod: '',
    startDate: '',
    endDate: '',
  });

  const { addToast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Process recurring transactions first
      const newRecurringGastos = await expenseService.processRecurringTransactions();
      if (newRecurringGastos.length > 0) {
        addToast({
          type: 'success',
          title: 'Transações Recorrentes',
          message: `${newRecurringGastos.length} nova(s) transação(ões) gerada(s) automaticamente.`,
        });
      }
      
      const allGastos = await expenseService.getAllGastos();
      const monthlyStats = await expenseService.getMonthlyExpenseSummary();
      
      setGastos(allGastos || []);
      setMonthlyData(monthlyStats || []);
      
      // Set default to current month
      if (!selectedMonth && (monthlyStats || []).length > 0) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        setSelectedMonth(currentMonth);
      }
    } catch (error) {
      console.error('Error loading gastos:', error);
      setGastos([]);
      setMonthlyData([]);
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao carregar gastos.',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast, selectedMonth]);

  const applyFilters = useCallback(() => {
    let filtered = [...gastos];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(gasto => 
        gasto.descricao.toLowerCase().includes(searchLower) ||
        gasto.observacoes?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(gasto => gasto.categoria === filters.category);
    }

    // Payment method filter
    if (filters.paymentMethod) {
      filtered = filtered.filter(gasto => gasto.metodoPagamento === filters.paymentMethod);
    }

    // Date range filter
    if (filters.startDate) {
      filtered = filtered.filter(gasto => gasto.data >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter(gasto => gasto.data <= filters.endDate);
    }

    // Month filter
    if (selectedMonth) {
      filtered = filtered.filter(gasto => gasto.data.startsWith(selectedMonth));
    }

    setFilteredGastos(filtered);
  }, [gastos, filters, selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleDeleteGasto = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este gasto?')) return;

    try {
      await expenseService.deleteGasto(id);
      addToast({
        type: 'success',
        title: 'Sucesso',
        message: 'Gasto excluído com sucesso.',
      });
      loadData();
    } catch (error) {
      console.error('Error deleting gasto:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao excluir gasto.',
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

  const getTotalForSelectedPeriod = () => {
    return filteredGastos.reduce((sum, gasto) => sum + gasto.valor, 0);
  };

  const getSelectedMonthData = () => {
    return monthlyData.find(data => data.month === selectedMonth);
  };

  if (loading) {
    return (
      <PageLayout
        title="Gastos"
        subtitle="Carregando seus gastos..."
        icon={<DollarSign size={24} />}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Carregando gastos...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  const selectedMonthData = getSelectedMonthData();
  const totalForPeriod = getTotalForSelectedPeriod();

  return (
    <PageLayout
      title="Gastos"
      subtitle="Gerencie seus gastos e despesas pessoais"
      icon={<DollarSign size={24} />}
      actions={
        <div className="flex flex-wrap gap-2">
          <PrimaryButton
            size="sm"
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            icon={<Filter size={16} />}
          >
            <span className="hidden sm:inline">Filtros</span>
          </PrimaryButton>
          
          <PrimaryButton
            size="sm"
            variant="secondary"
            onClick={loadData}
            icon={<RefreshCw size={16} />}
          >
            <span className="hidden sm:inline">Atualizar</span>
          </PrimaryButton>
          
          <Link to="/gastos/adicionar">
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

        {/* Filters */}
        {showFilters && (
          <Card className="p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    type="text"
                    placeholder="Buscar por descrição..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoria
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Todas as categorias</option>
                  <option value="Alimentação">Alimentação</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Compras">Compras</option>
                  <option value="Moradia">Moradia</option>
                  <option value="Saúde">Saúde</option>
                  <option value="Entretenimento">Entretenimento</option>
                  <option value="Educação">Educação</option>
                  <option value="Serviços">Serviços</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Método de Pagamento
                </label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Todos os métodos</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Pix">Pix</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Transferência">Transferência</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data Inicial
                </label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data Final
                </label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mês
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Todos os meses</option>
                  {monthlyData.map((data) => (
                    <option key={data.month} value={data.month}>
                      {new Date(data.month + '-01').toLocaleDateString('pt-BR', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <PrimaryButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  setFilters({
                    search: '',
                    category: '',
                    paymentMethod: '',
                    startDate: '',
                    endDate: '',
                  });
                  setSelectedMonth('');
                }}
              >
                Limpar Filtros
              </PrimaryButton>
            </div>
          </Card>
        )}

        {/* Summary Stats */}
        <TwoColumnGrid className="mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                <DollarSign className="text-green-600 dark:text-green-400" size={24} />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {formatCurrency(totalForPeriod)}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Filtrado</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <BarChart3 className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {filteredGastos.length}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Transações</p>
            </div>
          </Card>

          {selectedMonthData && (
            <>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                    <Calendar className="text-purple-600 dark:text-purple-400" size={24} />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {formatCurrency(selectedMonthData.total)}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total do Mês</p>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                    <TrendingUp className="text-orange-600 dark:text-orange-400" size={24} />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {formatCurrency(selectedMonthData.count > 0 ? selectedMonthData.total / selectedMonthData.count : 0)}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Média Diária</p>
                </div>
              </Card>
            </>
          )}
        </TwoColumnGrid>

        {/* Expenses List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Lista de Gastos
            </h2>
            
            <div className="flex gap-2">
              <Link to="/recorrencias">
                <PrimaryButton variant="secondary" size="sm">
                  Gerenciar Recorrências
                </PrimaryButton>
              </Link>
            </div>
          </div>

          {filteredGastos.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {gastos.length === 0 
                  ? 'Nenhum gasto cadastrado ainda.'
                  : 'Nenhum gasto encontrado com os filtros aplicados.'
                }
              </p>
              <Link to="/gastos/adicionar">
                <PrimaryButton>
                  <Plus size={16} className="mr-2" />
                  Adicionar Primeiro Gasto
                </PrimaryButton>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGastos.map((gasto) => (
                <div
                  key={gasto.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {gasto.descricao}
                          {gasto.recorrenteId && (
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                              Recorrente
                            </span>
                          )}
                        </h3>
                        <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <span>📅 {formatDate(gasto.data)}</span>
                          <span>🏷️ {gasto.categoria}</span>
                          <span>💳 {gasto.metodoPagamento}</span>
                        </div>
                        {gasto.observacoes && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {gasto.observacoes}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                          {formatCurrency(gasto.valor)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link to={`/gastos/${gasto.id}/editar`}>
                      <PrimaryButton variant="secondary" size="sm">
                        <Edit2 size={16} />
                      </PrimaryButton>
                    </Link>
                    
                    <PrimaryButton
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDeleteGasto(gasto.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900"
                    >
                      <Trash2 size={16} />
                    </PrimaryButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
    </PageLayout>
  );
};

export default Gastos;
