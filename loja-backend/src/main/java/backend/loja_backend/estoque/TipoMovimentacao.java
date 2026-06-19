package backend.loja_backend.estoque;

public enum TipoMovimentacao {
    ENTRADA,   // compra, devolução de cliente
    SAIDA,     // venda, perda, uso interno
    AJUSTE     // acerto de inventário para um saldo absoluto
}
