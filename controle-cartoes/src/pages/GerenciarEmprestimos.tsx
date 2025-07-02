import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search,
  SortAsc,
  SortDesc,
  Calendar,
  DollarSign,
  CreditCard,
  User,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  Eye,
  Edit,
  Check,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PageLayout, Card } from '../components/ui/Layout';
import { PrimaryButton } from '../components/ui/FormComponents';
import Input from '../components/ui/Input';
import { useAppData, usePaymentTracking } from '../hooks';
import type { Cartao, Installment } from '../types';

interface LoanWithPerson extends Cartao {
  pessoaNome: string;
  nextInstallment?: Installment | null;
  overdueInstallments: number;
}

type SortField = 'pessoa' | 'valor' | 'vencimento' | 'status' | 'banco';
type SortDirection = 'asc' | 'desc';
type FilterStatus = 'all' | 'active' | 'completed' | 'overdue';

export default function GerenciarEmprestimos() {
  const { pessoas, reloadFromStorage } = useAppData();
  const { 
    markInstallmentAsPaid, 
    markInstallmentAsUnpaid, 
    getNextInstallment, 
    getOverdueInstallmentsCount
  } = usePaymentTracking();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('vencimento');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [expandedLoans, setExpandedLoans] = useState<string[]>([]);
  const [processingPayments, setProcessingPayments] = useState<Set<string>>(new Set());
  const [, setRefreshTrigger] = useState(0);

  // Transform loans data with person information and auto-generate missing installments
  const allLoans: LoanWithPerson[] = useMemo(() => {
    if (!pessoas) return [];
    
    let needsUpdate = false;
    const processedPessoas = pessoas.map(pessoa => {
      const processedCartoes = pessoa.cartoes.map(cartao => {
        // Auto-generate installments if they don't exist
        if (!cartao.installments || cartao.installments.length === 0) {
          needsUpdate = true;
          
          // Generate installments based on loan details
          const installments = [];
          const installmentAmount = cartao.valor_total / cartao.numero_de_parcelas;
          const firstDueDate = new Date(cartao.data_compra || new Date());
          
          for (let i = 1; i <= cartao.numero_de_parcelas; i++) {
            const dueDate = new Date(firstDueDate);
            dueDate.setMonth(dueDate.getMonth() + (i - 1));
            dueDate.setDate(cartao.dueDay || 5); // Default to 5th of month
            
            installments.push({
              id: `${cartao.id}-installment-${i}`,
              number: i,
              amount: installmentAmount,
              dueDate: dueDate.toISOString(),
              isPaid: i <= cartao.parcelas_pagas, // Mark as paid if within paid count
              paidDate: i <= cartao.parcelas_pagas ? new Date().toISOString() : undefined
            });
          }
          
          return {
            ...cartao,
            installments
          };
        }
        return cartao;
      });
      
      return {
        ...pessoa,
        cartoes: processedCartoes
      };
    });
    
    // Update the data immediately if we generated any installments
    if (needsUpdate) {
      // Mark that we've updated the data - the refreshData will be called by the component
      console.log('Generated missing installments for loans');
    }
    
    return processedPessoas.flatMap(pessoa => 
      pessoa.cartoes.map(cartao => ({
        ...cartao,
        pessoaNome: pessoa.nome,
        nextInstallment: getNextInstallment(cartao),
        overdueInstallments: getOverdueInstallmentsCount(cartao)
      }))
    );
  }, [pessoas, getNextInstallment, getOverdueInstallmentsCount]);

  // Filter and sort loans
  const filteredAndSortedLoans = useMemo(() => {
    const filtered = allLoans.filter(loan => {
      // Search filter
      const matchesSearch = loan.pessoaNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           loan.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           loan.cardProvider?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // Status filter
      switch (filterStatus) {
        case 'active':
          return loan.status === 'active' && loan.parcelas_pagas < loan.numero_de_parcelas;
        case 'completed':
          return loan.parcelas_pagas >= loan.numero_de_parcelas;
        case 'overdue':
          return loan.overdueInstallments > 0;
        default:
          return true;
      }
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number, bValue: string | number;
      
      switch (sortField) {
        case 'pessoa':
          aValue = a.pessoaNome;
          bValue = b.pessoaNome;
          break;
        case 'valor':
          aValue = a.valor_total;
          bValue = b.valor_total;
          break;
        case 'vencimento':
          aValue = a.nextInstallment?.dueDate || '9999-12-31';
          bValue = b.nextInstallment?.dueDate || '9999-12-31';
          break;
        case 'status':
          aValue = a.parcelas_pagas >= a.numero_de_parcelas ? 2 : a.overdueInstallments > 0 ? 0 : 1;
          bValue = b.parcelas_pagas >= b.numero_de_parcelas ? 2 : b.overdueInstallments > 0 ? 0 : 1;
          break;
        case 'banco':
          aValue = a.cardProvider?.name || '';
          bValue = b.cardProvider?.name || '';
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [allLoans, searchTerm, sortField, sortDirection, filterStatus]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusConfig = (loan: LoanWithPerson) => {
    if (loan.parcelas_pagas >= loan.numero_de_parcelas) {
      return {
        label: 'Quitado',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        icon: <CheckCircle size={14} />
      };
    }
    if (loan.overdueInstallments > 0) {
      return {
        label: 'Em Atraso',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        icon: <AlertTriangle size={14} />
      };
    }
    return {
      label: 'Ativo',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      icon: <Clock size={14} />
    };
  };

  const summary = useMemo(() => {
    const total = allLoans.length;
    const active = allLoans.filter(l => l.status === 'active' && l.parcelas_pagas < l.numero_de_parcelas).length;
    const completed = allLoans.filter(l => l.parcelas_pagas >= l.numero_de_parcelas).length;
    const overdue = allLoans.filter(l => l.overdueInstallments > 0).length;
    const totalValue = allLoans.reduce((sum, l) => sum + l.valor_total, 0);
    const receivedValue = allLoans.reduce((sum, l) => sum + (l.valor_total * l.parcelas_pagas / l.numero_de_parcelas), 0);
    
    return { total, active, completed, overdue, totalValue, receivedValue };
  }, [allLoans]);

  const toggleLoanExpansion = (loanId: string) => {
    setExpandedLoans(prev => 
      prev.includes(loanId) 
        ? prev.filter(id => id !== loanId)
        : [...prev, loanId]
    );
  };

  const handleMarkInstallmentPaid = async (cartaoId: string, installmentNumber: number) => {
    const paymentKey = `${cartaoId}-${installmentNumber}`;
    
    // Check if the loan and installment exist
    const loan = allLoans.find(l => l.id === cartaoId);
    if (!loan?.installments) {
      console.error('❌ [Payment] Loan or installments not found:', cartaoId);
      return;
    }
    
    const installment = loan.installments.find(i => i.number === installmentNumber);
    if (!installment || installment.isPaid) {
      return; // Silent fail - installment already paid or not found
    }
    
    setProcessingPayments(prev => new Set(prev).add(paymentKey));
    
    try {
      await markInstallmentAsPaid(cartaoId, installmentNumber);
      
      // Force UI refresh
      setRefreshTrigger(prev => prev + 1);
      
      // Force a reload from database after a small delay
      setTimeout(() => {
        reloadFromStorage();
        setRefreshTrigger(prev => prev + 1);
      }, 50);
      
      // Clean up processing state
      setTimeout(() => {
        setProcessingPayments(prev => {
          const next = new Set(prev);
          next.delete(paymentKey);
          return next;
        });
      }, 200);
    } catch (error) {
      console.error('❌ [Payment] Error marking installment as paid:', error);
      setProcessingPayments(prev => {
        const next = new Set(prev);
        next.delete(paymentKey);
        return next;
      });
    }
  };

  const handleMarkInstallmentUnpaid = async (cartaoId: string, installmentNumber: number) => {
    const paymentKey = `${cartaoId}-${installmentNumber}`;
    
    // Check if the installment exists and is currently paid
    const loan = allLoans.find(l => l.id === cartaoId);
    if (!loan?.installments) {
      console.error('❌ [Payment Reversal] Loan not found:', cartaoId);
      return;
    }
    
    const installment = loan.installments.find(i => i.number === installmentNumber);
    if (!installment || !installment.isPaid) {
      return; // Silent fail - installment already unpaid or not found
    }
    
    setProcessingPayments(prev => new Set(prev).add(paymentKey));
    
    try {
      await markInstallmentAsUnpaid(cartaoId, installmentNumber);
      
      // Force UI refresh
      setRefreshTrigger(prev => prev + 1);
      
      // Force a reload from database
      setTimeout(() => {
        reloadFromStorage();
        setRefreshTrigger(prev => prev + 1);
      }, 50);
      
      // Clean up processing state
      setTimeout(() => {
        setProcessingPayments(prev => {
          const next = new Set(prev);
          next.delete(paymentKey);
          return next;
        });
      }, 100);
    } catch (error) {
      console.error('❌ [Payment Reversal] Error marking installment as unpaid:', error);
      setProcessingPayments(prev => {
        const next = new Set(prev);
        next.delete(paymentKey);
        return next;
      });
    }
  };

  return (
    <PageLayout
      title="Gerenciar Empréstimos"
      subtitle="Acompanhe todos os empréstimos, pagamentos e vencimentos"
      icon={<CreditCard size={24} />}
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <Card className="p-4 lg:p-6">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="p-2 lg:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                <CreditCard size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.total}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 lg:p-6">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="p-2 lg:p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex-shrink-0">
                <Clock size={20} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.active}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ativos</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 lg:p-6">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="p-2 lg:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.completed}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Quitados</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 lg:p-6">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="p-2 lg:p-3 bg-red-100 dark:bg-red-900/30 rounded-lg flex-shrink-0">
                <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.overdue}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Em Atraso</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Emprestado</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  R$ {summary.totalValue.toFixed(2)}
                </p>
              </div>
              <DollarSign size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Recebido</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  R$ {summary.receivedValue.toFixed(2)}
                </p>
              </div>
              <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
            </div>
          </Card>
        </div>

        {/* Controls */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Buscar por pessoa, descrição ou banco..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startIcon={<Search size={16} />}
              />
            </div>
            
            {/* Filter */}
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativos</option>
                <option value="completed">Quitados</option>
                <option value="overdue">Em Atraso</option>
              </select>
              
              <Link to="/emprestimos/adicionar">
                <PrimaryButton icon={<Plus size={16} />}>
                  Novo Empréstimo
                </PrimaryButton>
              </Link>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm text-gray-600 dark:text-gray-400 self-center">Ordenar por:</span>
            <button
              onClick={() => handleSort('pessoa')}
              className={`px-3 py-1 text-sm rounded-lg flex items-center gap-1 transition-colors ${
                sortField === 'pessoa' 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <User size={14} />
              Pessoa
              {sortField === 'pessoa' && (sortDirection === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />)}
            </button>
            <button
              onClick={() => handleSort('valor')}
              className={`px-3 py-1 text-sm rounded-lg flex items-center gap-1 transition-colors ${
                sortField === 'valor' 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <DollarSign size={14} />
              Valor
              {sortField === 'valor' && (sortDirection === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />)}
            </button>
            <button
              onClick={() => handleSort('vencimento')}
              className={`px-3 py-1 text-sm rounded-lg flex items-center gap-1 transition-colors ${
                sortField === 'vencimento' 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Calendar size={14} />
              Vencimento
              {sortField === 'vencimento' && (sortDirection === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />)}
            </button>
            <button
              onClick={() => handleSort('status')}
              className={`px-3 py-1 text-sm rounded-lg flex items-center gap-1 transition-colors ${
                sortField === 'status' 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Status
              {sortField === 'status' && (sortDirection === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />)}
            </button>
          </div>

          {/* Loans Cards */}
          <div className="space-y-4">
            {filteredAndSortedLoans.map((loan) => {
              const statusConfig = getStatusConfig(loan);
              const completionPercentage = (loan.parcelas_pagas / loan.numero_de_parcelas) * 100;
              
              return (
                <div key={loan.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Main Card Content */}
                  <div className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Left: Person & Bank Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-gray-500 dark:text-gray-400" />
                            <span className="font-medium text-gray-900 dark:text-gray-100">{loan.pessoaNome}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {loan.cardProvider && (
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: loan.cardProvider.color }}
                              />
                            )}
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {loan.cardProvider?.name || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {loan.descricao}
                        </div>
                        {loan.categoria && (
                          <div className="text-xs text-gray-500 dark:text-gray-500">{loan.categoria}</div>
                        )}
                      </div>

                      {/* Center: Value & Progress */}
                      <div className="flex-1 min-w-0">
                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                          {loan.currency === 'BRL' ? 'R$' : loan.currency} {loan.valor_total.toFixed(2)}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {loan.parcelas_pagas}/{loan.numero_de_parcelas} parcelas
                          </span>
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${completionPercentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {Math.round(completionPercentage)}%
                          </span>
                        </div>
                      </div>

                      {/* Right: Status & Next Payment */}
                      <div className="flex-shrink-0">
                        <div className="flex flex-col items-end gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color} ${statusConfig.bgColor}`}>
                            {statusConfig.icon}
                            {statusConfig.label}
                          </span>
                          {loan.nextInstallment && (
                            <div className="text-right">
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                {new Date(loan.nextInstallment.dueDate).toLocaleDateString('pt-BR')}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                R$ {(loan.nextInstallment?.amount || 0).toFixed(2)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <button 
                        onClick={() => toggleLoanExpansion(loan.id)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        {expandedLoans.includes(loan.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        {expandedLoans.includes(loan.id) ? 'Ocultar parcelas' : 'Ver parcelas'}
                      </button>
                      
                      <div className="flex items-center gap-2">
                        {loan.nextInstallment && (
                          <button
                            onClick={() => handleMarkInstallmentPaid(loan.id, loan.nextInstallment!.number)}
                            disabled={processingPayments.has(`${loan.id}-${loan.nextInstallment.number}`)}
                            className="flex items-center gap-1 px-3 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50"
                            title="Marcar próxima parcela como paga"
                          >
                            {processingPayments.has(`${loan.id}-${loan.nextInstallment.number}`) ? (
                              <div className="w-3.5 h-3.5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Check size={14} />
                            )}
                            Pagar
                          </button>
                        )}
                        <Link to={`/emprestimos/${loan.id}`}>
                          <button className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                            <Eye size={14} />
                            Detalhes
                          </button>
                        </Link>
                        <Link to={`/emprestimos/${loan.id}/editar`}>
                          <button className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <Edit size={14} />
                            Editar
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Expanded installment details */}
                  {expandedLoans.includes(loan.id) && loan.installments && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                        Detalhes das Parcelas
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {loan.installments.map(installment => {
                          const isOverdue = !installment.isPaid && new Date(installment.dueDate) < new Date();
                          const paymentKey = `${loan.id}-${installment.number}`;
                          const isProcessing = processingPayments.has(paymentKey);
                          
                          return (
                            <div
                              key={installment.id}
                              className={`p-3 rounded-lg border transition-all duration-200 ${
                                installment.isPaid 
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                  : isOverdue
                                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                              } ${isProcessing ? 'scale-105 shadow-md' : ''}`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    #{installment.number}
                                  </span>
                                  {installment.isPaid && !isProcessing && (
                                    <CheckCircle size={14} className="text-green-600 dark:text-green-400" />
                                  )}
                                  {isOverdue && !installment.isPaid && (
                                    <AlertTriangle size={14} className="text-red-600 dark:text-red-400" />
                                  )}
                                  {isProcessing && (
                                    <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  {installment.isPaid ? (
                                    <button
                                      onClick={() => handleMarkInstallmentUnpaid(loan.id, installment.number)}
                                      disabled={isProcessing}
                                      className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                                      title="Marcar como não paga"
                                    >
                                      <X size={12} />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleMarkInstallmentPaid(loan.id, installment.number)}
                                      disabled={isProcessing}
                                      className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors disabled:opacity-50"
                                      title="Marcar como paga"
                                    >
                                      <Check size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm">
                                <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                                  R$ {(installment?.amount || 0).toFixed(2)}
                                </div>
                                <div className="text-gray-600 dark:text-gray-400 text-xs">
                                  {new Date(installment.dueDate).toLocaleDateString('pt-BR')}
                                </div>
                                {installment.isPaid && installment.paidDate && (
                                  <div className="text-green-600 dark:text-green-400 text-xs mt-1 flex items-center gap-1">
                                    <CheckCircle size={10} />
                                    Pago em {new Date(installment.paidDate).toLocaleDateString('pt-BR')}
                                  </div>
                                )}
                                {isOverdue && !installment.isPaid && (
                                  <div className="text-red-600 dark:text-red-400 text-xs mt-1 flex items-center gap-1">
                                    <AlertTriangle size={10} />
                                    {Math.floor((new Date().getTime() - new Date(installment.dueDate).getTime()) / (1000 * 60 * 60 * 24))} dias de atraso
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {filteredAndSortedLoans.length === 0 && (
              <div className="text-center py-12">
                <CreditCard size={48} className="text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Nenhum empréstimo encontrado
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Tente ajustar os filtros de busca'
                    : 'Comece adicionando seu primeiro empréstimo'
                  }
                </p>
                {!searchTerm && filterStatus === 'all' && (
                  <Link to="/emprestimos/adicionar">
                    <PrimaryButton icon={<Plus size={16} />}>
                      Adicionar Empréstimo
                    </PrimaryButton>
                  </Link>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
