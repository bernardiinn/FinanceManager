/**
 * Enhanced Home/Dashboard Page - Modern Design with Tailwind
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  CreditCard, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp as ChartLine,
  UserPlus,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  DollarSign,
  Calendar,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { PageLayout, Card } from '../components/ui/Layout';
import { PrimaryButton } from '../components/ui/FormComponents';
import PessoaCard from '../components/PessoaCard';
import { useAppData } from '../hooks';
import { financeService } from '../services/financeService';
import { expenseService } from '../services/expenseService';
import type { GastoSummary, RecurringSummary } from '../types';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  iconColor,
  iconBg,
  trend, 
  onClick 
}) => (
  <div 
    className={`transition-all duration-200 ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
    onClick={onClick}
  >
    <Card className="p-6 hover:shadow-lg">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${iconBg}`}>
        <div className={iconColor}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          trend.isPositive 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {trend.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend.value)}%
        </div>
      )}
    </div>
    <div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        {value}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
    </div>
  </Card>
  </div>
);

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  iconColor: string;
  iconBg: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ 
  title, 
  description, 
  icon, 
  to, 
  iconColor,
  iconBg
}) => (
  <Link to={to} className="block">
    <Card className="p-6 text-center transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800">
      <div className={`inline-flex p-4 rounded-xl ${iconBg} mb-4`}>
        <div className={iconColor}>
          {icon}
        </div>
      </div>
      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</p>
      <div className="inline-flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
        {title} <ArrowUpRight size={16} className="ml-1" />
      </div>
    </Card>
  </Link>
);

export default function Home() {
  const { pessoas } = useAppData();
  const [expenseSummary, setExpenseSummary] = useState<GastoSummary | null>(null);
  const [recurringSummary, setRecurringSummary] = useState<RecurringSummary | null>(null);
  
  useEffect(() => {
    // Load expense and recurring transaction data
    const loadData = async () => {
      try {
        // Process any pending recurring transactions
        await expenseService.processRecurringTransactions();
        
        // Get summaries
        const expenseData = await expenseService.getExpenseSummary();
        const recurringData = await expenseService.getAllRecorrencias();
        
        setExpenseSummary(expenseData || {});
        setRecurringSummary({
          total: (recurringData || []).length,
          active: (recurringData || []).filter(r => r?.ativo).length,
          monthlyEstimate: (recurringData || [])
            .filter(r => r?.ativo && r?.frequencia === 'Mensal')
            .reduce((sum, r) => sum + (r?.valor || 0), 0),
        });
      } catch (error) {
        console.error('Error loading expense data:', error);
      }
    };
    
    loadData();
  }, []);
  
  // Calculate summary data
  const totalPessoas = pessoas?.length || 0;
  const totalEmprestado = pessoas?.reduce((acc, p) => {
    const saldo = financeService.calcularSaldoPessoa(p);
    return acc + saldo.total;
  }, 0) || 0;
  
  const totalRecebido = pessoas?.reduce((acc, p) => {
    const saldo = financeService.calcularSaldoPessoa(p);
    return acc + saldo.paid;
  }, 0) || 0;
  
  const totalPendente = pessoas?.reduce((acc, p) => {
    const saldo = financeService.calcularSaldoPessoa(p);
    return acc + saldo.outstanding;
  }, 0) || 0;
  
  const pessoasComPendencia = pessoas?.filter(p => 
    financeService.calcularSaldoPessoa(p).outstanding > 0
  ) || [];

  // Loading state
  if (!pessoas) {
    return (
      <PageLayout title="Dashboard">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Empty state
  if (totalPessoas === 0) {
    return (
      <PageLayout title="Dashboard">
        <Card className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full inline-flex mb-6">
              <CreditCard size={48} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Bem-vindo ao Controle de Cartões!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Comece adicionando pessoas para controlar os cartões emprestados e acompanhar os pagamentos de forma organizada.
            </p>
            <Link to="/pessoas/adicionar">
              <PrimaryButton
                icon={<UserPlus size={20} />}
                className="px-8 py-3 text-lg"
              >
                Adicionar Primeira Pessoa
              </PrimaryButton>
            </Link>
          </div>
        </Card>
      </PageLayout>
    );
  }

  // Dashboard with data
  return (
    <PageLayout title="Dashboard">
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl text-gray-600 dark:text-gray-400 mb-2">
              Bem-vindo ao controle de cartões emprestados
            </h2>
            <p className="text-gray-500 dark:text-gray-500">
              Você tem {totalPessoas} {totalPessoas === 1 ? 'pessoa cadastrada' : 'pessoas cadastradas'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/pessoas/adicionar">
              <PrimaryButton
                icon={<UserPlus size={16} />}
                variant="secondary"
              >
                Nova Pessoa
              </PrimaryButton>
            </Link>
            <Link to="/emprestimos/adicionar">
              <PrimaryButton
                icon={<CreditCard size={16} />}
              >
                Novo Empréstimo
              </PrimaryButton>
            </Link>
          </div>
        </div>

        {/* Financial Overview Cards */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Resumo Financeiro</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Emprestado"
              value={`R$ ${totalEmprestado.toFixed(2)}`}
              icon={<CreditCard size={24} />}
              iconColor="text-blue-600 dark:text-blue-400"
              iconBg="bg-blue-100 dark:bg-blue-900/30"
            />
            <StatCard
              title="Total Recebido"
              value={`R$ ${totalRecebido.toFixed(2)}`}
              icon={<CheckCircle size={24} />}
              iconColor="text-green-600 dark:text-green-400"
              iconBg="bg-green-100 dark:bg-green-900/30"
              trend={{ 
                value: totalEmprestado > 0 ? Math.round((totalRecebido / totalEmprestado) * 100) : 0, 
                isPositive: true 
              }}
            />
            <StatCard
              title="Saldo Pendente"
              value={`R$ ${totalPendente.toFixed(2)}`}
              icon={totalPendente > 0 ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
              iconColor={totalPendente > 0 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}
              iconBg={totalPendente > 0 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-green-100 dark:bg-green-900/30"}
            />
            <StatCard
              title="Pessoas Ativas"
              value={pessoasComPendencia.length}
              icon={<Users size={24} />}
              iconColor="text-purple-600 dark:text-purple-400"
              iconBg="bg-purple-100 dark:bg-purple-900/30"
            />
          </div>
        </div>

        {/* Expense Overview Cards */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Controle de Gastos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Gastos do Mês"
              value={expenseSummary?.gastosMes ? `R$ ${expenseSummary.gastosMes.toFixed(2)}` : 'R$ 0,00'}
              icon={<DollarSign size={24} />}
              iconColor="text-red-600 dark:text-red-400"
              iconBg="bg-red-100 dark:bg-red-900/30"
            />
            <StatCard
              title="Gastos do Ano"
              value={expenseSummary?.gastosAno ? `R$ ${expenseSummary.gastosAno.toFixed(2)}` : 'R$ 0,00'}
              icon={<Calendar size={24} />}
              iconColor="text-orange-600 dark:text-orange-400"
              iconBg="bg-orange-100 dark:bg-orange-900/30"
            />
            <StatCard
              title="Recorrências Ativas"
              value={recurringSummary ? recurringSummary.active : 0}
              icon={<RefreshCw size={24} />}
              iconColor="text-blue-600 dark:text-blue-400"
              iconBg="bg-blue-100 dark:bg-blue-900/30"
            />
            <StatCard
              title="Estimativa Mensal"
              value={recurringSummary?.monthlyEstimate ? `R$ ${recurringSummary.monthlyEstimate.toFixed(2)}` : 'R$ 0,00'}
              icon={<TrendingUp size={24} />}
              iconColor="text-purple-600 dark:text-purple-400"
              iconBg="bg-purple-100 dark:bg-purple-900/30"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickAction
              title="Nova Pessoa"
              description="Adicionar uma nova pessoa à sua lista"
              icon={<UserPlus size={24} />}
              to="/pessoas/adicionar"
              iconColor="text-blue-600 dark:text-blue-400"
              iconBg="bg-blue-100 dark:bg-blue-900/30"
            />
            <QuickAction
              title="Novo Empréstimo"
              description="Adicionar um novo cartão ou empréstimo"
              icon={<CreditCard size={24} />}
              to="/emprestimos/adicionar"
              iconColor="text-purple-600 dark:text-purple-400"
              iconBg="bg-purple-100 dark:bg-purple-900/30"
            />
            <QuickAction
              title="Adicionar Gasto"
              description="Registrar uma nova despesa"
              icon={<DollarSign size={24} />}
              to="/gastos/adicionar"
              iconColor="text-red-600 dark:text-red-400"
              iconBg="bg-red-100 dark:bg-red-900/30"
            />
            <QuickAction
              title="Nova Recorrência"
              description="Configurar gasto automático"
              icon={<RefreshCw size={24} />}
              to="/recorrencias/adicionar"
              iconColor="text-green-600 dark:text-green-400"
              iconBg="bg-green-100 dark:bg-green-900/30"
            />
            <QuickAction
              title="Gerenciar Empréstimos"
              description="Controlar pagamentos e parcelas"
              icon={<ChartLine size={24} />}
              to="/emprestimos/gerenciar"
              iconColor="text-indigo-600 dark:text-indigo-400"
              iconBg="bg-indigo-100 dark:bg-indigo-900/30"
            />
            <QuickAction
              title="Ver Gastos"
              description="Acompanhar suas despesas"
              icon={<DollarSign size={24} />}
              to="/gastos"
              iconColor="text-amber-600 dark:text-amber-400"
              iconBg="bg-amber-100 dark:bg-amber-900/30"
            />
          </div>
        </div>

        {/* People with Outstanding Balance */}
        {pessoasComPendencia.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Com Pendências</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {pessoasComPendencia.length} {pessoasComPendencia.length === 1 ? 'pessoa' : 'pessoas'} com saldo pendente
                </p>
              </div>
              <Link to="/pessoas">
                <PrimaryButton variant="secondary" size="sm">
                  Ver Todas
                </PrimaryButton>
              </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pessoasComPendencia.slice(0, 4).map(pessoa => (
                <Link 
                  key={pessoa.id} 
                  to={`/pessoas/${pessoa.id}`}
                  className="block transition-transform duration-200 hover:scale-[1.02]"
                >
                  <PessoaCard pessoa={pessoa} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity Placeholder */}
        <Card className="p-8">
          <div className="text-center">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full inline-flex mb-4">
              <Activity size={32} className="text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Atividade Recente
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Funcionalidade de atividade recente será implementada em breve.
            </p>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
