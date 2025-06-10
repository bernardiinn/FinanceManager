import { Link } from 'react-router-dom';
import { useState } from 'react';
import type { Pessoa } from '../types';
import PessoaCard from '../components/PessoaCard';

interface PessoasProps {
  pessoas: Pessoa[];
}

function calcularSaldo(p: Pessoa) {
  return p.cartoes.reduce((s, c) => {
    const recebido = (c.valor_total * c.parcelas_pagas) / c.numero_de_parcelas;
    return s + (c.valor_total - recebido);
  }, 0);
}

export default function Pessoas({ pessoas }: PessoasProps) {
  const [busca, setBusca] = useState('');
  const pessoasFiltradas = pessoas.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );
  return (
    <div className="container">
      <h2>Lista de Pessoas</h2>
      <input
        type="text"
        placeholder="Buscar por nome..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
        style={{ marginBottom: 16, padding: 8, borderRadius: 6, border: '1.5px solid #e0e0e0', width: '100%' }}
      />
      <ul style={{ padding: 0, listStyle: 'none' }}>
        {pessoasFiltradas.length === 0 && <li>Nenhuma pessoa encontrada.</li>}
        {pessoasFiltradas.map(p => (
          <li key={p.id} style={{ marginBottom: 12 }}>
            <Link to={`/pessoa/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <PessoaCard pessoa={p} />
              <p style={{ margin: '2px 0 0 0', color: '#007bff', fontWeight: 600 }}>
                Saldo a receber: R$ {calcularSaldo(p).toFixed(2)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
