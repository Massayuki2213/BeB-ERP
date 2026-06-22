package backend.loja_backend.cliente;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClienteDTO {

    @NotBlank(message = "nome é obrigatório")
    private String nome;

    private String telefone;
    private String email;
    private String endereco;
    private String cpfCnpj;
}
