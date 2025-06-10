import type { Cartao } from '../types';

interface CartaoCardProps {
  cartao: Cartao;
}

export default function CartaoCard({ cartao }: CartaoCardProps) {
  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 8, boxShadow: '0 2px 8px #eee', padding: '10px', marginBottom: '10px', background: '#fafbfc' }}>
      <p style={{ margin: 0 }}><strong>Cartão:</strong> {cartao.nome_cartao}</p>
      <p style={{ margin: '4px 0 0 0' }}><strong>Valor total:</strong> R$ {cartao.valor_total}</p>
      <p style={{ margin: '4px 0 0 0' }}><strong>Parcelas pagas:</strong> {cartao.parcelas_pagas} / {cartao.numero_de_parcelas}</p>
    </div>
  );
}