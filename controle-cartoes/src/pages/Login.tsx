import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { PrimaryButton } from '../components/ui/FormComponents';
import { Card } from '../components/ui/Card';
import { FormField, FormError } from '../components/ui/Form';
import { Input } from '../components/ui/Input';
import { useSession } from '../hooks/useSession';
import { useToast } from '../components/Toast';

interface FormErrors {
  email?: string;
  password?: string;
  submit?: string;
}

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, isAuthenticated } = useSession();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    try {
      await login(formData.email.trim(), formData.password);
      addToast({
        type: 'success',
        title: 'Login realizado com sucesso!',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer login. Verifique suas credenciais.';
      setErrors({ submit: errorMessage });
      addToast({
        type: 'error',
        title: 'Erro no login',
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Fazer Login
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Entre na sua conta para acessar seus dados
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
              label="Email"
              required
              error={errors.email}
            >
              <Input
                startIcon={<Mail size={20} />}
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={isLoading}
                autoFocus
                autoComplete="email"
              />
            </FormField>

            <FormField
              label="Senha"
              required
              error={errors.password}
            >
              <div className="relative">
                <Input
                  startIcon={<Lock size={20} />}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  endIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  }
                />
              </div>
            </FormField>

            {errors.submit && <FormError message={errors.submit} />}

            <PrimaryButton
              type="submit"
              size="lg"
              icon={<LogIn />}
              loading={isLoading}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </PrimaryButton>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Não tem uma conta?{' '}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Criar conta
              </Link>
            </p>
          </div>

          {/* Privacy Note */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-300 text-center">
              🔒 Suas credenciais são criptografadas e seus dados ficam seguros na nuvem
            </p>
          </div>

          {/* Debug Info (visible for mobile troubleshooting)
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg text-xs text-yellow-800 dark:text-yellow-200 whitespace-pre-wrap break-all">
            <strong>Debug Info:</strong>
            <div>{debugInfo}</div>
            <div>isAuthenticated: {String(isAuthenticated)}</div>
            <div>isLoading: {String(isLoading)}</div>
            <div>Email: {formData.email}</div>
            <div>API URL: {import.meta.env.VITE_API_URL}</div>
          </div> */}
        </Card>
      </div>
    </div>
  );
}
