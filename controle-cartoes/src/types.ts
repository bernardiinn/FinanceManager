export interface Cartao {
  id: number;
  nome_cartao: string;
  valor_total: number;
  numero_de_parcelas: number;
  parcelas_pagas: number;
}

export interface Pessoa {
  id: number;
  nome: string;
  cartoes: Cartao[];
}
