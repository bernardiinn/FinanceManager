/**
 * Enhanced Edit Card Page - Mobile-First PWA Design
 * Fully responsive with modern UX and accessibility features
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CreditCard, DollarSign, Calendar, User, Save, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
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
  parcelas_pagas: string;
  data_compra: string;
  pessoa_id: string;
  observacoes: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function EditarCartao() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pessoas, updateCartao, getCartaoById } = useAppData();
  const { addToast } = useToast();
  
  const cartao = getCartaoById(id || '');
  const pessoa = cartao ? pessoas.find(p => p.id === cartao.pessoa_id) : null;
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    descricao: '',
    valor_total: '',
    numero_de_parcelas: '',
    parcelas_pagas: '',
    data_compra: '',
    pessoa_id: '',
    observacoes: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Initialize form data when card is loaded
  useEffect(() => {
    if (cartao) {
      setFormData({
        descricao: cartao.descricao || '',
        valor_total: cartao.valor_total.toFixed(2),
        numero_de_parcelas: cartao.numero_de_parcelas.toString(),
        parcelas_pagas: cartao.parcelas_pagas.toString(),
        data_compra: cartao.data_compra || '',
        pessoa_id: cartao.pessoa_id.toString(),
        observacoes: cartao.observacoes || ''
      });
      setIsLoading(false);
    } else if (id) {
      // Card not found and ID is provided
      setIsLoading(false);
    }
  }, [cartao, id]);

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
        
        // Check if parcelas pagas is not greater than total parcelas
        const parcelasPagasAtual = parseInt(formData.parcelas_pagas);
        if (!isNaN(parcelasPagasAtual) && parcelasPagasAtual > parcelas) {
          return 'O número de parcelas deve ser maior ou igual às parcelas pagas';
        }
        return '';
      }

      case 'parcelas_pagas': {
        if (!value.trim()) {
          return 'O número de parcelas pagas é obrigatório';
        }
        const parcelasPagas = parseInt(value);
        if (isNaN(parcelasPagas) || parcelasPagas < 0) {
          return 'Digite um número válido maior ou igual a zero';
        }
        
        const totalParcelas = parseInt(formData.numero_de_parcelas);
        if (!isNaN(totalParcelas) && parcelasPagas > totalParcelas) {
          return 'As parcelas pagas não podem ser maiores que o total de parcelas';
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

      case 'pessoa_id': {
        if (!value) {
          return 'Selecione uma pessoa';
        }
        return '';
      }

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
      
      // Re-validate related fields
      if (field === 'numero_de_parcelas' && formData.parcelas_pagas) {
        const parcelasError = validateField('parcelas_pagas', formData.parcelas_pagas);
        setErrors(prev => ({ ...prev, parcelas_pagas: parcelasError }));
      }
      if (field === 'parcelas_pagas' && formData.numero_de_parcelas) {
        const totalError = validateField('numero_de_parcelas', formData.numero_de_parcelas);
        setErrors(prev => ({ ...prev, numero_de_parcelas: totalError }));
      }
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

  // Check if form is valid and has changes
  const isFormValid = () => {
    if (!cartao) return false;
    
    const hasChanges = 
      formData.descricao !== (cartao.descricao || '') ||
      parseFloat(formData.valor_total) !== cartao.valor_total ||
      parseInt(formData.numero_de_parcelas) !== cartao.numero_de_parcelas ||
      parseInt(formData.parcelas_pagas) !== cartao.parcelas_pagas ||
      formData.data_compra !== (cartao.data_compra || '') ||
      formData.pessoa_id !== cartao.pessoa_id.toString() ||
      formData.observacoes !== (cartao.observacoes || '');
    
    return formData.descricao.trim().length >= 3 && 
           formData.valor_total.trim() &&
           formData.numero_de_parcelas.trim() &&
           formData.parcelas_pagas.trim() &&
           formData.data_compra &&
           formData.pessoa_id &&
           Object.values(errors).every(error => !error) &&
           hasChanges;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cartao) return;
    
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
      
      const cartaoAtualizado = {
        ...cartao,
        descricao: formData.descricao.trim(),
        valor_total: parseFloat(formData.valor_total.replace(',', '.')),
        numero_de_parcelas: parseInt(formData.numero_de_parcelas),
        parcelas_pagas: parseInt(formData.parcelas_pagas),
        data_compra: formData.data_compra,
        pessoa_id: formData.pessoa_id,
        observacoes: formData.observacoes.trim() || undefined,
      };

      updateCartao(cartaoAtualizado);
      
      addToast({ type: 'success', title: 'Cartão atualizado com sucesso!' });

      // Navigate back to card details after a short delay
      setTimeout(() => {
        navigate(`/cartoes/${cartao.id}`);
      }, 1000);

    } catch {
      addToast({ type: 'error', title: 'Erro ao atualizar cartão. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle navigation back
  const handleBack = () => {
    if (cartao) {
      navigate(`/cartoes/${cartao.id}`);
    } else {
      navigate('/pessoas');
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <PageLayout title="Editar Cartão">
        <LoadingOverlay isVisible={true} message="Carregando dados do cartão..." />
      </PageLayout>
    );
  }

  // Show not found state
  if (!cartao || !pessoa) {
    return (
      <PageLayout title="Cartão não encontrado">
        <Card className="text-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Cartão não encontrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                O cartão que você está tentando editar não existe ou foi removido.
              </p>
            </div>
            <PrimaryButton
              onClick={() => navigate('/pessoas')}
              variant="secondary"
              icon={<ArrowLeft size={16} />}
            >
              Voltar para Pessoas
            </PrimaryButton>
          </div>
        </Card>
      </PageLayout>
    );
  }

  // Calculate payment progress
  const progressPercentage = (parseInt(formData.parcelas_pagas) / parseInt(formData.numero_de_parcelas)) * 100;
  const isFullyPaid = parseInt(formData.parcelas_pagas) === parseInt(formData.numero_de_parcelas);

  return (
    <PageLayout title="Editar Cartão">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <PrimaryButton
          onClick={handleBack}
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={16} />}
          className="!p-2"
        >
          Voltar
        </PrimaryButton>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <CreditCard size={24} />
            Editar Cartão
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Atualize as informações do cartão de {pessoa.nome}
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
                label="Parcelas pagas"
                value={formData.parcelas_pagas}
                onChange={(value) => handleFieldChange('parcelas_pagas', value)}
                onBlur={() => handleFieldBlur('parcelas_pagas')}
                placeholder="0"
                type="number"
                error={errors.parcelas_pagas}
                required
                disabled={isSubmitting}
                icon={<CheckCircle size={16} />}
              />

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
            </div>

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
                  {pessoas.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
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

            {/* Payment Progress */}
            {formData.valor_total && formData.numero_de_parcelas && formData.parcelas_pagas && 
             !errors.valor_total && !errors.numero_de_parcelas && !errors.parcelas_pagas && (
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Progresso do Pagamento
                  </h4>
                  {isFullyPaid && (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle size={16} />
                      <span className="text-sm font-medium">Quitado</span>
                    </div>
                  )}
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isFullyPaid ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Valor por parcela:</span>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      R$ {(parseFloat(formData.valor_total.replace(',', '.')) / parseInt(formData.numero_de_parcelas)).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Restante:</span>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {parseInt(formData.numero_de_parcelas) - parseInt(formData.parcelas_pagas)} parcelas
                    </p>
                  </div>
                </div>
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
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </PrimaryButton>
        </FormActions>
      </FormLayout>

      {/* Loading Overlay */}
      {isSubmitting && (
        <LoadingOverlay isVisible={isSubmitting} message="Salvando alterações..." />
      )}
    </PageLayout>
  );
}
