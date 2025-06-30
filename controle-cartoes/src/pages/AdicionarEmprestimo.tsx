/**
 * Add Loan/Expense Form - Enhanced with installment tracking
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  CreditCard, 
  Save, 
  Calendar,
  DollarSign,
  Hash,
  FileText,
  Building,
  AlertCircle
} from 'lucide-react';
import { PageLayout, Card, FormLayout, FormActions } from '../components/ui/Layout';
import { PrimaryButton } from '../components/ui/FormComponents';
import Input from '../components/ui/Input';
import { useAppData } from '../hooks';
import type { CartaoFormData, Installment } from '../types';

// Bancos e instituições financeiras brasileiras
const CARD_PROVIDERS = [
  { id: 'nubank', name: 'Nubank', color: '#8A05BE' },
  { id: 'itau', name: 'Itaú', color: '#EC7000' },
  { id: 'bradesco', name: 'Bradesco', color: '#CC092F' },
  { id: 'santander', name: 'Santander', color: '#EC0000' },
  { id: 'bb', name: 'Banco do Brasil', color: '#FFD700' },
  { id: 'caixa', name: 'Caixa Econômica', color: '#0066CC' },
  { id: 'inter', name: 'Banco Inter', color: '#FF7A00' },
  { id: 'c6bank', name: 'C6 Bank', color: '#FFD700' },
  { id: 'original', name: 'Banco Original', color: '#00D4AA' },
  { id: 'neon', name: 'Neon', color: '#00E88F' },
  { id: 'next', name: 'Next', color: '#3B82F6' },
  { id: 'picpay', name: 'PicPay', color: '#21C25E' },
  { id: 'mercadopago', name: 'Mercado Pago', color: '#009EE3' },
  { id: 'magalu', name: 'Magalu Bank', color: '#0F4C99' },
  { id: 'will', name: 'Will Bank', color: '#8B5CF6' },
  { id: 'other', name: 'Outro', color: '#6B7280' }
];

const CURRENCIES = [
  { code: 'BRL', symbol: 'R$', name: 'Real Brasileiro' },
  { code: 'USD', symbol: '$', name: 'Dólar Americano' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'Libra Esterlina' }
];

const CATEGORIES = [
  'Compras',
  'Supermercado', 
  'Contas',
  'Emergência',
  'Viagem',
  'Entretenimento',
  'Médico',
  'Farmácia',
  'Combustível',
  'Alimentação',
  'Roupas',
  'Casa',
  'Educação',
  'Outros'
];

export default function AdicionarEmprestimo() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { pessoas, addCartao } = useAppData();
  
  const [formData, setFormData] = useState<CartaoFormData>({
    descricao: '',
    valor_total: '',
    numero_de_parcelas: '1',
    data_compra: new Date().toISOString().split('T')[0],
    observacoes: '',
    categoria: '',
    pessoa_id: id || '',
    cardProvider: '',
    cardNumber: '',
    dueDay: '3',
    currency: 'BRL',
    firstPaymentDate: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [installmentPreview, setInstallmentPreview] = useState<Installment[]>([]);

  const selectedPerson = pessoas?.find(p => p.id === (id || formData.pessoa_id));

  // Calculate installment preview when relevant fields change
  useEffect(() => {
    const amount = parseFloat(formData.valor_total.toString());
    const installments = parseInt(formData.numero_de_parcelas.toString());
    const dueDay = parseInt(formData.dueDay.toString());
    const firstPaymentDate = formData.firstPaymentDate;

    if (amount > 0 && installments > 0 && dueDay >= 1 && dueDay <= 31 && firstPaymentDate) {
      const preview: Installment[] = [];
      const installmentAmount = amount / installments;
      const startDate = new Date(firstPaymentDate);

      for (let i = 0; i < installments; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(startDate.getMonth() + i);
        dueDate.setDate(dueDay);

        preview.push({
          id: `preview-${i}`,
          number: i + 1,
          amount: installmentAmount,
          dueDate: dueDate.toISOString().split('T')[0],
          isPaid: false
        });
      }
      setInstallmentPreview(preview);
    } else {
      setInstallmentPreview([]);
    }
  }, [formData.valor_total, formData.numero_de_parcelas, formData.dueDay, formData.firstPaymentDate]);

  const handleChange = (field: keyof CartaoFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }

    const amount = parseFloat(formData.valor_total.toString());
    if (!amount || amount <= 0) {
      newErrors.valor_total = 'Valor deve ser maior que 0';
    }

    const installments = parseInt(formData.numero_de_parcelas.toString());
    if (!installments || installments < 1 || installments > 60) {
      newErrors.numero_de_parcelas = 'Número de parcelas deve ser entre 1 e 60';
    }

    const dueDay = parseInt(formData.dueDay.toString());
    if (!dueDay || dueDay < 1 || dueDay > 31) {
      newErrors.dueDay = 'Dia de vencimento deve ser entre 1 e 31';
    }

    if (!formData.firstPaymentDate) {
      newErrors.firstPaymentDate = 'Data do primeiro pagamento é obrigatória';
    }

    if (!formData.pessoa_id) {
      newErrors.pessoa_id = 'Pessoa deve ser selecionada';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      // Generate installments
      const amount = parseFloat(formData.valor_total.toString());
      const numInstallments = parseInt(formData.numero_de_parcelas.toString());
      const installmentAmount = amount / numInstallments;
      const dueDay = parseInt(formData.dueDay.toString());
      const startDate = new Date(formData.firstPaymentDate!);

      const installments: Installment[] = [];
      for (let i = 0; i < numInstallments; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(startDate.getMonth() + i);
        dueDate.setDate(dueDay);

        installments.push({
          id: `inst-${Date.now()}-${i}`,
          number: i + 1,
          amount: installmentAmount,
          dueDate: dueDate.toISOString().split('T')[0],
          isPaid: false
        });
      }

      const newCartao = {
        id: `cartao-${Date.now()}`,
        descricao: formData.descricao,
        valorTotal: amount,
        parcelasTotais: numInstallments,
        parcelasPagas: 0,
        valorPago: 0,
        dataVencimento: formData.data_compra || new Date().toISOString().split('T')[0],
        observacoes: formData.observacoes,
        tipoCartao: 'credito',
        // Keep the old format for compatibility
        valor_total: amount,
        numero_de_parcelas: numInstallments,
        data_compra: formData.data_compra || new Date().toISOString().split('T')[0],
        categoria: formData.categoria,
        cardProvider: CARD_PROVIDERS.find(p => p.id === formData.cardProvider),
        cardNumber: formData.cardNumber,
        installments,
        dueDay: dueDay,
        currency: formData.currency,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addCartao(formData.pessoa_id, newCartao);
      
      // Add a small delay to ensure state propagation
      setTimeout(() => {
        navigate(`/pessoas/${formData.pessoa_id}`);
      }, 100);
    } catch (error) {
      console.error('Error adding loan:', error);
      setErrors({ submit: 'Falha ao adicionar empréstimo. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCurrency = CURRENCIES.find(c => c.code === formData.currency);

  return (
    <PageLayout
      title="Adicionar Empréstimo"
      subtitle={selectedPerson ? `Adicionar despesa para ${selectedPerson.nome}` : 'Adicionar um novo empréstimo ou despesa'}
      backTo={id ? `/pessoas/${id}` : '/pessoas'}
      icon={<CreditCard size={24} />}
    >
      <FormLayout onSubmit={handleSubmit}>
        {/* Person Selection */}
        {!id && (
          <Card title="Selecionar Pessoa" className="mb-6">
            <div className="space-y-4">
              <select
                value={formData.pessoa_id}
                onChange={(e) => handleChange('pessoa_id', e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                required
              >
                <option value="">Selecione uma pessoa</option>
                {pessoas?.map(pessoa => (
                  <option key={pessoa.id} value={pessoa.id}>
                    {pessoa.nome}
                  </option>
                ))}
              </select>
              {errors.pessoa_id && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.pessoa_id}</p>
              )}
            </div>
          </Card>
        )}

        {/* Basic Information */}
        <Card title="Detalhes do Empréstimo" className="mb-6">
          <div className="space-y-6">
            <Input
              label="Descrição *"
              placeholder="ex: Compras no Mercado Livre, Conta médica de emergência"
              value={formData.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
              error={errors.descricao}
              startIcon={<FileText size={16} />}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor *
                </label>
                <div className="flex">
                  <select
                    value={formData.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className="rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-3"
                  >
                    {CURRENCIES.map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.valor_total}
                    onChange={(e) => handleChange('valor_total', e.target.value)}
                    className="flex-1 rounded-r-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                {errors.valor_total && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.valor_total}</p>
                )}
              </div>

              <Input
                label="Número de Parcelas *"
                type="number"
                min="1"
                max="60"
                placeholder="3"
                value={formData.numero_de_parcelas}
                onChange={(e) => handleChange('numero_de_parcelas', e.target.value)}
                error={errors.numero_de_parcelas}
                startIcon={<Hash size={16} />}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Dia de Vencimento *"
                type="number"
                min="1"
                max="31"
                placeholder="3"
                helperText="Dia do mês em que os pagamentos vencem (ex: dia 3)"
                value={formData.dueDay}
                onChange={(e) => handleChange('dueDay', e.target.value)}
                error={errors.dueDay}
                startIcon={<Calendar size={16} />}
                required
              />

              <Input
                label="Data do Primeiro Pagamento *"
                type="date"
                value={formData.firstPaymentDate}
                onChange={(e) => handleChange('firstPaymentDate', e.target.value)}
                error={errors.firstPaymentDate}
                required
              />
            </div>
          </div>
        </Card>

        {/* Card Information */}
        <Card title="Informações do Cartão" className="mb-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Banco/Instituição
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CARD_PROVIDERS.map(provider => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => handleChange('cardProvider', provider.id)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.cardProvider === provider.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div 
                      className="w-4 h-4 rounded-full mx-auto mb-1"
                      style={{ backgroundColor: provider.color }}
                    ></div>
                    {provider.name}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Número do Cartão (Últimos 4 dígitos)"
              placeholder="1234"
              maxLength={4}
              value={formData.cardNumber}
              onChange={(e) => handleChange('cardNumber', e.target.value.replace(/\D/g, ''))}
              startIcon={<CreditCard size={16} />}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categoria
              </label>
              <select
                value={formData.categoria}
                onChange={(e) => handleChange('categoria', e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">Selecione uma categoria</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Observações
              </label>
              <textarea
                placeholder="Notas adicionais ou detalhes"
                value={formData.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Installment Preview */}
        {installmentPreview.length > 0 && (
          <Card title="Cronograma de Pagamentos" className="mb-6">
            <div className="space-y-3">
              {installmentPreview.map((installment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
                      {installment.number}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        Parcela {installment.number}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Vencimento: {new Date(installment.dueDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {selectedCurrency?.symbol}{(installment?.amount || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Error Display */}
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
            <p className="text-red-600 dark:text-red-400">{errors.submit}</p>
          </div>
        )}

        {/* Form Actions */}
        <FormActions>
          <Link to={id ? `/pessoas/${id}` : '/pessoas'}>
            <PrimaryButton variant="secondary" disabled={isSubmitting}>
              Cancelar
            </PrimaryButton>
          </Link>
          <PrimaryButton
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
            icon={<Save size={16} />}
          >
            Adicionar Empréstimo
          </PrimaryButton>
        </FormActions>
      </FormLayout>
    </PageLayout>
  );
}
