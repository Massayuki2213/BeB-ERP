package backend.loja_backend.financeiro;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.Data;

@Data
public class LancamentoFinanceiroDTO {
    private TipoLancamento tipo;            // obrigatório
    private CategoriaLancamento categoria;  // default OUTRA_RECEITA/OUTRA_DESPESA
    private String descricao;
    private BigDecimal valor;               // obrigatório, > 0
    private BigDecimal custo;
    private LocalDate data;                 // default hoje
    private LocalDate dataVencimento;
    private StatusLancamento status;        // default LIQUIDADO
    private String formaPagamento;
}
