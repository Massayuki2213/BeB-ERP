package backend.loja_backend.dto;
import lombok.Data;

@Data
public class ServicoDTO {

    private String nome;
    private String descricao;
    private Double valorBase;
    private String categoria;
}
