package backend.loja_backend.financeiro;

public enum StatusLancamento {
    PENDENTE,    // conta a pagar / a receber em aberto
    LIQUIDADO,   // pago / recebido (entra no fluxo de caixa)
    CANCELADO
}
