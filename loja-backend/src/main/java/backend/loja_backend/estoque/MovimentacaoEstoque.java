package backend.loja_backend.estoque;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import backend.loja_backend.produto.Produtos;
import jakarta.persistence.*;
import lombok.Data;

/**
 * Kardex: registra cada movimentação de estoque com o saldo resultante (auditável).
 */
@Entity
@Table(name = "movimentacao_estoque")
@Data
public class MovimentacaoEstoque {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "produto_id", nullable = false)
    private Produtos produto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoMovimentacao tipo;

    // Quantidade movimentada (magnitude positiva; o tipo indica a direção)
    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantidade;

    // Saldo do produto logo após esta movimentação
    @Column(name = "saldo_apos", nullable = false, precision = 12, scale = 3)
    private BigDecimal saldoApos;

    private String observacao;

    @Column(name = "data_movimentacao", nullable = false)
    private LocalDateTime dataMovimentacao;
}
