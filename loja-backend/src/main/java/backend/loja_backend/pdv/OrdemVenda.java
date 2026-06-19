package backend.loja_backend.pdv;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import backend.loja_backend.cliente.Clientes;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "ordem_venda")
@Data
public class OrdemVenda {

    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;
    private String descricao;
    @Column(name = "valor_total", precision = 10, scale = 2, nullable = false)
    private BigDecimal valorTotal;
    @Column(name = "data_venda", nullable = false)
    private LocalDateTime dataVenda;
    private String status;
    private String formaPagamento;
    // Cliente é opcional: venda rápida de balcão não exige cadastro
    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Clientes cliente;
    // Mapear itens vendas
    @OneToMany(mappedBy = "ordemVenda", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItensVendas> itensVendas;
}
