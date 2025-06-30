/**
 * Enhanced People Page - Mobile-First PWA Design
 * Fully responsive with modern UX and accessibility features
 */

import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { Plus, Search, Users, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import type { Pessoa } from '../types';
import PessoaCard from '../components/PessoaCard';
import { PrimaryButton } from '../components/ui/FormComponents';
import { PageLayout, Card } from '../components/ui/Layout';
import Input from '../components/ui/Input';
import { useAppData } from '../hooks';
import { financeService } from '../services/financeService';

export default function Pessoas() {
  const { pessoas } = useAppData();
  const [busca, setBusca] = useState('');

  const pessoasFiltradas = useMemo(() => {
    return pessoas.filter(p =>
      p.nome.toLowerCase().includes(busca.toLowerCase())
    );
  }, [pessoas, busca]);

  const stats = useMemo(() => {
    const totalPessoas = pessoas.length;
    const totalDevendo = pessoas.filter(p => financeService.calcularSaldoPessoa(p).outstanding > 0).length;
    const totalSaldo = pessoas.reduce((acc, p) => acc + financeService.calcularSaldoPessoa(p).outstanding, 0);

    return { totalPessoas, totalDevendo, totalSaldo };
  }, [pessoas]);

  return (
    <PageLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2">
            <Users size={24} />
            Pessoas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie as pessoas que possuem cartões emprestados
          </p>
        </div>
        <Link to="/pessoas/adicionar" className="flex-shrink-0">
          <PrimaryButton
            icon={<Plus size={16} />}
            className="w-full sm:w-auto"
          >
            Adicionar Pessoa
          </PrimaryButton>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Total de Pessoas
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalPessoas}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Com Pendências
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalDevendo}
              </p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Total a Receber
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                R$ {stats.totalSaldo.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4 mb-6">
        <Input
          placeholder="Buscar pessoas por nome..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          startIcon={<Search size={16} />}
          fullWidth
        />
      </Card>

      {/* People List */}
      <div className="space-y-4">
        {pessoasFiltradas.length === 0 ? (
          <Card className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                <Users className="h-12 w-12 text-gray-400 dark:text-gray-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {busca ? 'Nenhuma pessoa encontrada' : 'Nenhuma pessoa cadastrada'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  {busca 
                    ? 'Tente ajustar sua busca ou verificar a ortografia'
                    : 'Comece adicionando uma pessoa para emprestar cartões'
                  }
                </p>
              </div>
              {!busca && (
                <Link to="/pessoas/adicionar">
                  <PrimaryButton
                    icon={<Plus size={16} />}
                    variant="secondary"
                  >
                    Adicionar Primeira Pessoa
                  </PrimaryButton>
                </Link>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pessoasFiltradas.map(pessoa => (
              <Link 
                key={pessoa.id} 
                to={`/pessoas/${pessoa.id}`}
                className="block transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
              >
                <PessoaCard pessoa={pessoa} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Button for Mobile */}
      {pessoasFiltradas.length > 0 && (
        <div className="fixed bottom-6 right-6 sm:hidden">
          <Link to="/pessoas/adicionar">
            <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <Plus size={24} />
            </button>
          </Link>
        </div>
      )}
    </PageLayout>
  );
}
