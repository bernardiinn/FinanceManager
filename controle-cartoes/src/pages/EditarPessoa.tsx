/**
 * Enhanced Edit Person Page - Mobile-First PWA Design
 * Fully responsive with modern UX and accessibility features
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Mail, Phone, Save, ArrowLeft, AlertTriangle } from 'lucide-react';
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
  nome: string;
  telefone: string;
  email: string;
  observacoes: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function EditarPessoa() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pessoas, updatePessoa } = useAppData();
  const { addToast } = useToast();
  
  const pessoa = pessoas.find(p => p.id === id);
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    telefone: '',
    email: '',
    observacoes: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Initialize form data when person is loaded
  useEffect(() => {
    if (pessoa) {
      setFormData({
        nome: pessoa.nome || '',
        telefone: pessoa.telefone || '',
        email: pessoa.email || '',
        observacoes: pessoa.observacoes || ''
      });
      setIsLoading(false);
    } else if (pessoas.length > 0) {
      // Person not found and data is loaded
      setIsLoading(false);
    }
  }, [pessoa, pessoas]);

  // Real-time validation
  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'nome': {
        if (!value.trim()) {
          return 'O nome é obrigatório';
        }
        if (value.trim().length < 2) {
          return 'O nome deve ter pelo menos 2 caracteres';
        }
        if (value.trim().length > 100) {
          return 'O nome deve ter no máximo 100 caracteres';
        }
        // Check for duplicate names (excluding current person)
        const safePessoas = Array.isArray(pessoas) ? pessoas : [];
        const duplicateName = safePessoas.some(p => 
          p.nome && 
          p.nome.trim().toLowerCase() === value.trim().toLowerCase() &&
          p.id !== pessoa?.id
        );
        if (duplicateName) {
          return 'Já existe uma pessoa com esse nome';
        }
        return '';
      }

      case 'email':
        if (value && value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) {
            return 'Email inválido';
          }
        }
        return '';

      case 'telefone':
        if (value && value.trim()) {
          const phoneRegex = /^[\d\s\-()]+]+$/;
          if (!phoneRegex.test(value.trim())) {
            return 'Telefone deve conter apenas números, espaços, hífens, parênteses e sinal de mais';
          }
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
      const error = validateField(field, formData[field as keyof FormData]);
      if (error) {
        newErrors[field] = error;
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

  // Check if form is valid and has changes
  const isFormValid = () => {
    if (!pessoa) return false;
    
    const hasChanges = 
      formData.nome.trim() !== (pessoa.nome || '') ||
      formData.telefone.trim() !== (pessoa.telefone || '') ||
      formData.email.trim() !== (pessoa.email || '') ||
      formData.observacoes.trim() !== (pessoa.observacoes || '');
    
    return formData.nome.trim().length >= 2 && 
           Object.values(errors).every(error => !error) &&
           hasChanges;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pessoa) return;
    
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
      
      const pessoaAtualizada = {
        ...pessoa,
        nome: formData.nome.trim(),
        telefone: formData.telefone.trim() || undefined,
        email: formData.email.trim() || undefined,
        observacoes: formData.observacoes.trim() || undefined,
      };

      updatePessoa(pessoaAtualizada);
      
      addToast({ type: 'success', title: 'Pessoa atualizada com sucesso!' });

      // Navigate back to person details after a short delay
      setTimeout(() => {
        navigate(`/pessoas/${pessoa.id}`);
      }, 1000);

    } catch {
      addToast({ type: 'error', title: 'Erro ao atualizar pessoa. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle navigation back
  const handleBack = () => {
    if (pessoa) {
      navigate(`/pessoas/${pessoa.id}`);
    } else {
      navigate('/pessoas');
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <PageLayout title="Editar Pessoa">
        <LoadingOverlay isVisible={true} message="Carregando dados da pessoa..." />
      </PageLayout>
    );
  }

  // Show not found state
  if (!pessoa) {
    return (
      <PageLayout title="Pessoa não encontrada">
        <Card className="text-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Pessoa não encontrada
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                A pessoa que você está tentando editar não existe ou foi removida.
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

  return (
    <PageLayout title="Editar Pessoa">
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
            <User size={24} />
            Editar Pessoa
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Atualize as informações de {pessoa.nome}
          </p>
        </div>
      </div>

      <FormLayout onSubmit={handleSubmit}>
        <Card>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Informações Básicas
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Campos marcados com * são obrigatórios
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            <TextInput
              label="Nome completo"
              value={formData.nome}
              onChange={(value) => handleFieldChange('nome', value)}
              onBlur={() => handleFieldBlur('nome')}
              placeholder="Digite o nome completo"
              error={errors.nome}
              required
              disabled={isSubmitting}
              icon={<User size={16} />}
              autoComplete="name"
            />

            <TextInput
              label="Telefone"
              value={formData.telefone}
              onChange={(value) => handleFieldChange('telefone', value)}
              onBlur={() => handleFieldBlur('telefone')}
              placeholder="(11) 99999-9999"
              type="tel"
              error={errors.telefone}
              disabled={isSubmitting}
              icon={<Phone size={16} />}
              autoComplete="tel"
            />

            <TextInput
              label="Email"
              value={formData.email}
              onChange={(value) => handleFieldChange('email', value)}
              onBlur={() => handleFieldBlur('email')}
              placeholder="pessoa@exemplo.com"
              type="email"
              error={errors.email}
              disabled={isSubmitting}
              icon={<Mail size={16} />}
              autoComplete="email"
            />

            <TextArea
              label="Observações"
              value={formData.observacoes}
              onChange={(value) => handleFieldChange('observacoes', value)}
              onBlur={() => handleFieldBlur('observacoes')}
              placeholder="Informações adicionais sobre a pessoa (opcional)"
              error={errors.observacoes}
              disabled={isSubmitting}
              rows={4}
            />
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
