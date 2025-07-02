/**
 * Enhanced Add Card Page - Mobile-First PWA Design
 * Fully responsive with modern UX and accessibility features
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, DollarSign, Calendar, User, Save, ArrowLeft } from 'lucide-react';
import { useAppData } from '../hooks';
import { useToast } from '../components/Toast';

// Enhanced UI Components
import { 
  TextInput, 
  TextArea, 
  PrimaryButton
} from '../components/ui/FormComponents';
import { 
  PageLayout, 
  Card, 
  FormLayout, 
  FormActions, 
  LoadingOverlay 
} from '../components/ui/Layout';

interface FormData {
  descricao: string;
  valor_total: string;
  numero_de_parcelas: string;
  data_compra: string;
  pessoa_id: string;
  observacoes: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function AdicionarCartao() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { pessoas, addCartao } = useAppData();
  const { addToast } = useToast();
  
  const preSelectedPessoaId = searchParams.get('pessoa');
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    descricao: '',
    valor_total: '',
    numero_de_parcelas: '',
    data_compra: '',
    pessoa_id: preSelectedPessoaId || '',
    observacoes: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Set today's date as default
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, data_compra: today }));
  }, []);

  // Real-time validation
  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'descricao':
        if (!value.trim()) {
          return 'A descrição é obrigatória';
        }
        if (value.trim().length < 3) {
          return 'A descrição deve ter pelo menos 3 caracteres';
        }
        if (value.trim().length > 100) {
          return 'A descrição deve ter no máximo 100 caracteres';
        }
        return '';

      case 'valor_total': {
        if (!value.trim()) {
          return 'O valor total é obrigatório';
        }
        const valor = parseFloat(value.replace(',', '.'));
        if (isNaN(valor) || valor <= 0) {
          return 'Digite um valor válido maior que zero';
        }
        if (valor > 1000000) {
          return 'O valor deve ser menor que R$ 1.000.000,00';
        }
        return '';
      }

      case 'numero_de_parcelas': {
        if (!value.trim()) {
          return 'O número de parcelas é obrigatório';
        }
        const parcelas = parseInt(value);
        if (isNaN(parcelas) || parcelas < 1 || parcelas > 60) {
          return 'Digite um número válido entre 1 e 60';
        }
        return '';
      }

      case 'data_compra': {
        if (!value) {
          return 'A data da compra é obrigatória';
        }
        const dataCompra = new Date(value);
        const hoje = new Date();
        const umAnoAtras = new Date();
        umAnoAtras.setFullYear(hoje.getFullYear() - 1);
        
        if (dataCompra > hoje) {
          return 'A data não pode ser no futuro';
        }
        if (dataCompra < umAnoAtras) {
          return 'A data não pode ser anterior a um ano';
        }
        return '';
      }

      case 'pessoa_id':
        if (!value) {
          return 'Selecione uma pessoa';
        }
        return '';

      default:
        return '';
    }
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    Object.keys(formData).forEach(field => {
      if (field !== 'observacoes') { // observacoes is optional
        const error = validateField(field, formData[field as keyof FormData]);
        if (error) {
          newErrors[field] = error;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle field changes with real-time validation
  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Only show errors for touched fields
    if (touchedFields.has(field)) {
      const error = validateField(field, value);
      setErrors(prev => ({ 
        ...prev, 
        [field]: error,
        submit: '' // Clear general submit error
      }));
    }
  };

  // Handle field blur (mark as touched)
  const handleFieldBlur = (field: keyof FormData) => {
    setTouchedFields(prev => new Set(prev).add(field));
    const error = validateField(field, formData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Format currency input
  const handleCurrencyChange = (value: string) => {
    // Remove all non-numeric characters except decimal point and comma
    const numericValue = value.replace(/[^\d.,]/g, '');
    // Replace comma with period for decimal separator
    const formattedValue = numericValue.replace(',', '.');
    handleFieldChange('valor_total', formattedValue);
  };

  // Check if form is valid for button state
  const isFormValid = () => {
    return formData.descricao.trim().length >= 3 && 
           formData.valor_total.trim() &&
           formData.numero_de_parcelas.trim() &&
           formData.data_compra &&
           formData.pessoa_id &&
           Object.values(errors).every(error => !error);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouchedFields(new Set(Object.keys(formData)));
    
    if (!validateForm()) {
      addToast({ type: 'error', title: 'Verifique os campos obrigatórios antes de continuar' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const novoCartao = {
        descricao: formData.descricao.trim(),
        valorTotal: parseFloat(formData.valor_total.replace(',', '.')),
        parcelasTotais: parseInt(formData.numero_de_parcelas),
        parcelasPagas: 0,
        valorPago: 0,
        dataVencimento: formData.data_compra,
        observacoes: formData.observacoes.trim() || undefined,
        tipoCartao: 'credito',
        // Keep old format for compatibility
        valor_total: parseFloat(formData.valor_total.replace(',', '.')),
        numero_de_parcelas: parseInt(formData.numero_de_parcelas),
        data_compra: formData.data_compra
      };

      const cartaoAdicionado = await addCartao(formData.pessoa_id, novoCartao as unknown as Parameters<typeof addCartao>[1]);
      
      addToast({ type: 'success', title: 'Cartão adicionado com sucesso!' });

      // Navigate to card details after a short delay
      setTimeout(() => {
        navigate(`/cartoes/${cartaoAdicionado.id}`);
      }, 1000);

    } catch {
      addToast({ type: 'error', title: 'Erro ao adicionar cartão. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle navigation back
  const handleBack = () => {
    if (preSelectedPessoaId) {
      navigate(`/pessoas/${preSelectedPessoaId}`);
    } else {
      navigate('/pessoas');
    }
  };

  // Get selected person info
  const selectedPessoa = pessoas.find(p => p.id === formData.pessoa_id);

  return (
    <PageLayout title='Adicionar Cartão' className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <PrimaryButton
          onClick={handleBack}
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={16} />}
          className="!p-2" children={undefined}        />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <CreditCard size={24} />
            Adicionar Cartão
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Registre um novo cartão emprestado
            {selectedPessoa && ` para ${selectedPessoa.nome}`}
          </p>
        </div>
      </div>

      <FormLayout onSubmit={handleSubmit}>
        <Card>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Informações do Cartão
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Campos marcados com * são obrigatórios
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            <TextInput
              label="Descrição da compra"
              value={formData.descricao}
              onChange={(value) => handleFieldChange('descricao', value)}
              onBlur={() => handleFieldBlur('descricao')}
              placeholder="Ex: Notebook Dell, Smartphone Samsung..."
              error={errors.descricao}
              required
              disabled={isSubmitting}
              icon={<CreditCard size={16} />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <TextInput
                label="Valor total"
                value={formData.valor_total}
                onChange={handleCurrencyChange}
                onBlur={() => handleFieldBlur('valor_total')}
                placeholder="1234.56"
                type="text"
                error={errors.valor_total}
                required
                disabled={isSubmitting}
                icon={<DollarSign size={16} />}
              />

              <TextInput
                label="Número de parcelas"
                value={formData.numero_de_parcelas}
                onChange={(value) => handleFieldChange('numero_de_parcelas', value)}
                onBlur={() => handleFieldBlur('numero_de_parcelas')}
                placeholder="12"
                type="number"
                error={errors.numero_de_parcelas}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <TextInput
                label="Data da compra"
                value={formData.data_compra}
                onChange={(value) => handleFieldChange('data_compra', value)}
                onBlur={() => handleFieldBlur('data_compra')}
                type="date"
                error={errors.data_compra}
                required
                disabled={isSubmitting}
                icon={<Calendar size={16} />}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Pessoa <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-gray-400 dark:text-gray-500">
                    <User size={16} />
                  </div>
                  <select
                    value={formData.pessoa_id}
                    onChange={(e) => handleFieldChange('pessoa_id', e.target.value)}
                    onBlur={() => handleFieldBlur('pessoa_id')}
                    disabled={isSubmitting}
                    className={`
                      w-full pl-10 pr-4 py-3 rounded-lg border text-sm
                      bg-white dark:bg-gray-800
                      border-gray-300 dark:border-gray-600
                      text-gray-900 dark:text-gray-100
                      placeholder-gray-500 dark:placeholder-gray-400
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors duration-200
                      ${errors.pessoa_id ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                    `}
                  >
                    <option value="">Selecione uma pessoa</option>
                    {pessoas.map(pessoa => (
                      <option key={pessoa.id} value={pessoa.id}>
                        {pessoa.nome}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.pessoa_id && (
                  <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                    <span>{errors.pessoa_id}</span>
                  </div>
                )}
              </div>
            </div>

            <TextArea
              label="Observações"
              value={formData.observacoes}
              onChange={(value) => handleFieldChange('observacoes', value)}
              onBlur={() => handleFieldBlur('observacoes')}
              placeholder="Informações adicionais sobre o cartão ou compra (opcional)"
              error={errors.observacoes}
              disabled={isSubmitting}
              rows={4}
            />

            {/* Summary Card */}
            {formData.valor_total && formData.numero_de_parcelas && !errors.valor_total && !errors.numero_de_parcelas && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Resumo da Parcela
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Valor por parcela: <span className="font-semibold">
                    R$ {(parseFloat(formData.valor_total.replace(',', '.')) / parseInt(formData.numero_de_parcelas)).toFixed(2)}
                  </span>
                </p>
              </div>
            )}
          </div>
        </Card>

        <FormActions>
          <PrimaryButton
            type="button"
            onClick={handleBack}
            variant="secondary"
            disabled={isSubmitting}
            className="flex-1 sm:flex-none"
          >
            Cancelar
          </PrimaryButton>
          
          <PrimaryButton
            type="submit"
            loading={isSubmitting}
            disabled={!isFormValid() || isSubmitting}
            icon={<Save size={16} />}
            className="flex-1 sm:flex-none"
          >
            {isSubmitting ? 'Adicionando...' : 'Adicionar Cartão'}
          </PrimaryButton>
        </FormActions>
      </FormLayout>

      {/* Loading Overlay */}
      {isSubmitting && (
        <LoadingOverlay isVisible message="Adicionando cartão..." />
      )}
    </PageLayout>
  );
}
