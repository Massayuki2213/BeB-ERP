package backend.loja_backend.ordemservico;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrdemServicoDTO {

    @NotNull(message = "clienteId é obrigatório")
    private Long clienteId;

    @NotNull(message = "veiculoId é obrigatório")
    private Long veiculoId;

    private String descricao;
    private String status;          // opcional; default ABERTA

    @Valid
    private List<ItemOSDTO> itens;

    @Valid
    private List<ServicoOSDTO> servicos;
}
