package backend.loja_backend.ordemservico;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class ItemOSDTO {
    private Long produtoId;
    private BigDecimal quantidade;
    private BigDecimal precoUnitario;   // opcional; default = preço de venda do produto
}
