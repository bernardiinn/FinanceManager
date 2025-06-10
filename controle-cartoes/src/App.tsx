import { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import Pessoas from './pages/Pessoas';
import PessoaDetalhe from './pages/PessoaDetalhe';
import AdicionarPessoa from './pages/AdicionarPessoa';
import type { Pessoa } from './types';
import AdicionarCartao from './pages/AdicionarCartao';
import EditarPessoa from './pages/EditarPessoa';
import EditarCartao from './pages/EditarCartao';
import './App.css';


function App() {
  // Carregar do localStorage ao iniciar
  const [pessoas, setPessoas] = useState<Pessoa[]>(() => {
    const data = localStorage.getItem('pessoas');
    return data ? JSON.parse(data) : [];
  });

  // Salvar no localStorage sempre que pessoas mudar
  useEffect(() => {
    localStorage.setItem('pessoas', JSON.stringify(pessoas));
  }, [pessoas]);

  return (
    <div style={{ padding: '20px' }}>
      <nav>
        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
        <NavLink to="/pessoas" className={({ isActive }) => isActive ? 'active' : ''}>Pessoas</NavLink>
        <NavLink to="/adicionar-pessoa" className={({ isActive }) => isActive ? 'active' : ''}>Adicionar Pessoa</NavLink>
      </nav>
      <hr />
      <Routes>
        <Route path="/" element={<Home pessoas={pessoas} />} />
        <Route path="/pessoas" element={<Pessoas pessoas={pessoas} />} />
        <Route path="/pessoa/:id" element={<PessoaDetalhe pessoas={pessoas} setPessoas={setPessoas} />} />
        <Route path="/adicionar-pessoa" element={<AdicionarPessoa setPessoas={setPessoas} />} />
        <Route path="/pessoa/:id/adicionar-cartao" element={<AdicionarCartao pessoas={pessoas} setPessoas={setPessoas} />} />
        <Route path="/pessoa/:id/editar" element={<EditarPessoa pessoas={pessoas} setPessoas={setPessoas} />} />
        <Route path="/pessoa/:id/cartao/:cartaoId/editar" element={<EditarCartao pessoas={pessoas} setPessoas={setPessoas} />} />
      </Routes>
    </div>
  );
}

export default App;
