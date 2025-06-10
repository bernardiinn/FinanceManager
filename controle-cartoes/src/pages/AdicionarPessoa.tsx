import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Pessoa } from '../types';

interface AdicionarPessoaProps {
  setPessoas: React.Dispatch<React.SetStateAction<Pessoa[]>>;
}

export default function AdicionarPessoa({ setPessoas }: AdicionarPessoaProps) {
  const [nome, setNome] = useState('');
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPessoas(prev => [
      ...prev,
      {
        id: prev.length > 0 ? Math.max(...prev.map(p => p.id)) + 1 : 1,
        nome,
        cartoes: [],
      },
    ]);
    navigate('/pessoas');
  }

  return (
    <div>
      <h2>Adicionar nova pessoa</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nome da pessoa"
          value={nome}
          onChange={e => setNome(e.target.value)}
          required
        />
        <button type="submit">Adicionar</button>
      </form>
    </div>
  );
}
