package backend.loja_backend.veiculo;

import backend.loja_backend.cliente.Clientes;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "veiculos")
@Data
public class Veiculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String placa;

    private String marca;
    private String modelo;
    private Integer ano;
    private String cor;

    // Relação Cliente 1:N Veículo (lado dono). Navegamos os veículos do cliente por query.
    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    private Clientes cliente;
}
