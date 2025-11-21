// loja-backend/src/main/java/backend/loja_backend/dto/ProdutoDTO.java
package backend.loja_backend.dto;
import lombok.Data;

@Data
public class ProdutoDTO {

    private String nome;
    private String descricao;
    private Double precoCusto;
    private Double precoVenda;
    private Integer quantidadeEstoque;
    private String categoria;

}
