import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  CreditCard,
  AlertTriangle,
  DollarSign,
  Download,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  Activity,
  Clock,
  RefreshCw,
  Tag,
  Calendar
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { PageLayout, TwoColumnGrid } from '../components/ui/Layout';
import { expenseService } from '../services/expenseService';
import { useFinancialSummary, useAppData } from '../hooks';

interface SimpleChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  type: 'bar' | 'pie';
  title?: string;
  subtitle?: string;
}

const SimpleChart: React.FC<SimpleChartProps> = ({ data, title, subtitle }) => {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <div className="w-full">
      <div className="mb-4">
        {title && (
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.label}
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                R$ {(item?.value || 0).toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: item.color || '#3B82F6',
                  width: `${(item.value / maxValue) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon, color }) => (
  <Card className="bg-white dark:bg-gray-800 p-6">
    <div className="flex items-center">
      <div className={`p-3 rounded-lg mr-4`} style={{ backgroundColor: color + '20' }}>
        <div style={{ color: color }}>
          {icon}
        </div>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {subtitle}
        </p>
      </div>
    </div>
  </Card>
);

interface ExpenseData {
  gastosPorCategoria: Array<{ categoria: string; total: number; count: number }>;
  gastosPorFormaPagamento: Array<{ forma: string; total: number; count: number }>;
  proximasRecorrencias: Array<{ nome: string; valor: number; proximaData: string; categoria: string; descricao: string }>;
  summary?: {
    gastosMes: number;
    mediaDiaria: number;
    totalGastos: number;
    recorrenciasAtivas: number;
  };
}

export default function Analytics() {
  const { pessoas } = useAppData();
  const summary = useFinancialSummary();
  const [activeTab, setActiveTab] = useState<'loans' | 'expenses'>('loans');
  const [expenseData, setExpenseData] = useState<ExpenseData>({
    gastosPorCategoria: [],
    gastosPorFormaPagamento: [],
    proximasRecorrencias: []
  });

  useEffect(() => {
    const loadExpenseData = async () => {
      try {
        const analytics = await expenseService.getExpenseSummary();
        setExpenseData(analytics as unknown as ExpenseData || {
          gastosPorCategoria: [],
          gastosPorFormaPagamento: [],
          proximasRecorrencias: []
        });
      } catch (error) {
        console.error('Erro ao carregar dados de gastos:', error);
        setExpenseData({
          gastosPorCategoria: [],
          gastosPorFormaPagamento: [],
          proximasRecorrencias: []
        });
      }
    };

    if (activeTab === 'expenses') {
      loadExpenseData();
    }
  }, [activeTab]);

  // Helper functions for colors
  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'Alimentação': '#EF4444',
      'Transporte': '#F59E0B',
      'Compras': '#8B5CF6',
      'Moradia': '#10B981',
      'Saúde': '#06B6D4',
      'Entretenimento': '#EC4899',
      'Educação': '#6366F1',
      'Serviços': '#84CC16',
      'Outros': '#6B7280',
    };
    return colors[category] || '#6B7280';
  };

  const getPaymentMethodColor = (method: string): string => {
    const colors: Record<string, string> = {
      'Dinheiro': '#10B981',
      'Cartão de Crédito': '#EF4444',
      'Cartão de Débito': '#F59E0B',
      'PIX': '#8B5CF6',
      'Transferência': '#06B6D4',
      'Outros': '#6B7280',
    };
    return colors[method] || '#6B7280';
  };

  // Safe data processing with proper Cartao type handling
  const peopleData = pessoas.map(pessoa => ({
    label: pessoa.nome,
    value: pessoa.cartoes.reduce((sum, cartao) => {
      const totalAmount = cartao.valor_total || 0;
      const paidInstallments = cartao.parcelas_pagas || 0;
      const totalInstallments = cartao.numero_de_parcelas || 1;
      const installmentAmount = totalAmount / totalInstallments;
      const remaining = totalAmount - (paidInstallments * installmentAmount);
      return sum + Math.max(0, remaining);
    }, 0),
  })).filter(item => item.value > 0).sort((a, b) => b.value - a.value);

  // Safe overdue data processing
  const overdueData = pessoas.flatMap(pessoa =>
    pessoa.cartoes.filter(cartao => {
      const paidInstallments = cartao.parcelas_pagas || 0;
      const totalInstallments = cartao.numero_de_parcelas || 1;
      return paidInstallments < totalInstallments && cartao.status !== 'completed';
    }).map(cartao => ({
      label: `${pessoa.nome} - ${cartao.descricao}`,
      value: (cartao.valor_total || 0) - ((cartao.parcelas_pagas || 0) * ((cartao.valor_total || 0) / (cartao.numero_de_parcelas || 1))),
      color: '#EF4444',
    }))
  );

  const statusData = [
    {
      label: 'Empréstimos Ativos',
      value: summary?.activeLoans || 0,
      color: '#3B82F6',
    },
    {
      label: 'Cartões Quitados',
      value: summary?.completedLoans || 0,
      color: '#10B981',
    },
    {
      label: 'Cartões em Atraso',
      value: summary?.overdueLoans || 0,
      color: '#EF4444',
    },
  ].filter(item => item.value > 0);

  const paymentRate = (summary?.totalDebt || 0) > 0 
    ? (((summary?.totalPaid || 0) / (summary?.totalDebt || 1)) * 100).toFixed(1) 
    : '0';

  const avgDebtPerPerson = pessoas.length > 0 
    ? (summary?.totalRemaining || 0) / pessoas.length 
    : 0;

  return (
    <PageLayout
      title="Relatórios e Análises"
      subtitle="Insights financeiros sobre seus empréstimos e gastos"
      icon={<BarChart3 size={24} />}
      actions={
        <button className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center gap-2">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Exportar</span>
        </button>
      }
    >
      <div className="space-y-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('loans')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'loans'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <CreditCard className="w-4 h-4 inline mr-2" />
              Empréstimos
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'expenses'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              Gastos
            </button>
          </nav>
        </div>

        {/* Loans Tab Content */}
        {activeTab === 'loans' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <TwoColumnGrid>
              <MetricCard
                title="Taxa de Recebimento"
                value={`${paymentRate}%`}
                subtitle="Do total emprestado"
                icon={<TrendingUp />}
                color="#10B981"
                trend="up"
              />
              <MetricCard
                title="Média por Pessoa"
                value={`R$ ${avgDebtPerPerson.toFixed(2).replace('.', ',')}`}
                subtitle="Pendência média"
                icon={<Users />}
                color="#F59E0B"
              />
              <MetricCard
                title="Total de Empréstimos"
                value={pessoas.reduce((sum, p) => sum + p.cartoes.length, 0).toString()}
                subtitle="Todos os empréstimos"
                icon={<CreditCard />}
                color="#3B82F6"
              />
              <MetricCard
                title="Total Pendente"
                value={`R$ ${(summary.totalRemaining || 0).toFixed(2).replace('.', ',')}`}
                subtitle="Valor em aberto"
                icon={<AlertTriangle />}
                color="#EF4444"
              />
            </TwoColumnGrid>

            {/* Charts Section */}
            <TwoColumnGrid>
              {/* Devedores */}
              <Card className="bg-white dark:bg-gray-800 p-6">
                <SimpleChart
                  data={peopleData.slice(0, 5)}
                  type="bar"
                  title="Maiores Devedores"
                  subtitle="Top 5 pessoas com maior saldo devedor"
                />
              </Card>

              {/* Status dos Empréstimos */}
              <Card className="bg-white dark:bg-gray-800 p-6">
                <SimpleChart
                  data={statusData}
                  type="pie"
                  title="Status dos Empréstimos"
                  subtitle="Distribuição por situação"
                />
              </Card>
            </TwoColumnGrid>

            {/* Cartões em Atraso */}
            {overdueData.length > 0 && (
              <Card className="bg-white dark:bg-gray-800 p-6">
                <div className="flex items-center mb-6">
                  <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Cartões em Atraso
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Empréstimos que passaram do vencimento
                    </p>
                  </div>
                </div>
                <SimpleChart
                  data={overdueData}
                  type="bar"
                />
              </Card>
            )}

            {/* Insights e Alertas */}
            <Card className="bg-white dark:bg-gray-800 p-6">
              <div className="flex items-center mb-6">
                <Activity className="w-6 h-6 text-blue-500 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Insights Financeiros
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Pontos de atenção identificados
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {(summary?.overdueLoans || 0) > 0 && (
                  <div className="flex items-start p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        {(summary?.overdueLoans || 0)} empréstimo(s) em atraso
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                        Considere entrar em contato com os devedores
                      </p>
                    </div>
                  </div>
                )}

                {(summary?.totalRemaining || 0) > (summary?.totalPaid || 0) && (
                  <div className="flex items-start p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Valor pendente maior que recebido
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                        R$ {((summary.totalRemaining || 0) - (summary.totalPaid || 0)).toFixed(2).replace('.', ',')} ainda em aberto
                      </p>
                    </div>
                  </div>
                )}

                {peopleData.length > 0 && peopleData[0].value > 1000 && (
                  <div className="flex items-start p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Maior devedor: {peopleData[0].label}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                        R$ {(peopleData[0]?.value || 0).toFixed(2).replace('.', ',')} em aberto
                      </p>
                    </div>
                  </div>
                )}

                {parseFloat(paymentRate) < 30 && (
                  <div className="flex items-start p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                        Taxa de recebimento baixa
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                        Apenas {paymentRate}% do valor emprestado foi recebido
                      </p>
                    </div>
                  </div>
                )}

                {(summary?.overdueLoans || 0) === 0 && (summary?.totalRemaining || 0) <= (summary?.totalPaid || 0) && (!peopleData.length || peopleData[0].value <= 1000) && parseFloat(paymentRate) > 30 && (
                  <div className="flex items-center justify-center py-8">
                    <CheckCircle2 className="w-6 h-6 text-green-500 mr-2" />
                    <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                      Situação financeira saudável! Nenhum ponto de atenção identificado.
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Expenses Tab Content */}
        {activeTab === 'expenses' && expenseData && (
          <div className="space-y-8">
            {/* Expense Key Metrics */}
            <TwoColumnGrid>
              <MetricCard
                title="Gastos do Mês"
                value={`R$ ${(expenseData?.summary?.gastosMes || 0).toFixed(2).replace('.', ',')}`}
                subtitle="Total gasto este mês"
                icon={<DollarSign />}
                color="#EF4444"
              />
              <MetricCard
                title="Média Diária"
                value={`R$ ${(expenseData?.summary?.mediaDiaria || 0).toFixed(2).replace('.', ',')}`}
                subtitle="Gasto médio por dia"
                icon={<Calendar />}
                color="#F59E0B"
              />
              <MetricCard
                title="Total de Gastos"
                value={(expenseData?.summary?.totalGastos || 0).toString()}
                subtitle="Gastos registrados"
                icon={<Tag />}
                color="#3B82F6"
              />
              <MetricCard
                title="Recorrências Ativas"
                value={(expenseData?.summary?.recorrenciasAtivas || 0).toString()}
                subtitle="Transações automáticas"
                icon={<RefreshCw />}
                color="#10B981"
              />
            </TwoColumnGrid>

            {/* Expense Charts */}
            <TwoColumnGrid>
              {/* Gastos por Categoria */}
              <Card className="bg-white dark:bg-gray-800 p-6">
                <SimpleChart
                  data={(expenseData?.gastosPorCategoria || []).map((item: { categoria: string; total: number; count: number }) => ({
                    label: item.categoria,
                    value: item.total,
                    color: getCategoryColor(item.categoria)
                  }))}
                  type="bar"
                  title="Gastos por Categoria"
                  subtitle="Distribuição dos gastos por categoria"
                />
              </Card>

              {/* Gastos por Forma de Pagamento */}
              <Card className="bg-white dark:bg-gray-800 p-6">
                <SimpleChart
                  data={(expenseData?.gastosPorFormaPagamento || []).map((item: { forma: string; total: number; count: number }) => ({
                    label: item.forma,
                    value: item.total,
                    color: getPaymentMethodColor(item.forma)
                  }))}
                  type="bar"
                  title="Gastos por Forma de Pagamento"
                  subtitle="Como você tem gasto mais"
                />
              </Card>
            </TwoColumnGrid>

            {/* Recorrências Próximas */}
            {expenseData?.proximasRecorrencias && expenseData.proximasRecorrencias.length > 0 && (
              <Card className="bg-white dark:bg-gray-800 p-6">
                <div className="flex items-center mb-6">
                  <Clock className="w-6 h-6 text-blue-500 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Próximas Recorrências
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Transações automáticas dos próximos 7 dias
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {(expenseData?.proximasRecorrencias || []).map((rec: { nome: string; valor: number; proximaData: string; categoria: string; descricao: string }, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: getCategoryColor(rec.categoria) }}></div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{rec.descricao}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{rec.categoria}</p>
                        </div>
                      </div>
                      <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                        R$ {(rec?.valor || 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* No Expenses State */}
        {activeTab === 'expenses' && !expenseData && (
          <Card className="bg-white dark:bg-gray-800 p-12">
            <div className="text-center">
              <div className="mb-6">
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full inline-flex">
                  <DollarSign className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Nenhum gasto registrado
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Adicione gastos para visualizar relatórios e análises detalhadas.
              </p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                Adicionar Primeiro Gasto
              </button>
            </div>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
