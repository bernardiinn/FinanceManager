import type { Pessoa } from '../types';

interface PessoaCardProps {
  pessoa: Pessoa;
}

export default function PessoaCard({ pessoa }: PessoaCardProps) {
  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 8, boxShadow: '0 2px 8px #eee', padding: '10px', marginBottom: '10px', background: '#fafbfc' }}>
      <h4 style={{ margin: 0 }}>{pessoa.nome}</h4>
      <p style={{ margin: '4px 0 0 0', color: '#555' }}>{pessoa.cartoes.length} cartões</p>
    </div>
  );
}