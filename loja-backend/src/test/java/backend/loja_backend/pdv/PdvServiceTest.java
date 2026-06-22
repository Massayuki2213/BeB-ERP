package backend.loja_backend.pdv;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import backend.loja_backend.AbstractIntegrationTest;
import backend.loja_backend.cliente.ClienteRepository;
import backend.loja_backend.common.exception.EstoqueInsuficienteException;
import backend.loja_backend.estoque.MovimentacaoEstoqueRepository;
import backend.loja_backend.estoque.TipoMovimentacao;
import backend.loja_backend.financeiro.LancamentoFinanceiroRepository;
import backend.loja_backend.ordemservico.OrdemServicoRepository;
import backend.loja_backend.produto.ProdutoRepository;
import backend.loja_backend.produto.Produtos;
import backend.loja_backend.produto.UnidadeMedida;

class PdvServiceTest extends AbstractIntegrationTest {

    @Autowired OrdemVendaService service;
    @Autowired OrdemVendaRepository vendaRepo;
    @Autowired ProdutoRepository produtoRepo;
    @Autowired ClienteRepository clienteRepo;
    @Autowired OrdemServicoRepository osRepo;
    @Autowired MovimentacaoEstoqueRepository movRepo;
    @Autowired LancamentoFinanceiroRepository financeiroRepo;

    Produtos produto;

    @BeforeEach
    void setUp() {
        produto = new Produtos();
        produto.setNome("Módulo 5 canais");
        produto.setPrecoVenda(1500.0);
        produto.setPrecoCusto(800.0);
        produto.setQuantidadeEstoque(new BigDecimal("5.000"));
        produto.setUnidadeMedida(UnidadeMedida.UN);
        produto = produtoRepo.save(produto);
    }

    // ------------------------------------------------------------------ testes

    @Test
    void realizarVenda_deveReduzirEstoque() {
        ItensVendasDTO item = new ItensVendasDTO();
        item.setProdutoId(produto.getId());
        item.setQuantidade(new BigDecimal("2"));

        OrdemVendasDTO dto = new OrdemVendasDTO();
        dto.setFormaPagamento("PIX");
        dto.setItensVendas(List.of(item));

        service.criarOrdemVenda(dto);

        Produtos atualizado = produtoRepo.findById(produto.getId()).orElseThrow();
        assertThat(atualizado.getQuantidadeEstoque())
                .isEqualByComparingTo(new BigDecimal("3.000")); // 5 - 2
    }

    @Test
    void realizarVenda_comEstoqueInsuficiente_deveLancarExcecao() {
        ItensVendasDTO item = new ItensVendasDTO();
        item.setProdutoId(produto.getId());
        item.setQuantidade(new BigDecimal("10")); // estoque só tem 5

        OrdemVendasDTO dto = new OrdemVendasDTO();
        dto.setFormaPagamento("PIX");
        dto.setItensVendas(List.of(item));

        assertThatThrownBy(() -> service.criarOrdemVenda(dto))
                .isInstanceOf(EstoqueInsuficienteException.class)
                .hasMessageContaining("Módulo 5 canais");
    }

    @Test
    void realizarVenda_deveCriarRegistroDeKardex() {
        ItensVendasDTO item = new ItensVendasDTO();
        item.setProdutoId(produto.getId());
        item.setQuantidade(new BigDecimal("1"));

        OrdemVendasDTO dto = new OrdemVendasDTO();
        dto.setFormaPagamento("DINHEIRO");
        dto.setItensVendas(List.of(item));

        service.criarOrdemVenda(dto);

        // Deve existir uma movimentação de SAIDA no Kardex
        var movimentacoes = movRepo.findByProdutoIdOrderByDataMovimentacaoDescIdDesc(produto.getId());
        assertThat(movimentacoes).isNotEmpty();
        assertThat(movimentacoes.get(0).getTipo()).isEqualTo(TipoMovimentacao.SAIDA);
    }
}
