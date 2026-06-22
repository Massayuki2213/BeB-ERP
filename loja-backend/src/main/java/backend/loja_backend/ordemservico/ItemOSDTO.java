package backend.loja_backend.ordemservico;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ItemOSDTO {

    @NotNull(message = "produtoId é obrigatório")
    private Long produtoId;

    @NotNull(message = "quantidade é obrigatória")
    @DecimalMin(value = "0.001", message = "quantidade deve ser maior que zero")
    private BigDecimal quantidade;

    @DecimalMin(value = "0.0", inclusive = true, message = "precoUnitario não pode ser negativo")
    private BigDecimal precoUnitario;   // opcional; default = preço de venda do produto
}
