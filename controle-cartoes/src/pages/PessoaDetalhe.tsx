import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { 
  Edit3, 
  Plus, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Trash2,
  Calendar,
  DollarSign,
  User,
  Mail,
  Phone,
  FileText
} from 'lucide-react';
import { PageLayout, Card } from '../components/ui/Layout';
import { PrimaryButton } from '../components/ui/FormComponents';
import { Button } from '../components/ui/Button';
import { useAppData } from '../hooks';
import { financeService } from '../services/financeService';

export default function PessoaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pessoas, deletePessoa, reloadFromStorage } = useAppData();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadPessoa = useCallback(() => {
    // Only reload if we don't have data or if the specific person is not found
    if (!pessoas || pessoas.length === 0 || !pessoas.find(p => p.id === id)) {
      reloadFromStorage();
    }
  }, [pessoas, id, reloadFromStorage]);

  // Only reload when the component mounts or when the ID changes
  useEffect(() => {
    loadPessoa();
  }, [loadPessoa]);

  const pessoa = pessoas.find(p => p.id === id);

  if (!pessoa) {
    return (
      <PageLayout
        title="Pessoa não encontrada"
        subtitle="A pessoa que você está procurando não existe ou foi removida"
        icon={<AlertTriangle size={24} />}
        backTo="/pessoas"
        backLabel="Voltar para Pessoas"
      >
        <Card className="p-8 text-center">
          <AlertTriangle size={48} className="text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Pessoa não encontrada
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            A pessoa que você está procurando não existe ou foi removida.
          </p>
          <div className="space-y-2 text-sm text-gray-500 dark:text-gray-500">
            <p>ID procurado: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{id}</code></p>
            <p>IDs disponíveis: {pessoas.length > 0 ? pessoas.map(p => p.id).join(', ') : 'Nenhum'}</p>
          </div>
        </Card>
      </PageLayout>
    );
  }

  // Calculate person's financial summary with error handling
  let saldoSummary;
  try {
    saldoSummary = financeService.calcularSaldoPessoa(pessoa);
  } catch {
    // Provide fallback values
    saldoSummary = {
      id: pessoa.id,
      name: pessoa.nome,
      totalLent: 0,
      total: 0,
      totalReceived: 0,
      paid: 0,
      outstanding: 0,
      cardsCount: pessoa.cartoes?.length || 0,
      totalCards: pessoa.cartoes?.length || 0,
      activeCards: 0,
      completedCards: 0,
      overdueCards: 0,
    };
  }
  
  let riskLevel;
  try {
    riskLevel = financeService.calcularNivelRisco(pessoa);
  } catch (error) {
    console.error(`❌ [PessoaDetalhe] Error calculating risk level:`, error);
    riskLevel = 'low'; // Safe fallback
  }

  const handleDelete = () => {
    deletePessoa(pessoa.id);
    navigate('/pessoas');
  };

  const getRiskIcon = (risk: string) => {
    const iconClass = risk === 'high' ? 'text-red-600 dark:text-red-400' :
                     risk === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                     'text-green-600 dark:text-green-400';
    
    switch (risk) {
      case 'high': return <XCircle size={20} className={iconClass} />;
      case 'medium': return <AlertTriangle size={20} className={iconClass} />;
      case 'low': return <CheckCircle size={20} className={iconClass} />;
      default: return <CheckCircle size={20} className={iconClass} />;
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'high': return 'Alto';
      case 'medium': return 'Médio';
      case 'low': return 'Baixo';
      default: return 'Desconhecido';
    }
  };

  return (
    <PageLayout
      title={pessoa.nome}
      subtitle="Detalhes e empréstimos desta pessoa"
      icon={<User size={24} />}
      backTo="/pessoas"
      backLabel="Voltar para Pessoas"
      actions={
        <div className="flex items-center gap-3">
          <Link to={`/pessoas/${pessoa.id}/editar`}>
            <Button variant="secondary" icon={<Edit3 size={16} />}>
              Editar
            </Button>
          </Link>
          <Button 
            variant="danger" 
            icon={<Trash2 size={16} />}
            onClick={() => setShowDeleteConfirm(true)}
            disabled={saldoSummary.totalCards > 0}
          >
            Excluir
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Person Information Card */}
        <Card className="p-6">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User size={32} className="text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                {pessoa.nome}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pessoa.email && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Mail size={16} />
                    <span className="truncate">{pessoa.email}</span>
                  </div>
                )}
                {pessoa.telefone && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Phone size={16} />
                    <span>{pessoa.telefone}</span>
                  </div>
                )}
                {pessoa.observacoes && (
                  <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400 md:col-span-2 lg:col-span-1">
                    <FileText size={16} className="mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{pessoa.observacoes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <Card className="p-4 lg:p-6">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="p-2 lg:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                <DollarSign size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  R$ {saldoSummary.outstanding.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">A Receber</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 lg:p-6">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="p-2 lg:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                <CreditCard size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {saldoSummary.totalCards}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 lg:p-6">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="p-2 lg:p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex-shrink-0">
                <Calendar size={20} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {saldoSummary.activeCards}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ativos</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 lg:p-6">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className={`p-2 lg:p-3 rounded-lg flex-shrink-0 ${
                riskLevel === 'high' ? 'bg-red-100 dark:bg-red-900/30' :
                riskLevel === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                'bg-green-100 dark:bg-green-900/30'
              }`}>
                {getRiskIcon(riskLevel)}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xl lg:text-2xl font-bold ${
                  riskLevel === 'high' ? 'text-red-600 dark:text-red-400' :
                  riskLevel === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  {getRiskLabel(riskLevel)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Risco</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Ações Rápidas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to={`/emprestimos/adicionar?pessoa=${pessoa.id}`}>
              <PrimaryButton variant="primary" className="w-full justify-center" icon={<Plus size={16} />}>
                Novo Empréstimo
              </PrimaryButton>
            </Link>
            <Link to={`/cartoes/adicionar?pessoa=${pessoa.id}`}>
              <PrimaryButton variant="secondary" className="w-full justify-center" icon={<CreditCard size={16} />}>
                Adicionar Cartão
              </PrimaryButton>
            </Link>
          </div>
        </Card>

        {/* Loans Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Empréstimos ({saldoSummary.totalCards})
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gerencie todos os empréstimos desta pessoa
              </p>
            </div>
            {saldoSummary.completedCards > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                <CheckCircle size={14} />
                {saldoSummary.completedCards} quitado{saldoSummary.completedCards > 1 ? 's' : ''}
              </div>
            )}
          </div>

          {pessoa.cartoes.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard size={48} className="text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Nenhum empréstimo encontrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Esta pessoa ainda não possui empréstimos registrados.
              </p>
              <Link to={`/emprestimos/adicionar?pessoa=${pessoa.id}`}>
                <PrimaryButton variant="primary" icon={<Plus size={16} />}>
                  Adicionar Primeiro Empréstimo
                </PrimaryButton>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {pessoa.cartoes.map(cartao => (
                <div key={cartao.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {cartao.descricao}
                        </h4>
                        {cartao.cardProvider && (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cartao.cardProvider.color }}
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {cartao.cardProvider.name}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                        <span>R$ {(cartao.valor_total || 0).toFixed(2)}</span>
                        <span>{cartao.parcelas_pagas || 0}/{cartao.numero_de_parcelas || 0} parcelas</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (cartao.parcelas_pagas || 0) >= (cartao.numero_de_parcelas || 0)
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        }`}>
                          {cartao.parcelas_pagas >= cartao.numero_de_parcelas ? 'Quitado' : 'Ativo'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to={`/emprestimos/${cartao.id}`}>
                        <Button variant="secondary" size="sm">
                          Ver Detalhes
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Confirmar Exclusão
              </h3>
            </div>
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Tem certeza que deseja excluir <strong>{pessoa.nome}</strong>?
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Esta ação não pode ser desfeita.
                {saldoSummary.totalCards > 0 && (
                  <span className="block mt-2 text-red-600 dark:text-red-400 font-medium">
                    ⚠️ Não é possível excluir uma pessoa que possui empréstimos ativos.
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </Button>
              <Button 
                variant="danger"
                onClick={handleDelete}
                disabled={saldoSummary.totalCards > 0}
                icon={<Trash2 size={16} />}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
