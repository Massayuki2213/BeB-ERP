package backend.loja_backend.ordemservico;

import java.util.List;

import lombok.Data;

@Data
public class OrdemServicoDTO {
    private Long clienteId;
    private Long veiculoId;
    private String descricao;
    private String status;          // opcional; default ABERTA
    private List<ItemOSDTO> itens;
    private List<ServicoOSDTO> servicos;
}
