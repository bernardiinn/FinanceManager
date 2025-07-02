import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Save, Phone, Mail, FileText } from 'lucide-react';
import { Card } from '../components/ui/Card';
import Input from '../components/ui/Input';
import { useAppData } from '../hooks';
import { useToast } from '../components/Toast';

export default function AdicionarPessoa() {
  const navigate = useNavigate();
  const { pessoas, addPessoa } = useAppData();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    observacoes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate name
    if (!formData.nome.trim()) {
      newErrors.nome = 'O nome é obrigatório';
    } else if (formData.nome.trim().length < 2) {
      newErrors.nome = 'O nome deve ter pelo menos 2 caracteres';
    } else if (formData.nome.trim().length > 100) {
      newErrors.nome = 'O nome deve ter no máximo 100 caracteres';
    } else {
      // Check for duplicate names (case-insensitive)
      const safePessoas = Array.isArray(pessoas) ? pessoas : [];
      const duplicateName = safePessoas.some(p => 
        p.nome && p.nome.trim().toLowerCase() === formData.nome.trim().toLowerCase()
      );
      if (duplicateName) {
        newErrors.nome = 'Já existe uma pessoa com esse nome';
      }
    }

    // Validate email (optional but must be valid if provided)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Email inválido';
      }
    }

    // Validate phone (optional but must be valid if provided)
    if (formData.telefone && formData.telefone.trim()) {
      const phoneRegex = /^[\d\s\-()]+$/;
      if (!phoneRegex.test(formData.telefone.trim())) {
        newErrors.telefone = 'Telefone deve conter apenas números, espaços, hífens, parênteses e sinal de mais';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      addToast({ type: 'error', title: 'Verifique os campos obrigatórios antes de continuar' });
      return;
    }

    setIsSubmitting(true);
    setErrors({}); // Clear previous errors
    
    try {
      const novaPessoa = {
        nome: formData.nome.trim(),
        telefone: formData.telefone.trim() || undefined,
        email: formData.email.trim() || undefined,
        observacoes: formData.observacoes.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create new person and await completion
      const pessoaAdicionada = await addPessoa(novaPessoa);
      addToast({ type: 'success', title: 'Pessoa adicionada com sucesso!' });
      // Navigate to the new person's detail page
      navigate(`/pessoas/${pessoaAdicionada.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao adicionar pessoa';
      setErrors({ submit: `Erro ao adicionar pessoa: ${errorMessage}. Tente novamente.` });
      addToast({ type: 'error', title: 'Erro ao adicionar pessoa. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/pessoas">
            <button className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Adicionar Pessoa
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cadastre uma nova pessoa
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <Input
                label="Nome *"
                placeholder="Digite o nome completo"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                error={errors.nome}
                disabled={isSubmitting}
                startIcon={<User size={16} />}
                required
              />

              <Input
                label="Telefone (opcional)"
                type="tel"
                placeholder="(11) 99999-9999"
                value={formData.telefone}
                onChange={(e) => handleChange('telefone', e.target.value)}
                error={errors.telefone}
                disabled={isSubmitting}
                startIcon={<Phone size={16} />}
              />

              <Input
                label="Email (opcional)"
                type="email"
                placeholder="pessoa@exemplo.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={errors.email}
                disabled={isSubmitting}
                startIcon={<Mail size={16} />}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Observações (opcional)
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 pointer-events-none">
                    <FileText size={16} />
                  </div>
                  <textarea
                    placeholder="Informações adicionais (opcional)"
                    value={formData.observacoes}
                    onChange={(e) => handleChange('observacoes', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none"
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.observacoes && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.observacoes}
                  </p>
                )}
              </div>

              {errors.submit && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Link to="/pessoas" className="flex-1">
              <button 
                type="button"
                className="w-full py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
            </Link>
            <button 
              type="submit"
              className="flex-1 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save size={16} />
              )}
              {isSubmitting ? 'Adicionando...' : 'Adicionar Pessoa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
