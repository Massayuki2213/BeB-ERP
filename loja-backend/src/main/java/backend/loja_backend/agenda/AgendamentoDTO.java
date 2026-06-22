package backend.loja_backend.agenda;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AgendamentoDTO {

    @NotNull(message = "box é obrigatório")
    private Integer box;

    @NotNull(message = "dataHoraInicio é obrigatória")
    private LocalDateTime dataHoraInicio;

    private LocalDateTime dataHoraFim;   // opcional; default = início + 1h
    private String descricao;
    private String status;               // opcional; default AGENDADO
    private Long clienteId;
    private Long veiculoId;
    private Long ordemServicoId;
}
