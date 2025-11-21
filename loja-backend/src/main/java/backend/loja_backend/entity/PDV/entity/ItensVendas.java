package backend.loja_backend.entity.PDV.entity;

import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonIgnore;
import backend.loja_backend.entity.Produtos;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import jakarta.persistence.*; // Importando tudo para garantir
import lombok.Data;

@Entity
@Table(name = "itens_vendas")
@Data
public class ItensVendas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "produto_id", nullable = false)
    @NotFound(action = NotFoundAction.IGNORE)
    private Produtos produto;

    @ManyToOne
    @JoinColumn(name = "ordem_venda_id", nullable = false)
    @JsonIgnore
    private OrdemVenda ordemVenda;

    private Integer quantidade;
    private BigDecimal precoUnitario;


    @Column(name = "nome_produto")
    private String nomeProduto; 

    @Column(name = "preco_total")
    private BigDecimal precoTotal;
}