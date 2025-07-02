/**
 * Responsive Layout Components for PWA
 * Mobile-first design with desktop enhancements
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

interface FormLayoutProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
}

// Main Page Layout Component
export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  subtitle,
  backTo,
  icon,
  actions,
  className = ''
}) => {
  return (
    <div className={`
      min-h-[100dvh] bg-gray-50 dark:bg-gray-900 
      ios-safe-area iphone-container
      ${className}
    `}>
      {/* Mobile-first container with responsive max-width */}
      <div className="w-full max-w-screen-md mx-auto mobile-container">
        
        {/* Header Section */}
        <header className="py-4 sm:py-6" style={{
          paddingTop: 'max(1rem, calc(var(--safe-area-inset-top) + 1rem))'
        }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {backTo && (
                <Link 
                  to={backTo}
                  className="
                    p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm
                    hover:shadow-md transition-shadow duration-200
                    border border-gray-200 dark:border-gray-700
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    touch-manipulation shrink-0
                  "
                >
                  <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                </Link>
              )}
              
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {icon && (
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
                    <div className="text-blue-600 dark:text-blue-400">
                      {icon}
                    </div>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight truncate">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base line-clamp-2">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {actions && (
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {actions}
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="pb-8">
          {children}
        </main>
      </div>
    </div>
  );
};

// Enhanced Card Component
export const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
  padding = 'md'
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={`
      bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700
      hover:shadow-md transition-shadow duration-200
      ${className}
    `}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
      )}
      <div className={paddingClasses[padding]}>
        {children}
      </div>
    </div>
  );
};

// Form Layout Component
export const FormLayout: React.FC<FormLayoutProps> = ({
  children,
  onSubmit,
  className = ''
}) => {
  return (
    <form 
      onSubmit={onSubmit}
      className={`space-y-6 ${className}`}
      noValidate
    >
      {children}
    </form>
  );
};

// Form Actions Layout (for buttons)
interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
  layout?: 'horizontal' | 'vertical';
}

export const FormActions: React.FC<FormActionsProps> = ({
  children,
  className = '',
  layout = 'horizontal'
}) => {
  const layoutClasses = layout === 'horizontal' 
    ? 'flex flex-col sm:flex-row gap-3 sm:justify-end sm:items-center'
    : 'flex flex-col gap-3';

  return (
    <div className={`
      mt-8 pt-6 border-t border-gray-200 dark:border-gray-700
      ${layoutClasses}
      ${className}
    `}>
      {children}
    </div>
  );
};

// Loading Overlay Component
interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Carregando...'
}) => {
  if (!isVisible) return null;

  return (
    <div className="
      fixed inset-0 bg-black/50 backdrop-blur-sm z-50 
      flex items-center justify-center p-4
    ">
      <div className="
        bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl
        flex flex-col items-center gap-4 max-w-sm w-full
      ">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
        <p className="text-gray-900 dark:text-white font-medium">{message}</p>
      </div>
    </div>
  );
};

// Grid Layout Components for Cards - 2x2 layout (2 cards per row)
interface GridLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const TwoColumnGrid: React.FC<GridLayoutProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
      {children}
    </div>
  );
};
