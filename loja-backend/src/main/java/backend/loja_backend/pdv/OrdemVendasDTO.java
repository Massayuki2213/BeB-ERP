package backend.loja_backend.pdv;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrdemVendasDTO {

    private Long clienteId;
    private String descricao;
    private Double valorTotal;
    private String dataVenda;
    private String status;

    @NotNull(message = "formaPagamento é obrigatória")
    private String formaPagamento;

    @NotEmpty(message = "A venda precisa de ao menos um item")
    @Valid
    List<ItensVendasDTO> itensVendas;
}
