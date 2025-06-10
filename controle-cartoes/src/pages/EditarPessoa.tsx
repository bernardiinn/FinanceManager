import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Pessoa } from '../types';

interface EditarPessoaProps {
  pessoas: Pessoa[];
  setPessoas: React.Dispatch<React.SetStateAction<Pessoa[]>>;
}

export default function EditarPessoa({ pessoas, setPessoas }: EditarPessoaProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pessoa = pessoas.find(p => p.id === Number(id));
  const [nome, setNome] = useState(pessoa?.nome || '');
  const [erro, setErro] = useState('');

  if (!pessoa) return <p>Pessoa não encontrada.</p>;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro('');
    if (!nome.trim()) {
      setErro('O nome não pode estar em branco.');
      return;
    }
    if (pessoas.some(p => p.nome.trim().toLowerCase() === nome.trim().toLowerCase() && p.id !== (pessoa?.id))) {
      setErro('Já existe uma pessoa com esse nome.');
      return;
    }
    setPessoas(prev => prev.map(p =>
      p.id === (pessoa?.id) ? { ...p, nome: nome.trim() } : p
    ));
    navigate(`/pessoa/${id}`);
  }

  return (
    <div className="container">
      <h2>Editar Pessoa</h2>
      {erro && <div className="success-message" style={{ background: '#f8d7da', color: '#721c24', border: '1.5px solid #f5c6cb' }}>{erro}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nome da pessoa"
          value={nome}
          onChange={e => setNome(e.target.value)}
          required
        />
        <button type="submit">Salvar</button>
      </form>
    </div>
  );
}
