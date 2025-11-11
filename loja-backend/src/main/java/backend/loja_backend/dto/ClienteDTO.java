package backend.loja_backend.dto;

import lombok.Data;

@Data
public class ClienteDTO {
    private String nome;
    private String telefone;
    private String email;
    private String endereco;
    private String cpfCnpj;
}
