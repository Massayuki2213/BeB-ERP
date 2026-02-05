package backend.loja_backend.entity; // Ajuste para o seu pacote correto

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal; // Importante para bater com a OrdemVenda

// IMPORTANTE: Importe a sua OrdemVenda. 
// Como ela está num pacote diferente (PDV.entity), o import é necessário:
import backend.loja_backend.entity.PDV.entity.OrdemVenda;

@Entity
@Data
@Table(name = "lancamento_caixa")
public class LancamentoCaixa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String descricao;
    
    // MUDANÇA RECOMENDADA:
    // Sua OrdemVenda usa BigDecimal, então o Caixa também deve usar para não dar erro de conta.
    @Column(precision = 10, scale = 2)
    private BigDecimal valor; 
    
    private String tipo; // "RECEITA"
    
    @Column(name = "data_hora")
    private LocalDateTime dataHora;

    // --- AQUI ESTÁ A CONEXÃO ---
    @OneToOne 
    @JoinColumn(name = "venda_id") // Cria uma coluna 'venda_id' na tabela do caixa
    @JsonIgnoreProperties({"itensVendas", "cliente", "hibernateLazyInitializer", "handler"})
    private OrdemVenda vendaOrigem;
}