/**
 * Reusable Input Component
 * Consistent design with dark mode support and accessibility
 */

import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  variant?: 'default' | 'filled';
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    helperText,
    startIcon,
    endIcon,
    variant = 'default',
    fullWidth = true,
    className,
    disabled,
    type = 'text',
    ...props
  }, ref) => {
    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Start Icon */}
          {startIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
              {startIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            className={cn(
              // Base styles
              'w-full rounded-lg border transition-all duration-200',
              'text-gray-900 dark:text-gray-100',
              'placeholder-gray-500 dark:placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              
              // Padding based on icons
              startIcon ? 'pl-10' : 'pl-4',
              endIcon ? 'pr-10' : 'pr-4',
              'py-3',
              
              // Variant styles
              variant === 'default' && [
                'bg-white dark:bg-gray-800',
                'border-gray-300 dark:border-gray-600',
                'hover:border-gray-400 dark:hover:border-gray-500',
              ],
              variant === 'filled' && [
                'bg-gray-50 dark:bg-gray-700',
                'border-gray-200 dark:border-gray-600',
                'hover:bg-gray-100 dark:hover:bg-gray-600',
              ],
              
              // Error state
              error && [
                'border-red-500 dark:border-red-400',
                'focus:ring-red-500 focus:border-red-500',
              ],
              
              // Disabled state
              disabled && [
                'opacity-50 cursor-not-allowed',
                'bg-gray-100 dark:bg-gray-800',
              ],
              
              className
            )}
            {...props}
          />

          {/* End Icon */}
          {endIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {endIcon}
            </div>
          )}
        </div>

        {/* Helper Text or Error */}
        {(helperText || error) && (
          <p className={cn(
            'text-sm',
            error 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-gray-600 dark:text-gray-400'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
