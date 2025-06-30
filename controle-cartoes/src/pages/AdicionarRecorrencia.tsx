/**
 * AdicionarRecorrencia Page - Add new recurring transaction
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  RefreshCw, 
  DollarSign, 
  Calendar, 
  Tag, 
  CreditCard, 
  FileText,
  Clock,
  Play
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { expenseService } from '../services/expenseService';
import { useToast } from '../components/Toast';
import type { RecorrenciaFormData } from '../types';

const AdicionarRecorrencia: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState<RecorrenciaFormData>({
    descricao: '',
    valor: '',
    categoria: '',
    metodoPagamento: '',
    frequencia: 'Mensal',
    dataInicio: new Date().toISOString().split('T')[0], // Today's date
    dataFim: '',
    ativo: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Alimentação',
    'Transporte',
    'Compras',
    'Moradia',
    'Saúde',
    'Entretenimento',
    'Educação',
    'Serviços',
    'Outros'
  ];

  const paymentMethods = [
    'Cartão de Crédito',
    'Cartão de Débito',
    'Pix',
    'Dinheiro',
    'Transferência',
    'Outros'
  ];

  const frequencies = [
    { value: 'Semanal', label: 'Semanal (toda semana)', icon: '📅' },
    { value: 'Mensal', label: 'Mensal (todo mês)', icon: '🗓️' },
    { value: 'Anual', label: 'Anual (todo ano)', icon: '📆' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }

    if (!formData.valor || isNaN(Number(formData.valor)) || Number(formData.valor) <= 0) {
      newErrors.valor = 'Valor deve ser um número positivo';
    }

    if (!formData.categoria) {
      newErrors.categoria = 'Categoria é obrigatória';
    }

    if (!formData.metodoPagamento) {
      newErrors.metodoPagamento = 'Método de pagamento é obrigatório';
    }

    if (!formData.dataInicio) {
      newErrors.dataInicio = 'Data de início é obrigatória';
    }

    if (formData.dataFim && formData.dataInicio && formData.dataFim <= formData.dataInicio) {
      newErrors.dataFim = 'Data de fim deve ser posterior à data de início';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof RecorrenciaFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      addToast({
        type: 'error',
        title: 'Erro de Validação',
        message: 'Por favor, corrija os erros no formulário.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const newRecorrencia = expenseService.createRecorrencia(formData);
      
      addToast({
        type: 'success',
        title: 'Recorrência Criada',
        message: `Recorrência "${newRecorrencia.descricao}" foi criada com sucesso.`,
      });

      navigate('/recorrencias');
    } catch (error) {
      console.error('Error creating recorrencia:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao criar recorrência. Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^\d.,]/g, '').replace(',', '.');
    handleInputChange('valor', numericValue);
  };

  const getEstimatedMonthlyValue = () => {
    const value = Number(formData.valor) || 0;
    switch (formData.frequencia) {
      case 'Semanal':
        return value * 4.33; // Average weeks per month
      case 'Mensal':
        return value;
      case 'Anual':
        return value / 12;
      default:
        return value;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/recorrencias">
            <Button variant="outline" size="sm">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="text-blue-600" size={28} />
              Nova Recorrência
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Configure um gasto que se repete automaticamente
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText size={16} className="inline mr-2" />
                Descrição *
              </label>
              <Input
                type="text"
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                placeholder="Ex: Aluguel, Netflix, Supermercado mensal, etc."
                error={errors.descricao}
                className="w-full"
              />
              {errors.descricao && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.descricao}</p>
              )}
            </div>

            {/* Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign size={16} className="inline mr-2" />
                Valor *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  R$
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor}
                  onChange={handleValueChange}
                  placeholder="0,00"
                  error={errors.valor}
                  className="pl-12"
                />
              </div>
              {errors.valor && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.valor}</p>
              )}
            </div>

            {/* Frequência */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock size={16} className="inline mr-2" />
                Frequência *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {frequencies.map((freq) => (
                  <button
                    key={freq.value}
                    type="button"
                    onClick={() => handleInputChange('frequencia', freq.value as any)}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      formData.frequencia === freq.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="text-xl mb-1">{freq.icon}</div>
                    <div className="font-medium text-sm">{freq.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Estimated Monthly Value */}
            {formData.valor && Number(formData.valor) > 0 && (
              <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                  💰 Estimativa Mensal
                </h3>
                <p className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                  {formatCurrency(getEstimatedMonthlyValue())}
                </p>
              </Card>
            )}

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Tag size={16} className="inline mr-2" />
                Categoria *
              </label>
              <select
                value={formData.categoria}
                onChange={(e) => handleInputChange('categoria', e.target.value)}
                className={`w-full p-3 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.categoria ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.categoria && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.categoria}</p>
              )}
            </div>

            {/* Método de Pagamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <CreditCard size={16} className="inline mr-2" />
                Método de Pagamento *
              </label>
              <select
                value={formData.metodoPagamento}
                onChange={(e) => handleInputChange('metodoPagamento', e.target.value)}
                className={`w-full p-3 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.metodoPagamento ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Selecione um método</option>
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              {errors.metodoPagamento && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.metodoPagamento}</p>
              )}
            </div>

            {/* Data de Início */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar size={16} className="inline mr-2" />
                Data de Início *
              </label>
              <Input
                type="date"
                value={formData.dataInicio}
                onChange={(e) => handleInputChange('dataInicio', e.target.value)}
                error={errors.dataInicio}
                className="w-full"
              />
              {errors.dataInicio && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dataInicio}</p>
              )}
            </div>

            {/* Data de Fim (Opcional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data de Fim (Opcional)
              </label>
              <Input
                type="date"
                value={formData.dataFim}
                onChange={(e) => handleInputChange('dataFim', e.target.value)}
                error={errors.dataFim}
                className="w-full"
                min={formData.dataInicio || undefined}
              />
              {errors.dataFim && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dataFim}</p>
              )}
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Deixe em branco para recorrência indefinida
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
                <input
                  type="checkbox"
                  checked={formData.ativo}
                  onChange={(e) => handleInputChange('ativo', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Play size={16} className="text-green-600" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Ativar recorrência imediatamente
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Se marcado, a recorrência começará a gerar gastos automaticamente
                  </p>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 flex-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Criar Recorrência
                  </>
                )}
              </Button>
              
              <Link to="/recorrencias" className="flex-1">
                <Button variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </Card>

        {/* How it works */}
        <Card className="p-4 mt-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <h3 className="font-medium text-green-900 dark:text-green-200 mb-2">🔄 Como Funciona</h3>
          <ul className="text-sm text-green-800 dark:text-green-300 space-y-1">
            <li>• O sistema verifica automaticamente se é hora de gerar novos gastos</li>
            <li>• Gastos são criados com base na frequência e data de início definidas</li>
            <li>• Você pode pausar, editar ou excluir recorrências a qualquer momento</li>
            <li>• Gastos gerados automaticamente ficam marcados como "Recorrente"</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default AdicionarRecorrencia;
