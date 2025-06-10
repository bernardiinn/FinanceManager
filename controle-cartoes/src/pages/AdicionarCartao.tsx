import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Pessoa, Cartao } from '../types';

interface AdicionarCartaoProps {
  pessoas: Pessoa[];
  setPessoas: React.Dispatch<React.SetStateAction<Pessoa[]>>;
}

export default function AdicionarCartao({ pessoas, setPessoas }: AdicionarCartaoProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const pessoaIndex = pessoas.findIndex(p => p.id === Number(id));
  if (pessoaIndex === -1) return <p>Pessoa não encontrada.</p>;

  const [nome_cartao, setNomeCartao] = useState('');
  const [valor_total, setValorTotal] = useState<number>(0);
  const [numero_de_parcelas, setNumeroDeParcelas] = useState<number>(1);
  const [sucesso, setSucesso] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPessoas(prev => {
      const newCartao: Cartao = {
        id: prev[pessoaIndex].cartoes.length > 0
          ? Math.max(...prev[pessoaIndex].cartoes.map(c => c.id)) + 1
          : 1,
        nome_cartao,
        valor_total,
        numero_de_parcelas,
        parcelas_pagas: 0,
      };

      const newPessoas = [...prev];
      newPessoas[pessoaIndex].cartoes.push(newCartao);
      return newPessoas;
    });
    setSucesso(true);
    setTimeout(() => {
      navigate(`/pessoa/${id}`);
    }, 1200);
  }

  return (
    <div className="container">
      <h2>Adicionar Cartão para {pessoas[pessoaIndex].nome}</h2>
      {sucesso && (
        <div className="success-message">
          Cartão adicionado com sucesso!
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: 350 }}>
        <div>
          <label>Nome do Cartão:</label>
          <input
            type="text"
            value={nome_cartao}
            onChange={e => setNomeCartao(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label>Valor Total:</label>
          <input
            type="number"
            value={valor_total}
            onChange={e => setValorTotal(Number(e.target.value))}
            required
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label>Número de Parcelas:</label>
          <input
            type="number"
            value={numero_de_parcelas}
            onChange={e => setNumeroDeParcelas(Number(e.target.value))}
            min={1}
            required
            style={{ width: '100%' }}
          />
        </div>
        <button type="submit">
          Adicionar Cartão
        </button>
      </form>
    </div>
  );
}
