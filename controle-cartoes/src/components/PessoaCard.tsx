import { FaUserCircle } from 'react-icons/fa';
import type { Pessoa } from '../types';

interface PessoaCardProps {
  pessoa: Pessoa;
}

export default function PessoaCard({ pessoa }: PessoaCardProps) {
  // Avatar com iniciais
  const getInitials = (nome: string) => nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
  const initials = getInitials(pessoa.nome);
  return (
    <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e0e0e0', borderRadius: 14, boxShadow: '0 2px 12px #e0e0e0', padding: '16px', marginBottom: '12px', background: '#fff', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #007bff 60%, #00c6ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 22, marginRight: 12, boxShadow: '0 2px 8px #007bff22' }}>
        {initials ? initials : <FaUserCircle size={32} />}
      </div>
      <div>
        <h4 style={{ margin: 0 }}>{pessoa.nome}</h4>
        <p style={{ margin: '4px 0 0 0', color: '#555' }}>{pessoa.cartoes.length} cartões</p>
      </div>
    </div>
  );
}