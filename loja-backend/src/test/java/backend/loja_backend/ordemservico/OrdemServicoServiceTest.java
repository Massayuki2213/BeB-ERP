package backend.loja_backend.ordemservico;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import backend.loja_backend.AbstractIntegrationTest;
import backend.loja_backend.cliente.ClienteDTO;
import backend.loja_backend.cliente.ClienteRepository;
import backend.loja_backend.cliente.Clientes;
import backend.loja_backend.common.exception.EstoqueInsuficienteException;
import backend.loja_backend.estoque.MovimentacaoEstoqueRepository;
import backend.loja_backend.financeiro.LancamentoFinanceiro;
import backend.loja_backend.financeiro.LancamentoFinanceiroRepository;
import backend.loja_backend.produto.ProdutoRepository;
import backend.loja_backend.produto.Produtos;
import backend.loja_backend.produto.UnidadeMedida;
import backend.loja_backend.servico.ServicoRepository;
import backend.loja_backend.servico.Servicos;
import backend.loja_backend.veiculo.Veiculo;
import backend.loja_backend.veiculo.VeiculoRepository;

class OrdemServicoServiceTest extends AbstractIntegrationTest {

    @Autowired OrdemServicoService service;
    @Autowired OrdemServicoRepository osRepo;
    @Autowired ClienteRepository clienteRepo;
    @Autowired VeiculoRepository veiculoRepo;
    @Autowired ProdutoRepository produtoRepo;
    @Autowired ServicoRepository servicoRepo;
    @Autowired LancamentoFinanceiroRepository financeiroRepo;
    @Autowired MovimentacaoEstoqueRepository movRepo;

    Clientes cliente;
    Veiculo veiculo;
    Produtos produto;
    Servicos servico;

    @BeforeEach
    void setUp() {
        cliente = new Clientes();
        cliente.setNome("Cliente Teste");
        cliente = clienteRepo.save(cliente);

        veiculo = new Veiculo();
        veiculo.setPlaca("TST-0001");
        veiculo.setCliente(cliente);
        veiculo = veiculoRepo.save(veiculo);

        produto = new Produtos();
        produto.setNome("Fio 4mm");
        produto.setPrecoVenda(50.0);
        produto.setPrecoCusto(20.0);
        produto.setQuantidadeEstoque(new BigDecimal("10.000"));
        produto.setUnidadeMedida(UnidadeMedida.METRO);
        produto = produtoRepo.save(produto);

        servico = new Servicos();
        servico.setNome("Instalação");
        servico.setValorBase(200.0);
        servico = servicoRepo.save(servico);
    }

    // ------------------------------------------------------------------ testes

    @Test
    void criarOS_deveRetornarOsComStatusAberta() {
        OrdemServicoDTO dto = new OrdemServicoDTO();
        dto.setClienteId(cliente.getId());
        dto.setVeiculoId(veiculo.getId());
        dto.setDescricao("Instalação de som");

        OrdemServico os = service.criar(dto);

        assertThat(os.getId()).isNotNull();
        assertThat(os.getStatus()).isEqualTo(StatusOrdemServico.ABERTA);
        assertThat(os.getCliente().getId()).isEqualTo(cliente.getId());
    }

    @Test
    void finalizarOS_deveReduzirEstoqueDosProdutos() {
        // Cria OS com 1 item
        ItemOSDTO item = new ItemOSDTO();
        item.setProdutoId(produto.getId());
        item.setQuantidade(new BigDecimal("3.000"));

        OrdemServicoDTO dto = new OrdemServicoDTO();
        dto.setClienteId(cliente.getId());
        dto.setVeiculoId(veiculo.getId());
        dto.setItens(List.of(item));

        OrdemServico os = service.criar(dto);

        // Finaliza a OS
        service.atualizarStatus(os.getId(), "FINALIZADA");

        // Verifica que o estoque foi reduzido
        Produtos atualizado = produtoRepo.findById(produto.getId()).orElseThrow();
        assertThat(atualizado.getQuantidadeEstoque())
                .isEqualByComparingTo(new BigDecimal("7.000")); // 10 - 3
    }

    @Test
    void finalizarOS_deveCriarLancamentoNoFinanceiro() {
        ItemOSDTO item = new ItemOSDTO();
        item.setProdutoId(produto.getId());
        item.setQuantidade(new BigDecimal("2.000"));
        item.setPrecoUnitario(new BigDecimal("50.00"));

        OrdemServicoDTO dto = new OrdemServicoDTO();
        dto.setClienteId(cliente.getId());
        dto.setVeiculoId(veiculo.getId());
        dto.setItens(List.of(item));

        OrdemServico os = service.criar(dto);
        service.atualizarStatus(os.getId(), "FINALIZADA");

        List<LancamentoFinanceiro> lancamentos = financeiroRepo.findAll();
        assertThat(lancamentos).isNotEmpty();
        // Deve ter pelo menos um lançamento de RECEITA vinculado à OS
        assertThat(lancamentos).anyMatch(l ->
                l.getOrdemServicoId() != null && l.getOrdemServicoId().equals(os.getId()));
    }

    @Test
    void finalizarOS_comEstoqueInsuficiente_deveLancarExcecao() {
        // Produto tem 10 unidades; tentamos usar 15
        ItemOSDTO item = new ItemOSDTO();
        item.setProdutoId(produto.getId());
        item.setQuantidade(new BigDecimal("15.000"));

        OrdemServicoDTO dto = new OrdemServicoDTO();
        dto.setClienteId(cliente.getId());
        dto.setVeiculoId(veiculo.getId());
        dto.setItens(List.of(item));

        OrdemServico os = service.criar(dto);

        assertThatThrownBy(() -> service.atualizarStatus(os.getId(), "FINALIZADA"))
                .isInstanceOf(EstoqueInsuficienteException.class)
                .hasMessageContaining("Fio 4mm");
    }

    @Test
    void cancelarOS_naoDeveAlterarEstoque() {
        ItemOSDTO item = new ItemOSDTO();
        item.setProdutoId(produto.getId());
        item.setQuantidade(new BigDecimal("2.000"));

        OrdemServicoDTO dto = new OrdemServicoDTO();
        dto.setClienteId(cliente.getId());
        dto.setVeiculoId(veiculo.getId());
        dto.setItens(List.of(item));

        OrdemServico os = service.criar(dto);
        service.atualizarStatus(os.getId(), "CANCELADA");

        // Estoque não deve ter sido alterado
        Produtos atualizado = produtoRepo.findById(produto.getId()).orElseThrow();
        assertThat(atualizado.getQuantidadeEstoque())
                .isEqualByComparingTo(new BigDecimal("10.000"));
    }
}
