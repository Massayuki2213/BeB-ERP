package backend.loja_backend.agenda;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class AgendamentoDTO {
    private Integer box;
    private LocalDateTime dataHoraInicio;
    private LocalDateTime dataHoraFim;   // opcional; default = início + 1h
    private String descricao;
    private String status;               // opcional; default AGENDADO
    private Long clienteId;
    private Long veiculoId;
    private Long ordemServicoId;
}
