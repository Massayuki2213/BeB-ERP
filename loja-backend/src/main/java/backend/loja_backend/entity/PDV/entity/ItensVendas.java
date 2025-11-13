//ItensVendas.java
package backend.loja_backend.entity.PDV.entity;

import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonIgnore;
import backend.loja_backend.entity.Produtos;
import org.hibernate.annotations.NotFound;          // <--- IMPORTANTE
import org.hibernate.annotations.NotFoundAction;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "itens_vendas")
@Data
public class ItensVendas {

    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;
    // Relacionamento com produtos
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

}
