import { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Pessoas from './pages/Pessoas';
import PessoaDetalhe from './pages/PessoaDetalhe';
import AdicionarPessoa from './pages/AdicionarPessoa';
import type { Pessoa } from './types';
import AdicionarCartao from './pages/AdicionarCartao';


function App() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);

  return (
    <div style={{ padding: '20px' }}>
      <nav>
        <Link to="/">Home</Link> |{' '}
        <Link to="/pessoas">Pessoas</Link> |{' '}
        <Link to="/adicionar-pessoa">Adicionar Pessoa</Link>
      </nav>
      <hr />
      <Routes>
        <Route path="/" element={<Home pessoas={pessoas} />} />
        <Route path="/pessoas" element={<Pessoas pessoas={pessoas} />} />
        <Route path="/pessoa/:id" element={<PessoaDetalhe pessoas={pessoas} setPessoas={setPessoas} />} />
        <Route path="/adicionar-pessoa" element={<AdicionarPessoa setPessoas={setPessoas} />} />
        <Route path="/pessoa/:id/adicionar-cartao" element={<AdicionarCartao pessoas={pessoas} setPessoas={setPessoas} />} />
      </Routes>
    </div>
  );
}

export default App;
