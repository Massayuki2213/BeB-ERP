package backend.loja_backend.financeiro;

import java.math.BigDecimal;

/** Resumo do período (competência): lucro de peça vs. serviço e saldo geral. */
public record ResumoFinanceiro(
        BigDecimal receitaPecas,
        BigDecimal custoPecas,
        BigDecimal lucroPecas,
        BigDecimal receitaServicos,
        BigDecimal repasses,
        BigDecimal lucroServicos,
        BigDecimal totalEntradas,
        BigDecimal totalSaidas,
        BigDecimal saldo) {
}
