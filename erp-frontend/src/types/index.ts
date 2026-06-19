// Interfaces para as entidades do backend

export type UnidadeMedida = 'UN' | 'PAR' | 'METRO' | 'KIT' | 'CAIXA' | 'LITRO' | 'KG';

export interface Produto {
  id: number;
  nome: string;
  precoVenda: number;
  precoCusto: number;
  quantidadeEstoque?: number;
  unidadeMedida?: UnidadeMedida;
  descricao?: string;
}

export interface Cliente {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cpfCnpj?: string;
}

export interface Servico {
  id: number;
  nome: string;
  descricao?: string;
  valorBase: number;
  categoria?: string;
}

export interface Veiculo {
  id: number;
  placa: string;
  marca?: string;
  modelo?: string;
  ano?: number;
  cor?: string;
  cliente?: Cliente;
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

// ----- Ordem de Serviço -----

export type StatusOS = 'ABERTA' | 'EM_ANDAMENTO' | 'AGUARDANDO_PECA' | 'FINALIZADA' | 'CANCELADA';

export interface ItemOS {
  id: number;
  produto?: Produto;
  quantidade: number;
  precoUnitario: number;
}

export interface ServicoOS {
  id: number;
  servico?: Servico;
  descricao?: string;
  valor: number;
  parceiro?: string;
  valorRepasse?: number;
}

export interface OrdemServico {
  id: number;
  cliente?: Cliente;
  veiculo?: Veiculo;
  status: StatusOS;
  descricao?: string;
  dataAbertura: string;
  dataFechamento?: string;
  valorPecas?: number;
  valorServicos?: number;
  valorRepasses?: number;
  valorTotal?: number;
  itens: ItemOS[];
  servicos: ServicoOS[];
}

// ----- Financeiro -----

export type TipoLancamento = 'RECEITA' | 'DESPESA';
export type CategoriaLancamento =
  | 'VENDA_PECA' | 'VENDA_SERVICO' | 'REPASSE_PARCEIRO' | 'OUTRA_RECEITA' | 'OUTRA_DESPESA';
export type StatusLancamento = 'PENDENTE' | 'LIQUIDADO' | 'CANCELADO';
export type OrigemLancamento = 'PDV' | 'OS' | 'MANUAL';

export interface LancamentoFinanceiro {
  id: number;
  tipo: TipoLancamento;
  categoria: CategoriaLancamento;
  descricao?: string;
  valor: number;
  custo?: number;
  data: string;
  dataVencimento?: string;
  status: StatusLancamento;
  origem: OrigemLancamento;
  formaPagamento?: string;
  ordemVendaId?: number;
  ordemServicoId?: number;
}

export interface ResumoFinanceiro {
  receitaPecas: number;
  custoPecas: number;
  lucroPecas: number;
  receitaServicos: number;
  repasses: number;
  lucroServicos: number;
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
}

export interface FluxoCaixaDia {
  data: string;
  entradas: number;
  saidas: number;
  saldoDia: number;
  saldoAcumulado: number;
}

// ----- Agenda -----

export type StatusAgendamento =
  | 'AGENDADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO' | 'NAO_COMPARECEU';

export interface Agendamento {
  id: number;
  box: number;
  dataHoraInicio: string;
  dataHoraFim: string;
  descricao?: string;
  status: StatusAgendamento;
  cliente?: Cliente;
  veiculo?: Veiculo;
  ordemServico?: OrdemServico;
}
