package backend.loja_backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "movimentacao_estoque")
public class MovimentacaoEstoque {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "produto_id")
    private Produtos produto;

    private Integer quantidade; // Quantidade movimentada (ex: -1 ou +10)
    private String tipo; // "ENTRADA" ou "SAIDA"
    
    @Column(name = "data_hora")
    private LocalDateTime dataHora;
    
    private String observacao;
}