package backend.loja_backend.produto;

import java.math.BigDecimal;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "produtos")
@Data
public class Produtos {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nome;
    private String descricao;
    @Column(name = "preco_custo")
    private Double precoCusto;
    @Column(name = "preco_venda")
    private Double precoVenda;

    // Saldo em estoque — decimal para suportar venda fracionada (ex.: metros de fio)
    @Column(name = "quantidade_estoque", precision = 12, scale = 3)
    private BigDecimal quantidadeEstoque;

    // Sem inicializador: na criação o service define o default (UN); no update preserva o valor existente
    @Enumerated(EnumType.STRING)
    @Column(name = "unidade_medida", nullable = false, length = 20)
    private UnidadeMedida unidadeMedida;
}
