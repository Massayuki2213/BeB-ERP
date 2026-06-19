package backend.loja_backend.ordemservico;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class ServicoOSDTO {
    private Long servicoId;          // opcional; referência ao catálogo
    private String descricao;
    private BigDecimal valor;        // opcional se servicoId vier (usa valorBase do catálogo)
    private String parceiro;         // null = serviço feito na casa
    private BigDecimal valorRepasse; // quanto vai para o parceiro
}
