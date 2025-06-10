import { useParams } from 'react-router-dom';
import type { Pessoa } from '../types';
import { Link } from 'react-router-dom';

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

  return (
    <div className="container">
      <h2>{pessoa.nome}</h2>
      <h3>Cartões emprestados:</h3>
      {pessoa.cartoes.length === 0 && <p>Nenhum cartão emprestado.</p>}
      {pessoa.cartoes.map(c => (
        <div key={c.id} className="card">
          <p style={{ margin: 0 }}><strong>Cartão:</strong> {c.nome_cartao}</p>
          <p style={{ margin: '4px 0 0 0' }}><strong>Valor total:</strong> R$ {c.valor_total}</p>
          <p style={{ margin: '4px 0 0 0' }}><strong>Parcelas pagas:</strong> {c.parcelas_pagas} / {c.numero_de_parcelas}</p>
          <button
            onClick={() => marcarParcelaPaga(c.id)}
            disabled={c.parcelas_pagas >= c.numero_de_parcelas}
            style={{ marginTop: 8 }}
          >
            Marcar parcela paga
          </button>
        </div>
      ))}
      <Link to={`/pessoa/${pessoa.id}/adicionar-cartao`}>
        <button style={{ marginTop: 12 }}>Adicionar Cartão</button>
      </Link>
    </div>
  );
}
