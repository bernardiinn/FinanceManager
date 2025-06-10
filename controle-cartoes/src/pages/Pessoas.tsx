import { Link } from 'react-router-dom';
import type { Pessoa } from '../types';

interface PessoasProps {
  pessoas: Pessoa[];
}

export default function Pessoas({ pessoas }: PessoasProps) {
  return (
    <div className="container">
      <h2>Lista de Pessoas</h2>
      <ul style={{ padding: 0, listStyle: 'none' }}>
        {pessoas.map(p => (
          <li key={p.id} style={{ marginBottom: 12 }}>
            <Link to={`/pessoa/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card">
                <h4 style={{ margin: 0 }}>{p.nome}</h4>
                <p style={{ margin: '4px 0 0 0', color: '#555' }}>{p.cartoes.length} cartões</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
