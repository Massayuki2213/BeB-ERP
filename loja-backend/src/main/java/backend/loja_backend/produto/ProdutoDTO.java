package backend.loja_backend.produto;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class ProdutoDTO {

    private String nome;
    private String descricao;
    private Double precoCusto;
    private Double precoVenda;
    private BigDecimal quantidadeEstoque;
    private UnidadeMedida unidadeMedida;

}
