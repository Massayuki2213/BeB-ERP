package backend.loja_backend.estoque;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class MovimentacaoEstoqueDTO {
    private Long produtoId;
    // entrada/saída: quantidade movimentada | ajuste: novo saldo absoluto
    private BigDecimal quantidade;
    private String observacao;
}
