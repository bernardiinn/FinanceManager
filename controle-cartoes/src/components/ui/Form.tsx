/**
 * Modern Form Components with validation
 */

import React, { forwardRef } from 'react';
import type { BaseComponentProps, A11yProps, ValidationError } from '../../types';

interface FormGroupProps extends BaseComponentProps {
  error?: string;
}

interface LabelProps extends BaseComponentProps {
  htmlFor?: string;
  required?: boolean;
}

interface InputProps extends BaseComponentProps, A11yProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

interface TextareaProps extends BaseComponentProps, A11yProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  resize?: boolean;
  error?: string;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
}

interface SelectProps extends BaseComponentProps, A11yProps {
  value?: string | number;
  defaultValue?: string | number;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  placeholder?: string;
  options: Array<{ value: string | number; label: string; disabled?: boolean }>;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLSelectElement>) => void;
}

export const FormGroup: React.FC<FormGroupProps> = ({
  children,
  className = '',
  error,
}) => {
  const classes = ['form-group', error ? 'form-group-error' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      {children}
      {error && <div className="form-error">{error}</div>}
    </div>
  );
};

export const Label: React.FC<LabelProps> = ({
  children,
  className = '',
  htmlFor,
  required = false,
}) => {
  const classes = ['form-label', className].filter(Boolean).join(' ');

  return (
    <label htmlFor={htmlFor} className={classes}>
      {children}
      {required && <span className="form-label-required">*</span>}
    </label>
  );
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      type = 'text',
      error,
      size = 'md',
      icon,
      iconPosition = 'left',
      ...props
    },
    ref
  ) => {
    const baseClasses = 'form-control';
    const sizeClasses = {
      sm: 'form-control-sm',
      md: '',
      lg: 'form-control-lg',
    };
    const errorClass = error ? 'form-control-error' : '';
    const iconClass = icon ? 'form-control-with-icon' : '';

    const classes = [
      baseClasses,
      sizeClasses[size],
      errorClass,
      iconClass,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    if (icon) {
      return (
        <div className="form-control-wrapper">
          {iconPosition === 'left' && (
            <div className="form-control-icon form-control-icon-left">{icon}</div>
          )}
          <input ref={ref} type={type} className={classes} {...props} />
          {iconPosition === 'right' && (
            <div className="form-control-icon form-control-icon-right">{icon}</div>
          )}
        </div>
      );
    }

    return <input ref={ref} type={type} className={classes} {...props} />;
  }
);

Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className = '',
      rows = 3,
      resize = true,
      error,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'form-control';
    const errorClass = error ? 'form-control-error' : '';
    const resizeClass = resize ? '' : 'resize-none';

    const classes = [baseClasses, errorClass, resizeClass, className]
      .filter(Boolean)
      .join(' ');

    return <textarea ref={ref} rows={rows} className={classes} {...props} />;
  }
);

Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className = '',
      options,
      placeholder,
      error,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'form-control';
    const errorClass = error ? 'form-control-error' : '';

    const classes = [baseClasses, errorClass, className]
      .filter(Boolean)
      .join(' ');

    return (
      <select ref={ref} className={classes} {...props}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

Select.displayName = 'Select';

interface CheckboxProps extends BaseComponentProps, A11yProps {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: React.ReactNode;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className = '',
      label,
      error,
      ...props
    },
    ref
  ) => {
    const classes = ['form-checkbox', error ? 'form-checkbox-error' : '', className]
      .filter(Boolean)
      .join(' ');

    if (label) {
      return (
        <div className={classes}>
          <label className="form-checkbox-label">
            <input ref={ref} type="checkbox" className="form-checkbox-input" {...props} />
            <span className="form-checkbox-checkmark"></span>
            <span className="form-checkbox-text">{label}</span>
          </label>
          {error && <div className="form-error">{error}</div>}
        </div>
      );
    }

    return <input ref={ref} type="checkbox" className="form-checkbox-input" {...props} />;
  }
);

Checkbox.displayName = 'Checkbox';

interface FormFieldProps extends BaseComponentProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

interface FormErrorProps extends BaseComponentProps {
  message?: string;
}

// FormError component
export const FormError: React.FC<FormErrorProps> = ({ message, className = '', ...props }) => {
  if (!message) return null;
  
  return (
    <div
      className={`text-red-600 text-sm mt-1 ${className}`}
      role="alert"
      {...props}
    >
      {message}
    </div>
  );
};

// FormField component
export const FormField: React.FC<FormFieldProps> = ({ 
  label, 
  error, 
  required, 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      <Label required={required} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </Label>
      {children}
      <FormError message={error} />
    </div>
  );
};

// Form validation hook
// eslint-disable-next-line react-refresh/only-export-components
export const useFormValidation = (validationRules: Record<string, (value: unknown) => string | null>) => {
  const validateField = (name: string, value: unknown): string | null => {
    const rule = validationRules[name];
    return rule ? rule(value) : null;
  };

  const validateForm = (values: Record<string, unknown>): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    Object.keys(validationRules).forEach(field => {
      const error = validateField(field, values[field]);
      if (error) {
        errors.push({ field, message: error });
      }
    });

    return errors;
  };

  return { validateField, validateForm };
};
