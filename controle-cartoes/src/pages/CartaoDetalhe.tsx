import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { 
  ArrowLeft, 
  Edit3, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Trash2,
  Calendar,
  DollarSign,
  User,
  Clock
} from 'lucide-react';
import CartaoCard from '../components/CartaoCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAppData } from '../hooks';
import { financeService } from '../services/financeService';

export default function CartaoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pessoas, deleteCartao, getCartaoById } = useAppData();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const cartao = getCartaoById(id || '');
  const pessoa = cartao ? pessoas.find(p => p.id === cartao.pessoa_id) : null;

  if (!cartao || !pessoa) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg max-w-md w-full">
          <div className="p-8 text-center">
            <div className="mb-6">
              <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full inline-flex">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Cartão não encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              O cartão que você está procurando não existe ou foi removido do sistema.
            </p>
            <Link to="/pessoas">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar para Pessoas
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const saldo = financeService.calcularSaldoCartao(cartao);
  const valorRecebido = financeService.calcularValorRecebido(cartao);
  const percentual = financeService.calcularPercentualCompleto(cartao);
  const isCompleted = financeService.isCartaoCompleto(cartao);

  const handleDelete = () => {
    deleteCartao(cartao.id);
    navigate(`/pessoas/${pessoa.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header with Breadcrumb */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col space-y-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Link to="/pessoas" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Pessoas
              </Link>
              <span>•</span>
              <Link to={`/pessoas/${pessoa.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {pessoa.nome}
              </Link>
              <span>•</span>
              <span className="text-gray-900 dark:text-white font-medium">Empréstimo</span>
            </div>
            
            {/* Title and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Link to={`/pessoas/${pessoa.id}`}>
                    <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  </Link>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {cartao.descricao}
                      </h1>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">
                          Empréstimo de <span className="font-medium">{pessoa.nome}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Quitado
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      Em Andamento
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 sm:flex-shrink-0">
                <Link to={`/cartoes/${cartao.id}/editar`}>
                  <Button variant="secondary" className="bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 shadow-sm">
                    <Edit3 className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Editar</span>
                  </Button>
                </Link>
                <Button 
                  variant="danger" 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600 hover:bg-red-700 text-white shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Excluir</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Card Preview */}
        {/* <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <CartaoCard cartao={cartao} />
        </div> */}

        {/* Financial Overview Grid
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <DollarSign className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Valor Total
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    R$ {cartao.valor_total.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Valor completo do empréstimo
              </div>
            </div>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Valor Recebido
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    R$ {valorRecebido.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {cartao.parcelas_pagas} de {cartao.numero_de_parcelas} parcelas pagas
              </div>
            </div>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                  <Calendar className="w-7 h-7 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Saldo Pendente
                  </p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    R$ {saldo.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {cartao.numero_de_parcelas - cartao.parcelas_pagas} parcelas restantes
              </div>
            </div>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <CreditCard className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Progresso
                  </p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {percentual}%
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {isCompleted ? 'Totalmente quitado' : 'Em andamento'}
              </div>
            </div>
          </Card>
        </div> */}

        {/* Payment Progress Section */}
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Progresso de Pagamento
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Acompanhe o andamento das parcelas do empréstimo
                </p>
              </div>
            </div>
            
            <div className="space-y-8">
              {/* Progress Bar */}
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {cartao.parcelas_pagas} de {cartao.numero_de_parcelas} parcelas
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {isCompleted ? 'Empréstimo totalmente quitado!' : `Restam ${cartao.numero_de_parcelas - cartao.parcelas_pagas} parcelas`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {percentual}%
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      completo
                    </p>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-700 ease-out rounded-full relative ${
                      isCompleted 
                        ? 'bg-gradient-to-r from-green-500 via-green-600 to-green-500' 
                        : 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500'
                    }`}
                    style={{ width: `${percentual}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
              
              {/* Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-600 rounded-lg">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                        Valor por Parcela
                      </p>
                      <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                        R$ {(cartao.valor_total / cartao.numero_de_parcelas).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    Valor fixo mensal
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-600 rounded-lg">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">
                        Parcelas Restantes
                      </p>
                      <p className="text-xl font-bold text-orange-900 dark:text-orange-100">
                        {cartao.numero_de_parcelas - cartao.parcelas_pagas}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-orange-600 dark:text-orange-400">
                    {isCompleted ? 'Nenhuma pendência' : 'Ainda em aberto'}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-600 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                        Total Recebido
                      </p>
                      <p className="text-xl font-bold text-green-900 dark:text-green-100">
                        R$ {valorRecebido.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    {Math.round((valorRecebido / cartao.valor_total) * 100)}% do total
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Additional Information */}
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Informações Detalhadas
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Dados completos sobre este empréstimo
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Person Info */}
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="p-3 bg-blue-600 rounded-lg flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                      Responsável pelo Empréstimo
                    </p>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-100 truncate">
                      {pessoa.nome}
                    </p>
                    {pessoa.email && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 truncate">
                        {pessoa.email}
                      </p>
                    )}
                    {pessoa.telefone && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                        {pessoa.telefone}
                      </p>
                    )}
                  </div>
                </div>

                {cartao.data_compra && (
                  <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="p-3 bg-green-600 rounded-lg flex-shrink-0">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                        Data da Compra
                      </p>
                      <p className="text-lg font-bold text-green-900 dark:text-green-100">
                        {new Date(cartao.data_compra).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        {Math.floor((new Date().getTime() - new Date(cartao.data_compra).getTime()) / (1000 * 60 * 60 * 24))} dias atrás
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes Section */}
              {cartao.observacoes && (
                <div className="md:col-span-1">
                  <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl border border-yellow-200 dark:border-yellow-800 h-full">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-yellow-600 rounded-lg flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                          Observações
                        </p>
                      </div>
                    </div>
                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 mt-4">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {cartao.observacoes}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Resumo Financeiro
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Valor da Parcela</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    R$ {(cartao.valor_total / cartao.numero_de_parcelas).toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Prazo Total</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {cartao.numero_de_parcelas} meses
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <p className={`text-lg font-bold ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    {isCompleted ? 'Quitado' : 'Ativo'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-b border-red-200 dark:border-red-800">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-600 rounded-xl">
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-red-900 dark:text-red-100">
                      Confirmar Exclusão
                    </h3>
                    <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                      Esta ação é irreversível
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                    Tem certeza que deseja excluir permanentemente o empréstimo{' '}
                    <span className="font-bold text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                      {cartao.descricao}
                    </span>?
                  </p>
                </div>
                
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                        Dados que serão perdidos:
                      </p>
                      <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                        <li>• Todas as informações do empréstimo</li>
                        <li>• Histórico de pagamentos ({cartao.parcelas_pagas} parcelas pagas)</li>
                        <li>• Observações e dados relacionados</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <span className="font-medium">Responsável:</span> {pessoa.nome}
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        <span className="font-medium">Valor:</span> R$ {cartao.valor_total.toFixed(2).replace('.', ',')} 
                        ({percentual}% pago)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="p-6 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-4 justify-end">
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 font-medium"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant="danger" 
                    onClick={handleDelete}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium flex items-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Excluir Permanentemente
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
