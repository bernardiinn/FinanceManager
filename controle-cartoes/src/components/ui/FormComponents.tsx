/**
 * Modern, Responsive Form Components with Tailwind CSS
 * Optimized for Mobile-First PWA Design with Enhanced Accessibility
 */

import React, { forwardRef, useState, useId } from 'react';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'password' | 'number' | 'date';
  error?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  autoComplete?: string;
  onBlur?: () => void;
  onFocus?: () => void;
  className?: string;
  inputMode?: 'text' | 'decimal' | 'numeric' | 'tel' | 'email';
}

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  onBlur?: () => void;
  onFocus?: () => void;
  className?: string;
  maxLength?: number;
}

interface FormFieldWrapperProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
  helpText?: string;
}

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

// Form Field Wrapper Component
export const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
  label,
  required,
  error,
  children,
  className = '',
  helpText
}) => {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  return (
    <div className={`space-y-2 ${className}`}>
      <label 
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-900 dark:text-gray-100"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      
      {React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
        id: fieldId,
        'aria-invalid': !!error,
        'aria-describedby': error ? errorId : helpText ? helpId : undefined,
      })}
      
      {helpText && !error && (
        <p id={helpId} className="text-sm text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}
      
      {error && (
        <div 
          id={errorId}
          className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle size={16} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// Enhanced Text Input Component
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ 
    label, 
    value, 
    onChange, 
    placeholder, 
    type = 'text', 
    error, 
    required, 
    disabled, 
    icon,
    autoComplete,
    onBlur,
    onFocus,
    className = '',
    inputMode,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const fieldId = useId();

    const inputType = type === 'password' && showPassword ? 'text' : type;

    const baseClasses = `
      w-full py-3 rounded-lg border transition-all duration-200 ease-in-out text-sm
      placeholder-gray-500 dark:placeholder-gray-400
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50
      bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white
      ${icon ? 'pl-10 pr-4' : 'px-4'}
      ${type === 'password' ? 'pr-12' : ''}
    `;

    const stateClasses = error 
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
      : isFocused
        ? 'border-blue-500 ring-2 ring-blue-500/20'
        : 'border-gray-300 dark:border-gray-600';

    const handleFocus = () => {
      setIsFocused(true);
      onFocus?.();
    };

    const handleBlur = () => {
      setIsFocused(false);
      onBlur?.();
    };

    return (
      <FormFieldWrapper label={label} required={required} error={error} className={className}>
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 pointer-events-none">
              {icon}
            </div>
          )}
          
          <input
            {...props}
            ref={ref}
            id={fieldId}
            type={inputType}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            autoComplete={autoComplete}
            inputMode={inputMode}
            className={`${baseClasses} ${stateClasses}`}
            aria-invalid={!!error}
          />

          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:text-blue-500 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
      </FormFieldWrapper>
    );
  }
);

TextInput.displayName = 'TextInput';

// Enhanced TextArea Component
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ 
    label, 
    value, 
    onChange, 
    placeholder, 
    error, 
    required, 
    disabled, 
    rows = 4,
    onBlur,
    onFocus,
    className = '',
    maxLength,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const fieldId = useId();

    const baseClasses = `
      w-full px-4 py-3 rounded-lg border transition-all duration-200 ease-in-out text-sm
      placeholder-gray-500 dark:placeholder-gray-400
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50
      bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white
      resize-y min-h-[100px]
    `;

    const stateClasses = error 
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
      : isFocused
        ? 'border-blue-500 ring-2 ring-blue-500/20'
        : 'border-gray-300 dark:border-gray-600';

    const handleFocus = () => {
      setIsFocused(true);
      onFocus?.();
    };

    const handleBlur = () => {
      setIsFocused(false);
      onBlur?.();
    };

    const helpText = maxLength ? `${value.length}/${maxLength} caracteres` : undefined;

    return (
      <FormFieldWrapper 
        label={label} 
        required={required} 
        error={error} 
        className={className}
        helpText={helpText}
      >
        <textarea
          {...props}
          ref={ref}
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`${baseClasses} ${stateClasses}`}
          aria-invalid={!!error}
        />
      </FormFieldWrapper>
    );
  }
);

TextArea.displayName = 'TextArea';

// Enhanced Primary Button Component
export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  className = ''
}) => {
  const baseClasses = `
    inline-flex items-center justify-center gap-2 rounded-lg font-medium 
    transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 
    focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
    active:transform active:scale-[0.98]
  `;

  const variantClasses = {
    primary: `
      bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl
      focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700
    `,
    secondary: `
      bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300
      focus:ring-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white dark:border-gray-600
    `,
    ghost: `
      bg-transparent hover:bg-gray-100 text-gray-700 
      focus:ring-gray-500 dark:hover:bg-gray-800 dark:text-gray-300
    `,
    danger: `
      bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl
      focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700
    `
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const widthClasses = fullWidth ? 'w-full' : '';

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClasses}
        ${className}
      `}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
          <span>Processando...</span>
        </>
      ) : (
        <>
          {icon && <span className="text-lg">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

// Success Toast Component
export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'success', 
  onClose,
  duration = 3000 
}) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const typeClasses = {
    success: 'bg-green-100 border-green-400 text-green-800 dark:bg-green-900/30 dark:border-green-500 dark:text-green-200',
    error: 'bg-red-100 border-red-400 text-red-800 dark:bg-red-900/30 dark:border-red-500 dark:text-red-200',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-500 dark:text-yellow-200',
    info: 'bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-200'
  };

  const iconMap = {
    success: <Check size={20} />,
    error: <AlertCircle size={20} />,
    warning: <AlertCircle size={20} />,
    info: <AlertCircle size={20} />
  };

  return (
    <div className={`
      fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
      transform transition-all duration-300 ease-in-out
      ${typeClasses[type]}
    `}>
      {iconMap[type]}
      <span className="font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-current opacity-70 hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
};

// Export Input component
export { default as Input } from './Input';
export type { InputProps } from './Input';
