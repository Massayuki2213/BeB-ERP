package backend.loja_backend.cliente;

import lombok.Data;

@Data
public class ClienteDTO {
    private String nome;
    private String telefone;
    private String email;
    private String endereco;
    private String cpfCnpj;
}
