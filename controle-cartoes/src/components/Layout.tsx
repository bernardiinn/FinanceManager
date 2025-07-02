/**
 * Enhanced Layout Component - Mobile-First PWA Design
 * Fully r            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={theme.isLight ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme.isLight ? <Moon size={20} /> : <Sun size={20} />}
            </button>ve with modern UX and accessibility features
 */

import React, { useState } from 'react';
import { Sun, Moon, Menu, X, CreditCard, LogOut } from 'lucide-react';
import { useTheme, useMediaQuery } from '../hooks';
import { useSession } from '../hooks/useSession';
import type { BaseComponentProps } from '../types';
import Navigation from './Navigation';

interface LayoutProps extends BaseComponentProps {
  title?: string;
  showNavigation?: boolean;
  showThemeToggle?: boolean;
  navigation?: React.ReactNode;
  actions?: React.ReactNode;
}

interface HeaderProps {
  title?: string;
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
  actions?: React.ReactNode;
}

interface SidebarProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title = "Controle de Cartões",
  onMenuToggle,
  showMenuButton = false,
  actions,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, logout } = useSession();

  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja fazer logout?')) {
      await logout();
      window.location.href = '/login';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {showMenuButton && (
              <button
                onClick={onMenuToggle}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden"
                aria-label="Toggle menu"
              >
                <Menu size={20} />
              </button>
            )}
            
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 hidden sm:block">
                {title}
              </h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {actions}
            
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                aria-label="Logout"
                title="Fazer Logout"
              >
                <LogOut size={20} />
              </button>
            )}
            
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              aria-label={theme.isLight ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme.isLight ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  className = '',
}) => {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 
          transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${className}
        `}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Controle de Cartões
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="p-4 space-y-2">
          <Navigation onItemClick={onClose} />
        </div>
      </aside>
    </>
  );
};

export const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  showNavigation = true,
  actions,
  className = '',
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <Header
        title={title}
        onMenuToggle={handleMenuToggle}
        showMenuButton={showNavigation && !isDesktop}
        actions={actions}
      />

      <div className="flex">
        {/* Sidebar for desktop */}
        {showNavigation && isDesktop && (
          <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 min-h-[calc(100vh-4rem)]">
            <div className="p-4 space-y-2">
              <Navigation />
            </div>
          </aside>
        )}

        {/* Mobile sidebar */}
        {showNavigation && !isDesktop && (
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={handleSidebarClose}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
          
          {/* Deployment Status Footer */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed bottom-4 right-4 z-50">
              <div className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg text-xs font-medium">
                ⚙️ Dev Mode – VM External Access Enabled
                <div className="text-blue-200 text-xs">
                  v0.1-initial | IP Access Ready
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Layout;
