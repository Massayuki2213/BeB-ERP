//ItensVendas.java
package backend.loja_backend.entity.PDV.entity;

import java.math.BigDecimal;

import backend.loja_backend.entity.Produtos;
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
    private Produtos produto;
    @ManyToOne
    @JoinColumn(name = "ordem_venda_id", nullable = false)
    private OrdemVenda ordemVenda;
    private Integer quantidade;
    private BigDecimal precoUnitario;

}
