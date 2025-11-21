// loja-backend/src/main/java/backend/loja_backend/entity/Produtos.java
package backend.loja_backend.entity;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "produtos")
@Data
public class Produtos {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_produto")
    private Long idProduto;
    private String nome;
    private String descricao;
    @Column (name = "preco_custo")
    private Double precoCusto;
    @Column (name = "preco_venda")
    private Double precoVenda;
    @Column (name = "quantidade_estoque")
    private Integer quantidadeEstoque;
    public Integer getQuantidade() {
        return this.quantidadeEstoque;
    }
    @Column (name = "categoria ")
    private String categoria;
    public void setQuantidade(int quantidade) {
        this.quantidadeEstoque = quantidade;
    }
    
}
