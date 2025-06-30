import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Save, Phone, Mail, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button';
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
        observacoes: formData.observacoes.trim() || undefined
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
    <div className="page">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/pessoas">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="icon-sm" />
              </Button>
            </Link>
            <h1 className="page-title">
              <User className="icon" />
              Adicionar Pessoa
            </h1>
          </div>
          <p className="page-description">
            Cadastre uma nova pessoa para emprestar cartões
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <div className="card-header">
            <h3>Informações Básicas</h3>
          </div>
          <div className="card-body space-y-6">
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
              label="Telefone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={formData.telefone}
              onChange={(e) => handleChange('telefone', e.target.value)}
              error={errors.telefone}
              disabled={isSubmitting}
              startIcon={<Phone size={16} />}
            />

            <Input
              label="Email"
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
                Observações
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

        <div className="form-actions">
          <Link to="/pessoas">
            <Button variant="ghost" disabled={isSubmitting}>
              Cancelar
            </Button>
          </Link>
          <Button 
            type="submit" 
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            <Save className="icon-sm" />
            Adicionar Pessoa
          </Button>
        </div>
      </form>
    </div>
  );
}
