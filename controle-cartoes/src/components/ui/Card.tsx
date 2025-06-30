/**
 * Modern Card Component with variants and animations
 */

import React from 'react';
import type { BaseComponentProps } from '../../types';

interface CardProps extends BaseComponentProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  hover?: boolean;
  clickable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

interface CardHeaderProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

interface CardBodyProps extends BaseComponentProps {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

interface CardFooterProps extends BaseComponentProps {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  hover = false,
  clickable = false,
  padding = 'md',
  onClick,
}) => {
  const baseClasses = 'card';
  const variantClasses = {
    default: '',
    elevated: 'card-elevated',
    outlined: 'card-outlined',
    filled: 'card-filled',
  };
  const hoverClass = hover || clickable ? 'card-hover' : '';
  const clickableClass = clickable ? 'cursor-pointer' : '';
  const paddingClasses = {
    none: '',
    sm: 'card-padding-sm',
    md: '',
    lg: 'card-padding-lg',
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    hoverClass,
    clickableClass,
    paddingClasses[padding],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} onClick={onClick} role={clickable ? 'button' : undefined}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
  title,
  subtitle,
  actions,
}) => {
  const classes = ['card-header', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className="card-header-content">
        {title && (
          <div className="card-header-text">
            <h3 className="card-title">{title}</h3>
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
      {actions && <div className="card-header-actions">{actions}</div>}
    </div>
  );
};

export const CardBody: React.FC<CardBodyProps> = ({
  children,
  className = '',
  padding = 'md',
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-2',
    md: 'card-body',
    lg: 'p-6',
  };

  const classes = [paddingClasses[padding], className].filter(Boolean).join(' ');

  return <div className={classes}>{children}</div>;
};

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
  padding = 'md',
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-2',
    md: 'card-footer',
    lg: 'p-6',
  };

  const classes = [paddingClasses[padding], className].filter(Boolean).join(' ');

  return <div className={classes}>{children}</div>;
};

// Compound component
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
