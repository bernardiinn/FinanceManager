import type { Pessoa } from '../types';

interface HomeProps {
  pessoas: Pessoa[];
}

export default function Home({ pessoas }: HomeProps) {
  // Cálculos dos totais
  const totalEmprestado = pessoas.reduce(
    (sum, p) => sum + p.cartoes.reduce((s, c) => s + c.valor_total, 0),
    0
  );
  const totalRecebido = pessoas.reduce(
    (sum, p) =>
      sum +
      p.cartoes.reduce(
        (s, c) => s + (c.valor_total * c.parcelas_pagas) / c.numero_de_parcelas,
        0
      ),
    0
  );
  const totalAReceber = totalEmprestado - totalRecebido;
  const pessoasComSaldo = pessoas.filter(p =>
    p.cartoes.some(c => c.parcelas_pagas < c.numero_de_parcelas)
  );

  return (
    <div className="container">
      <h1>Controle de Cartões Emprestados</h1>
      <p>Bem-vindo! Use o menu para navegar.</p>
      <hr />
      <h2>Resumo Geral</h2>
      <p><strong>Total emprestado:</strong> R$ {totalEmprestado.toFixed(2)}</p>
      <p><strong>Total já recebido:</strong> R$ {totalRecebido.toFixed(2)}</p>
      <p><strong>Total a receber:</strong> R$ {totalAReceber.toFixed(2)}</p>
      <h3>Pessoas com saldo aberto:</h3>
      <ul>
        {pessoasComSaldo.length === 0 && <li>Nenhuma pessoa com saldo aberto.</li>}
        {pessoasComSaldo.map(p => (
          <li key={p.id}>{p.nome}</li>
        ))}
      </ul>
    </div>
  );
}
