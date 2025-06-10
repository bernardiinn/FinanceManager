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
      <button onClick={() => exportarCSV(pessoas)} style={{marginBottom: 16}}>Exportar CSV</button>
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

function exportarCSV(pessoas: Pessoa[]) {
  // Cabeçalho
  let csv = 'Pessoa,Cartão,Valor Total,Nº Parcelas,Parcelas Pagas\n';
  pessoas.forEach(p => {
    if (p.cartoes.length === 0) {
      csv += `${p.nome},,, ,\n`;
    } else {
      p.cartoes.forEach(c => {
        csv += `${p.nome},${c.nome_cartao},${c.valor_total},${c.numero_de_parcelas},${c.parcelas_pagas}\n`;
      });
    }
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `cartoes-emprestados-${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
