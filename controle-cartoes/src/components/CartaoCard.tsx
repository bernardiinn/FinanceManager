import { FaRegCreditCard } from 'react-icons/fa';
import type { Cartao } from '../types';

interface CartaoCardProps {
  cartao: Cartao;
}

export default function CartaoCard({ cartao }: CartaoCardProps) {
  // Status visual
  const quitado = cartao.parcelas_pagas >= cartao.numero_de_parcelas;
  const statusColor = quitado ? '#28a745' : '#ff9800';
  const statusText = quitado ? 'Quitado' : 'Em aberto';
  return (
    <div style={{ border: `2px solid ${statusColor}`, borderRadius: 12, boxShadow: '0 2px 8px #eee', padding: '12px', marginBottom: '10px', background: '#fafbfc', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ color: statusColor, fontSize: 28, marginRight: 10 }}>
        <FaRegCreditCard />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0 }}><strong>Cartão:</strong> {cartao.nome_cartao}</p>
        <p style={{ margin: '4px 0 0 0' }}><strong>Valor total:</strong> R$ {cartao.valor_total}</p>
        <p style={{ margin: '4px 0 0 0' }}><strong>Parcelas pagas:</strong> {cartao.parcelas_pagas} / {cartao.numero_de_parcelas}</p>
      </div>
      <span style={{ color: statusColor, fontWeight: 700, fontSize: 14 }}>{statusText}</span>
    </div>
  );
}