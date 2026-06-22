package backend.loja_backend.financeiro;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LancamentoFinanceiroDTO {

    @NotNull(message = "tipo é obrigatório (RECEITA ou DESPESA)")
    private TipoLancamento tipo;

    private CategoriaLancamento categoria;  // default OUTRA_RECEITA/OUTRA_DESPESA
    private String descricao;

    @NotNull(message = "valor é obrigatório")
    @DecimalMin(value = "0.01", message = "valor deve ser maior que zero")
    private BigDecimal valor;

    private BigDecimal custo;
    private LocalDate data;                 // default hoje
    private LocalDate dataVencimento;
    private StatusLancamento status;        // default LIQUIDADO
    private String formaPagamento;
}
