package backend.loja_backend.pdv;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class ItensVendasDTO {

    private Long produtoId;
    private BigDecimal quantidade;
    private Double precoUnitario;
    private Double precoTotal;

}
