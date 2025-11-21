// Interfaces para as entidades do backend

export interface Produto {
  idProduto: Key | null | undefined;
  id: number;
  nome: string;
  precoVenda: number;
  precoCusto: number;
  quantidadeEstoque?: number;
  descricao?: string;
  categoria?: string;
}

export interface Cliente {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
}

export interface Servico {
  id: number;
  nome: string;
  descricao?: string;
  valorBase: number;
  duracao?: number;
}

export interface ItemVenda {
  produtoId: number;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
  precoTotal: number;
}

export type FormaPagamento = 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'PIX';
export type StatusVenda = 'FINALIZADA' | 'PENDENTE' | 'CANCELADA';

export interface NovaVenda {
  clienteId: number;
  descricao: string;
  formaPagamento: FormaPagamento;
  status: StatusVenda;
  valorTotal: number;
  dataVenda: string;
  itensVendas: {
    produtoId: number;
    quantidade: number;
    precoUnitario: number;
    precoTotal: number;
  }[];
}
