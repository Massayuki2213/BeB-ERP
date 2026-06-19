package backend.loja_backend.financeiro;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Linha do fluxo de caixa diário (apenas lançamentos liquidados). */
public record FluxoCaixaDia(
        LocalDate data,
        BigDecimal entradas,
        BigDecimal saidas,
        BigDecimal saldoDia,
        BigDecimal saldoAcumulado) {
}
