/**
 * Main Application Component with authentication and user profile support
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { DatabaseProvider } from './components/DatabaseProvider';
import AuthGuard from './components/AuthGuard';
import AuthRedirect from './components/AuthRedirect';
import { unifiedDatabaseService } from './services/unifiedDatabaseService';
import { useSession } from './hooks/useSession';

// Redirect component for legacy URLs
function RedirectToPessoa() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/pessoas/${id}`} replace />;
}

// Import pages
import Home from './pages/Home';
import Pessoas from './pages/Pessoas';
import PessoaDetalhe from './pages/PessoaDetalhe';
import AdicionarPessoa from './pages/AdicionarPessoa';
import AdicionarCartao from './pages/AdicionarCartao';
import AdicionarEmprestimo from './pages/AdicionarEmprestimo';
import GerenciarEmprestimos from './pages/GerenciarEmprestimos';
import EditarPessoa from './pages/EditarPessoa';
import EditarCartao from './pages/EditarCartao';
import CartaoDetalhe from './pages/CartaoDetalhe';

// Authentication pages
import Login from './pages/Login';
import Register from './pages/Register';

// New expense and recurring transaction pages
import Gastos from './pages/Gastos';
import AdicionarGasto from './pages/AdicionarGasto';
import EditarGasto from './pages/EditarGasto';
import Recorrencias from './pages/Recorrencias';
import AdicionarRecorrencia from './pages/AdicionarRecorrencia';
import EditarRecorrencia from './pages/EditarRecorrencia';

import Analytics from './pages/Analytics';
import Export from './pages/Export';
import Settings from './pages/Settings';

import './App.css';

// Main App Component
function AppContent() {
  const { isAuthenticated, isLoading } = useSession();
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  useEffect(() => {
    // Initialize profile check
    const initProfile = async () => {
      try {
        // Just mark profile checking as complete
        setIsCheckingProfile(false);
      } catch (error) {
        console.error('Profile initialization error:', error);
        setIsCheckingProfile(false);
      }
    };

    if (!isLoading) {
      initProfile();
    }
  }, [isLoading]);

  // Show loading while checking session and profile
  if (isLoading || isCheckingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes - Login and Register */}
      <Route path="/login" element={
        <AuthRedirect>
          <Login />
        </AuthRedirect>
      } />
      <Route path="/register" element={
        <AuthRedirect>
          <Register />
        </AuthRedirect>
      } />

      {/* Protected routes - Main app */}
      <Route path="/*" element={
        <AuthGuard>
          <DatabaseProvider>
            <Layout navigation={<Navigation />}>
              <Routes>
                <Route path="/" element={<Home />} />
                
                {/* People routes */}
                <Route path="/pessoas" element={<Pessoas />} />
                <Route path="/pessoas/adicionar" element={<AdicionarPessoa />} />
                <Route path="/pessoas/:id" element={<PessoaDetalhe />} />
                <Route path="/pessoas/:id/editar" element={<EditarPessoa />} />
                
                {/* Card routes */}
                <Route path="/cartoes/adicionar" element={<AdicionarCartao />} />
                <Route path="/emprestimos/adicionar" element={<AdicionarEmprestimo />} />
                <Route path="/emprestimos/gerenciar" element={<GerenciarEmprestimos />} />
                <Route path="/emprestimos/:id" element={<CartaoDetalhe />} />
                <Route path="/emprestimos/:id/editar" element={<EditarCartao />} />
                <Route path="/pessoas/:id/emprestimos/adicionar" element={<AdicionarEmprestimo />} />
                <Route path="/cartoes/:id" element={<CartaoDetalhe />} />
                <Route path="/cartoes/:id/editar" element={<EditarCartao />} />
                
                {/* Expense routes */}
                <Route path="/gastos" element={<Gastos />} />
                <Route path="/gastos/adicionar" element={<AdicionarGasto />} />
                <Route path="/gastos/:id/editar" element={<EditarGasto />} />
                
                {/* Recurring transaction routes */}
                <Route path="/recorrencias" element={<Recorrencias />} />
                <Route path="/recorrencias/adicionar" element={<AdicionarRecorrencia />} />
                <Route path="/recorrencias/:id/editar" element={<EditarRecorrencia />} />
                
                {/* Feature routes */}
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/export" element={<Export />} />
                <Route path="/settings" element={<Settings />} />
                
                {/* Legacy routes - redirect to new structure */}
                <Route path="/pessoa/:id" element={<RedirectToPessoa />} />
                <Route path="/adicionar-pessoa" element={<Navigate to="/pessoas/adicionar" replace />} />
                <Route path="/configuracoes" element={<Navigate to="/settings" replace />} />
                
                {/* 404 - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </DatabaseProvider>
        </AuthGuard>
      } />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
