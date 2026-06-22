package backend.loja_backend.veiculo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VeiculoDTO {

    @NotNull(message = "clienteId é obrigatório")
    private Long clienteId;

    @NotBlank(message = "placa é obrigatória")
    private String placa;

    private String marca;
    private String modelo;
    private Integer ano;
    private String cor;
}
