export interface ItemVenda {
  produtoId: number;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
  precoTotal: number;
}

export interface NovaVenda {
  clienteId: number;
  descricao: string;
  valorTotal: number;
  status: string;
  formaPagamento: string;
  itensVendas: {
    produtoId: number;
    quantidade: number;
    precoUnitario: number;
    precoTotal: number;
  }[];
}