import { useParams } from 'react-router-dom';
import type { Pessoa } from '../types';
import { Link } from 'react-router-dom';
import CartaoCard from '../components/CartaoCard';

interface PessoaDetalheProps {
  pessoas: Pessoa[];
  setPessoas: React.Dispatch<React.SetStateAction<Pessoa[]>>;
}

export default function PessoaDetalhe({ pessoas, setPessoas }: PessoaDetalheProps) {
  const { id } = useParams<{ id: string }>();
  const pessoa = pessoas.find(p => p.id === Number(id));

  if (!pessoa) return <p>Pessoa não encontrada.</p>;

  function marcarParcelaPaga(cartaoId: number) {
    if (!pessoa) return;
    setPessoas(prev => prev.map(p => {
      if (p.id !== Number(id)) return p;
      return {
        ...p,
        cartoes: p.cartoes.map(c =>
          c.id === cartaoId && c.parcelas_pagas < c.numero_de_parcelas
            ? { ...c, parcelas_pagas: c.parcelas_pagas + 1 }
            : c
        ),
      };
    }));
  }

  function removerCartao(cartaoId: number) {
    setPessoas(prev => prev.map(p => {
      if (p.id !== Number(id)) return p;
      return {
        ...p,
        cartoes: p.cartoes.filter(c => c.id !== cartaoId),
      };
    }));
  }

  function removerPessoa() {
    if (!window.confirm('Tem certeza que deseja remover esta pessoa? Essa ação não pode ser desfeita.')) return;
    setPessoas(prev => prev.filter(p => p.id !== Number(id)));
  }

  return (
    <div className="container">
      <h2>{pessoa.nome}</h2>
      <Link to={`/pessoa/${pessoa.id}/editar`}>
        <button style={{ marginBottom: 16 }}>Editar Pessoa</button>
      </Link>
      <h3>Cartões emprestados:</h3>
      {pessoa.cartoes.length === 0 && <p>Nenhum cartão emprestado.</p>}
      {pessoa.cartoes.map(c => (
        <div key={c.id} style={{ position: 'relative' }}>
          <CartaoCard cartao={c} />
          <div style={{ position: 'absolute', top: 12, right: 16, display: 'flex', gap: 8 }}>
            <button
              onClick={() => marcarParcelaPaga(c.id)}
              disabled={c.parcelas_pagas >= c.numero_de_parcelas}
              style={{ background: '#e6f4ea', color: '#28a745', fontWeight: 600, border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 13 }}
            >
              Marcar parcela paga
            </button>
            <Link to={`/pessoa/${pessoa.id}/cartao/${c.id}/editar`}>
              <button style={{ background: '#ffeeba', color: '#856404', fontWeight: 600, border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 13 }}>Editar</button>
            </Link>
            <button
              onClick={() => removerCartao(c.id)}
              style={{ background: '#f8d7da', color: '#721c24', fontWeight: 600, border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 13 }}
            >
              Remover
            </button>
          </div>
        </div>
      ))}
      <Link to={`/pessoa/${pessoa.id}/adicionar-cartao`}>
        <button style={{ marginTop: 12 }}>Adicionar Cartão</button>
      </Link>
      <button onClick={removerPessoa} style={{ marginTop: 24, background: '#f8d7da', color: '#721c24' }}>
        Remover Pessoa
      </button>
    </div>
  );
}
