package backend.loja_backend.ordemservico;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonIgnore;

import backend.loja_backend.produto.Produtos;
import jakarta.persistence.*;
import lombok.Data;

/**
 * Peça/produto consumido na OS. A baixa no estoque acontece ao finalizar a OS (Task 6).
 */
@Entity
@Table(name = "item_os")
@Data
public class ItemOS {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ordem_servico_id", nullable = false)
    @JsonIgnore
    private OrdemServico ordemServico;

    @ManyToOne
    @JoinColumn(name = "produto_id", nullable = false)
    private Produtos produto;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantidade;

    @Column(name = "preco_unitario", nullable = false, precision = 12, scale = 2)
    private BigDecimal precoUnitario;
}
