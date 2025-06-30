/**
 * Enhanced Navigation Component - Mobile-First PWA Design
 * Fully responsive with modern UX and accessibility features
 */

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Users, 
  CreditCard,
  Plus,
  BarChart3, 
  Settings, 
  Download,
  ChevronDown,
  ChevronRight,
  List,
  DollarSign
} from 'lucide-react';
import type { BaseComponentProps } from '../types';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
  children?: NavItem[];
}

interface NavigationProps extends BaseComponentProps {
  variant?: 'sidebar' | 'horizontal';
  showLabels?: boolean;
  onItemClick?: () => void;
}

const navItems: NavItem[] = [
  {
    path: '/',
    label: 'Dashboard',
    icon: <Home size={20} />,
  },
  {
    path: '/pessoas',
    label: 'Pessoas',
    icon: <Users size={20} />,
    children: [
      {
        path: '/pessoas',
        label: 'Ver Pessoas',
        icon: <Users size={18} />,
      },
    ],
  },
  {
    path: '/emprestimos',
    label: 'Empréstimos',
    icon: <CreditCard size={20} />,
    children: [
      {
        path: '/emprestimos/gerenciar',
        label: 'Gerenciar Empréstimos',
        icon: <List size={18} />,
      },
    ],
  },
  {
    path: '/gastos',
    label: 'Gastos',
    icon: <DollarSign size={20} />,
    children: [
      {
        path: '/gastos',
        label: 'Ver Gastos',
        icon: <DollarSign size={18} />,
      },
      {
        path: '/gastos/adicionar',
        label: 'Adicionar Gasto',
        icon: <Plus size={18} />,
      },
    ],
  },
  {
    path: '/recorrencias',
    label: 'Recorrentes',
    icon: <CreditCard size={20} />,
    children: [
      {
        path: '/recorrencias',
        label: 'Ver Recorrências',
        icon: <CreditCard size={18} />,
      },
      {
        path: '/recorrencias/adicionar',
        label: 'Nova Recorrência',
        icon: <Plus size={18} />,
      },
    ],
  },
  {
    path: '/analytics',
    label: 'Relatórios',
    icon: <BarChart3 size={20} />,
  },
  {
    path: '/export',
    label: 'Backup',
    icon: <Download size={20} />,
  },
  {
    path: '/settings',
    label: 'Configurações',
    icon: <Settings size={20} />,
  },
];

export const Navigation: React.FC<NavigationProps> = ({ 
  variant = 'sidebar',
  showLabels = true,
  onItemClick,
  className = '' 
}) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (path: string) => {
    setExpandedItems(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const isExpanded = (path: string) => expandedItems.includes(path);

  const baseNavClass = variant === 'sidebar' 
    ? 'flex flex-col space-y-1' 
    : 'flex space-x-1 overflow-x-auto';

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isItemExpanded = isExpanded(item.path);

    return (
      <li key={item.path}>
        {hasChildren ? (
          <>
            {/* Parent item with expand/collapse */}
            <button
              onClick={() => toggleExpanded(item.path)}
              className={`
                w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                text-sm font-medium group
                ${showLabels ? 'min-h-[44px]' : 'min-h-[44px] min-w-[44px]'}
                ${depth > 0 ? 'ml-6 pl-2' : ''}
                text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                touch-target
              `}
            >
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 flex items-center justify-center">
                  {item.icon}
                </span>
                {showLabels && (
                  <span className={`flex-1 truncate text-left ${variant === 'horizontal' ? 'hidden sm:block' : ''}`}>
                    {item.label}
                  </span>
                )}
              </div>
              {showLabels && (
                <span className="flex-shrink-0">
                  {isItemExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
              )}
            </button>

            {/* Children items */}
            {isItemExpanded && item.children && (
              <ul className="mt-1 space-y-1">
                {item.children.map(child => renderNavItem(child, depth + 1))}
              </ul>
            )}
          </>
        ) : (
          /* Regular nav link */
          <NavLink
            to={item.path}
            onClick={onItemClick}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
              text-sm font-medium relative group
              ${showLabels ? 'min-h-[44px]' : 'min-h-[44px] min-w-[44px] justify-center'}
              ${depth > 0 ? 'ml-6 pl-2' : ''}
              ${item.disabled 
                ? 'opacity-50 cursor-not-allowed pointer-events-none' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }
              ${isActive 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm' 
                : 'text-gray-700 dark:text-gray-300'
              }
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              touch-target
            `}
            aria-disabled={item.disabled}
          >
            {/* Icon */}
            <span className="flex-shrink-0 flex items-center justify-center">
              {item.icon}
            </span>

            {/* Label */}
            {showLabels && (
              <span className={`flex-1 truncate ${variant === 'horizontal' ? 'hidden sm:block' : ''}`}>
                {item.label}
              </span>
            )}

            {/* Badge */}
            {item.badge && (
              <span className="flex-shrink-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                {item.badge}
              </span>
            )}

            {/* Active indicator for sidebar */}
            {variant === 'sidebar' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 dark:bg-blue-400 rounded-r-full opacity-0 group-[.active]:opacity-100 transition-opacity duration-200" />
            )}
          </NavLink>
        )}
      </li>
    );
  };

  return (
    <nav className={`${className}`} role="navigation" aria-label="Main navigation">
      <ul className={baseNavClass}>
        {navItems.map(item => renderNavItem(item))}
      </ul>

      {/* Mobile bottom navigation hint */}
      {variant === 'horizontal' && (
        <div className="flex justify-center mt-2 sm:hidden">
          <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>
      )}
    </nav>
  );
};

export default Navigation;
