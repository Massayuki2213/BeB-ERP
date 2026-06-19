package backend.loja_backend.veiculo;

import lombok.Data;

@Data
public class VeiculoDTO {
    private Long clienteId;
    private String placa;
    private String marca;
    private String modelo;
    private Integer ano;
    private String cor;
}
