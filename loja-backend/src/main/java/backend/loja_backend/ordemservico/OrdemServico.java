package backend.loja_backend.ordemservico;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import backend.loja_backend.cliente.Clientes;
import backend.loja_backend.veiculo.Veiculo;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "ordem_servico")
@Data
public class OrdemServico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    private Clientes cliente;

    @ManyToOne
    @JoinColumn(name = "veiculo_id", nullable = false)
    private Veiculo veiculo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusOrdemServico status;

    // Relato do cliente / observações gerais da OS
    private String descricao;

    @Column(name = "data_abertura", nullable = false)
    private LocalDateTime dataAbertura;

    @Column(name = "data_fechamento")
    private LocalDateTime dataFechamento;

    // Totais calculados pelo service ao salvar
    @Column(name = "valor_pecas", precision = 12, scale = 2)
    private BigDecimal valorPecas;

    @Column(name = "valor_servicos", precision = 12, scale = 2)
    private BigDecimal valorServicos;

    @Column(name = "valor_repasses", precision = 12, scale = 2)
    private BigDecimal valorRepasses;

    // O que o cliente paga = peças + serviços (repasse é custo, não soma aqui)
    @Column(name = "valor_total", precision = 12, scale = 2)
    private BigDecimal valorTotal;

    // Controla se as peças já deram baixa no estoque (evita baixa/estorno em duplicidade)
    @Column(name = "estoque_baixado", nullable = false)
    private Boolean estoqueBaixado = false;

    @OneToMany(mappedBy = "ordemServico", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemOS> itens = new ArrayList<>();

    @OneToMany(mappedBy = "ordemServico", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ServicoOS> servicos = new ArrayList<>();
}
