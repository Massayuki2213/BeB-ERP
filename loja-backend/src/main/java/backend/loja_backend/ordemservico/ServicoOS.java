package backend.loja_backend.ordemservico;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonIgnore;

import backend.loja_backend.servico.Servicos;
import jakarta.persistence.*;
import lombok.Data;

/**
 * Mão de obra / serviço de uma OS. Pode ser terceirizado: nesse caso 'parceiro' e
 * 'valorRepasse' separam quanto da OS vai para o parceiro (ex.: aplicação de insulfilm).
 */
@Entity
@Table(name = "servico_os")
@Data
public class ServicoOS {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ordem_servico_id", nullable = false)
    @JsonIgnore
    private OrdemServico ordemServico;

    // Opcional: referência ao catálogo de serviços
    @ManyToOne
    @JoinColumn(name = "servico_id")
    private Servicos servico;

    private String descricao;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valor;

    // Repasse a parceiro terceirizado (parceiro null / valorRepasse 0 = serviço feito na casa)
    private String parceiro;

    @Column(name = "valor_repasse", precision = 12, scale = 2)
    private BigDecimal valorRepasse;
}
