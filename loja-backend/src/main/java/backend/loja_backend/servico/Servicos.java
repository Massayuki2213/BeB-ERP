package backend.loja_backend.servico;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table
@Data
public class Servicos {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nome;
    private String descricao;
    @Column(name = "valor_base")
    private Double valorBase;
    private String categoria;
}
