package backend.loja_backend.financeiro;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Lançamento do livro caixa. Receitas e despesas (incl. contas a pagar/receber em aberto).
 * Gerado automaticamente pelo PDV e pelo fechamento de OS, ou manualmente.
 */
@Entity
@Table(name = "lancamento_financeiro")
@Data
public class LancamentoFinanceiro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoLancamento tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CategoriaLancamento categoria;

    private String descricao;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valor;

    // Custo associado à receita (ex.: COGS da peça), para apurar lucro
    @Column(precision = 12, scale = 2)
    private BigDecimal custo;

    // Data do movimento (competência); ao liquidar, vira a data do pagamento/recebimento
    @Column(nullable = false)
    private LocalDate data;

    @Column(name = "data_vencimento")
    private LocalDate dataVencimento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusLancamento status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrigemLancamento origem;

    @Column(name = "forma_pagamento")
    private String formaPagamento;

    // Referências soltas à origem (sem FK para manter o ledger desacoplado)
    @Column(name = "ordem_venda_id")
    private Long ordemVendaId;

    @Column(name = "ordem_servico_id")
    private Long ordemServicoId;
}
