import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Pessoa } from '../types';

interface AdicionarPessoaProps {
  setPessoas: React.Dispatch<React.SetStateAction<Pessoa[]>>;
}

export default function AdicionarPessoa({ setPessoas }: AdicionarPessoaProps) {
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro('');
    setPessoas(prev => {
      if (!nome.trim()) {
        setErro('O nome não pode estar em branco.');
        return prev;
      }
      if (prev.some(p => p.nome.trim().toLowerCase() === nome.trim().toLowerCase())) {
        setErro('Já existe uma pessoa com esse nome.');
        return prev;
      }
      return [
        ...prev,
        {
          id: prev.length > 0 ? Math.max(...prev.map(p => p.id)) + 1 : 1,
          nome: nome.trim(),
          cartoes: [],
        },
      ];
    });
    if (!erro) navigate('/pessoas');
  }

  return (
    <div>
      <h2>Adicionar nova pessoa</h2>
      {erro && <div className="success-message" style={{ background: '#f8d7da', color: '#721c24', border: '1.5px solid #f5c6cb' }}>{erro}</div>}
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
