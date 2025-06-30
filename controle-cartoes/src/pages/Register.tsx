import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Eye, EyeOff, Sparkles } from 'lucide-react';
import { PrimaryButton } from '../components/ui/FormComponents';
import { Card } from '../components/ui/Card';
import { FormField, FormError } from '../components/ui/Form';
import { Input } from '../components/ui/Input';
import { useSession } from '../hooks/useSession';
import { useToast } from '../components/Toast';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  submit?: string;
}

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isLoading, isAuthenticated } = useSession();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Redirect if user becomes authenticated
  useEffect(() => {
    setDebugInfo(prev => prev + `\n[useEffect] isAuthenticated: ${isAuthenticated}`);
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      setDebugInfo(prev => prev + `\n[useEffect] Redirecting to: ${from}`);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'O nome deve ter pelo menos 2 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Por favor, insira um email válido';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setDebugInfo(prev => prev + `\n[validateForm] Errors: ${JSON.stringify(newErrors)}`);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDebugInfo(prev => prev + '\n[handleSubmit] Submit triggered');
    if (!validateForm()) {
      setDebugInfo(prev => prev + '\n[handleSubmit] Validation failed');
      return;
    }
    setDebugInfo(prev => prev + '\n[handleSubmit] Validation passed');
    try {
      setDebugInfo(prev => prev + `\n[handleSubmit] Registering: ${formData.email}`);
      await register(formData.email.trim(), formData.password, formData.name.trim());
      setDebugInfo(prev => prev + '\n[handleSubmit] Register success');
      addToast({
        type: 'success',
        title: 'Conta criada com sucesso!',
        description: `Bem-vindo, ${formData.name}! Sua conta foi criada e você já está logado.`
      });
    } catch (error: any) {
      setDebugInfo(prev => prev + `\n[handleSubmit] Register error: ${error?.message}`);
      setErrors({ submit: error.message || 'Erro ao criar conta. Tente novamente.' });
      addToast({
        type: 'error',
        title: 'Erro ao criar conta',
        description: error.message || 'Ocorreu um erro ao criar sua conta. Tente novamente.'
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setDebugInfo(prev => prev + `\n[handleChange] ${field}: ${value}`);
    // Clear errors when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (errors.submit) {
      setErrors(prev => ({ ...prev, submit: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Criar Conta
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Crie sua conta para sincronizar seus dados
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
              label="Nome completo"
              required
              error={errors.name}
            >
              <Input
                icon={<User size={20} />}
                placeholder="Seu nome completo"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={isLoading}
                autoFocus
                autoComplete="name"
              />
            </FormField>

            <FormField
              label="Email"
              required
              error={errors.email}
            >
              <Input
                icon={<Mail size={20} />}
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={isLoading}
                autoComplete="email"
              />
            </FormField>

            <FormField
              label="Senha"
              required
              error={errors.password}
              help="Mínimo de 6 caracteres"
            >
              <div className="relative">
                <Input
                  icon={<Lock size={20} />}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </FormField>

            <FormField
              label="Confirmar senha"
              required
              error={errors.confirmPassword}
            >
              <div className="relative">
                <Input
                  icon={<Lock size={20} />}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Digite novamente sua senha"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </FormField>

            {errors.submit && <FormError message={errors.submit} />}

            <PrimaryButton
              type="submit"
              size="lg"
              icon={<UserPlus />}
              loading={isLoading}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Criando conta...' : 'Criar conta'}
            </PrimaryButton>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Já tem uma conta?{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Fazer login
              </Link>
            </p>
          </div>

          {/* Privacy Note */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-300 text-center">
              🔒 Ao criar uma conta, você concorda que seus dados serão criptografados e armazenados com segurança
            </p>
          </div>

          {/* Debug Info (visible for mobile troubleshooting) */}
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg text-xs text-yellow-800 dark:text-yellow-200 whitespace-pre-wrap break-all">
            <strong>Debug Info:</strong>
            <div>{debugInfo}</div>
            <div>isAuthenticated: {String(isAuthenticated)}</div>
            <div>isLoading: {String(isLoading)}</div>
            <div>Email: {formData.email}</div>
            <div>Name: {formData.name}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
