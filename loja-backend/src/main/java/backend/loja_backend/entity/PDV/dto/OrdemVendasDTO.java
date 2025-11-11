//OrdemVendasDTO.java
package backend.loja_backend.entity.PDV.dto;

import java.util.List;

import lombok.Data;

@Data
public class OrdemVendasDTO {

    private Long clienteId;
    private String descricao;
    private Double valorTotal;
    private String dataVenda;
    private String status;
    private String formaPagamento;
    List<ItensVendasDTO> itensVendas;
}
