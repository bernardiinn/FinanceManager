/**
 * AdicionarGasto Page - Add new expense
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, DollarSign, Calendar, Tag, CreditCard, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { expenseService } from '../services/expenseService';
import { useToast } from '../components/Toast';
import type { GastoFormData } from '../types';

const AdicionarGasto: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState<GastoFormData>({
    descricao: '',
    valor: '',
    data: new Date().toISOString().split('T')[0], // Today's date
    categoria: '',
    metodoPagamento: '',
    observacoes: '',
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }

    if (!formData.valor || isNaN(Number(formData.valor)) || Number(formData.valor) <= 0) {
      newErrors.valor = 'Valor deve ser um número positivo';
    }

    if (!formData.data) {
      newErrors.data = 'Data é obrigatória';
    }

    if (!formData.categoria) {
      newErrors.categoria = 'Categoria é obrigatória';
    }

    if (!formData.metodoPagamento) {
      newErrors.metodoPagamento = 'Método de pagamento é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof GastoFormData, value: string) => {
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
      const newGasto = await expenseService.createGasto(formData);
      
      addToast({
        type: 'success',
        title: 'Gasto Adicionado',
        message: `Gasto "${newGasto.descricao}" foi adicionado com sucesso.`,
      });

      navigate('/gastos');
    } catch (error) {
      console.error('Error creating expense:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao adicionar gasto. Tente novamente.',
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/gastos">
            <Button variant="secondary" size="sm">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <DollarSign className="text-green-600" size={28} />
              Adicionar Gasto
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Registre um novo gasto ou despesa
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
                placeholder="Ex: Almoço no restaurante, Combustível, etc."
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

            {/* Data */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar size={16} className="inline mr-2" />
                Data *
              </label>
              <Input
                type="date"
                value={formData.data}
                onChange={(e) => handleInputChange('data', e.target.value)}
                error={errors.data}
                className="w-full"
              />
              {errors.data && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.data}</p>
              )}
            </div>

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

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Observações (Opcional)
              </label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                placeholder="Informações adicionais sobre este gasto..."
                rows={3}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
              />
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
                    Salvar Gasto
                  </>
                )}
              </Button>
              
              <Link to="/gastos" className="flex-1">
                <Button variant="secondary" className="w-full">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </Card>

        {/* Quick Tips */}
        <Card className="p-4 mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">💡 Dicas Rápidas</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• Use descrições claras para facilitar a identificação posterior</li>
            <li>• Categorias ajudam na organização e análise dos gastos</li>
            <li>• Gastos recorrentes podem ser automatizados na seção "Recorrências"</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default AdicionarGasto;
