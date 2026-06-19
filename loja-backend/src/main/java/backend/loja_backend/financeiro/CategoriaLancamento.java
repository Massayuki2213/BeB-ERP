package backend.loja_backend.financeiro;

public enum CategoriaLancamento {
    VENDA_PECA,         // receita de produto (PDV ou peça de OS)
    VENDA_SERVICO,      // receita de mão de obra (OS)
    REPASSE_PARCEIRO,   // despesa: repasse a terceirizado
    OUTRA_RECEITA,
    OUTRA_DESPESA
}
