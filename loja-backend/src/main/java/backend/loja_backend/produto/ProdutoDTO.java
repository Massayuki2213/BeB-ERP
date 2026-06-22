package backend.loja_backend.produto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProdutoDTO {

    @NotBlank(message = "nome é obrigatório")
    private String nome;

    private String descricao;

    @DecimalMin(value = "0.0", inclusive = true, message = "precoCusto não pode ser negativo")
    private Double precoCusto;

    @NotNull(message = "precoVenda é obrigatório")
    @DecimalMin(value = "0.0", inclusive = true, message = "precoVenda não pode ser negativo")
    private Double precoVenda;

    @DecimalMin(value = "0.0", inclusive = true, message = "quantidadeEstoque não pode ser negativa")
    private BigDecimal quantidadeEstoque;

    @NotNull(message = "unidadeMedida é obrigatória")
    private UnidadeMedida unidadeMedida;

}
