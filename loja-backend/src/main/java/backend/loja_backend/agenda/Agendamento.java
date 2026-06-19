package backend.loja_backend.agenda;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import backend.loja_backend.cliente.Clientes;
import backend.loja_backend.ordemservico.OrdemServico;
import backend.loja_backend.veiculo.Veiculo;
import jakarta.persistence.*;
import lombok.Data;

/**
 * Horário reservado em um box (baia). Vínculo opcional a cliente, veículo e OS.
 * O service garante que dois agendamentos ativos não se sobreponham no mesmo box.
 */
@Entity
@Table(name = "agendamento")
@Data
public class Agendamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer box;

    @Column(name = "data_hora_inicio", nullable = false)
    private LocalDateTime dataHoraInicio;

    @Column(name = "data_hora_fim", nullable = false)
    private LocalDateTime dataHoraFim;

    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusAgendamento status;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Clientes cliente;

    @ManyToOne
    @JoinColumn(name = "veiculo_id")
    private Veiculo veiculo;

    // Vínculo opcional à OS; não serializa as listas pesadas (itens/serviços)
    @ManyToOne
    @JoinColumn(name = "ordem_servico_id")
    @JsonIgnoreProperties({ "itens", "servicos" })
    private OrdemServico ordemServico;
}
