package backend.loja_backend.servico;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ServicoDTO {

    @NotBlank(message = "nome é obrigatório")
    private String nome;

    private String descricao;

    @NotNull(message = "valorBase é obrigatório")
    @DecimalMin(value = "0.0", inclusive = true, message = "valorBase não pode ser negativo")
    private Double valorBase;

    private String categoria;
}
