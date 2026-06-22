package backend.loja_backend.estoque;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MovimentacaoEstoqueDTO {

    @NotNull(message = "produtoId é obrigatório")
    private Long produtoId;

    @NotNull(message = "quantidade é obrigatória")
    // entrada/saída: quantidade movimentada | ajuste: novo saldo absoluto
    private BigDecimal quantidade;

    private String observacao;
}
