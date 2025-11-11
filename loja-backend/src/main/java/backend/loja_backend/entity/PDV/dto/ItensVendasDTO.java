//ItensVendasDTO.java
package backend.loja_backend.entity.PDV.dto;

import lombok.Data;

@Data
public class ItensVendasDTO {

    private Long produtoId;
    private Integer quantidade;
    private Double precoUnitario;
    private Double precoTotal;
    
}
