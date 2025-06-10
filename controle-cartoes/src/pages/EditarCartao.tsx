import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Pessoa, Cartao } from '../types';

interface EditarCartaoProps {
  pessoas: Pessoa[];
  setPessoas: React.Dispatch<React.SetStateAction<Pessoa[]>>;
}

export default function EditarCartao({ pessoas, setPessoas }: EditarCartaoProps) {
  const { id, cartaoId } = useParams<{ id: string; cartaoId: string }>();
  const navigate = useNavigate();
  const pessoaIndex = pessoas.findIndex(p => p.id === Number(id));
  const pessoa = pessoas[pessoaIndex];
  const cartao = pessoa?.cartoes.find(c => c.id === Number(cartaoId));
  const [nome_cartao, setNomeCartao] = useState(cartao?.nome_cartao || '');
  const [valor_total, setValorTotal] = useState<number>(cartao?.valor_total || 0);
  const [numero_de_parcelas, setNumeroDeParcelas] = useState<number>(cartao?.numero_de_parcelas || 1);
  const [erro, setErro] = useState('');

  if (!pessoa || !cartao) return <p>Cartão ou pessoa não encontrada.</p>;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro('');
    if (!nome_cartao.trim()) {
      setErro('O nome do cartão não pode estar em branco.');
      return;
    }
    if (valor_total <= 0) {
      setErro('O valor total deve ser maior que zero.');
      return;
    }
    if (numero_de_parcelas < 1) {
      setErro('O número de parcelas deve ser pelo menos 1.');
      return;
    }
    setPessoas(prev => {
      const newPessoas = [...prev];
      newPessoas[pessoaIndex] = {
        ...pessoa,
        cartoes: pessoa.cartoes.map(c =>
          c.id === cartao!.id
            ? { ...c, nome_cartao: nome_cartao.trim(), valor_total, numero_de_parcelas }
            : c
        ),
      };
      return newPessoas;
    });
    navigate(`/pessoa/${id}`);
  }

  return (
    <div className="container">
      <h2>Editar Cartão</h2>
      {erro && <div className="success-message" style={{ background: '#f8d7da', color: '#721c24', border: '1.5px solid #f5c6cb' }}>{erro}</div>}
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
            min={0}
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
        <button type="submit">Salvar</button>
      </form>
    </div>
  );
}
