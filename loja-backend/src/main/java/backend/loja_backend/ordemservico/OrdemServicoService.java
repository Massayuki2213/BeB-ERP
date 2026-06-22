package backend.loja_backend.ordemservico;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import backend.loja_backend.cliente.ClienteRepository;
import backend.loja_backend.cliente.Clientes;
import backend.loja_backend.estoque.EstoqueService;
import backend.loja_backend.financeiro.FinanceiroService;
import backend.loja_backend.financeiro.RepasseParceiro;
import backend.loja_backend.produto.ProdutoRepository;
import backend.loja_backend.produto.Produtos;
import backend.loja_backend.servico.ServicoRepository;
import backend.loja_backend.servico.Servicos;
import backend.loja_backend.common.exception.ClienteNaoEncontradoException;
import backend.loja_backend.common.exception.OrdemServicoNaoEncontradaException;
import backend.loja_backend.common.exception.ProdutoNaoEncontradoException;
import backend.loja_backend.common.exception.RegraDeNegocioException;
import backend.loja_backend.common.exception.ServicoNaoEncontradoException;
import backend.loja_backend.common.exception.VeiculoNaoEncontradoException;
import backend.loja_backend.veiculo.Veiculo;
import backend.loja_backend.veiculo.VeiculoRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrdemServicoService {

    private final OrdemServicoRepository ordemServicoRepository;
    private final ClienteRepository clienteRepository;
    private final VeiculoRepository veiculoRepository;
    private final ProdutoRepository produtoRepository;
    private final ServicoRepository servicoRepository;
    private final EstoqueService estoqueService;
    private final FinanceiroService financeiroService;

    @Transactional
    public OrdemServico criar(OrdemServicoDTO dto) {
        Clientes cliente = clienteRepository.findById(dto.getClienteId())
                .orElseThrow(() -> new ClienteNaoEncontradoException(dto.getClienteId()));
        Veiculo veiculo = veiculoRepository.findById(dto.getVeiculoId())
                .orElseThrow(() -> new VeiculoNaoEncontradoException(dto.getVeiculoId()));

        OrdemServico os = new OrdemServico();
        os.setCliente(cliente);
        os.setVeiculo(veiculo);
        os.setDescricao(dto.getDescricao());
        os.setDataAbertura(LocalDateTime.now());

        StatusOrdemServico status = dto.getStatus() != null
                ? parseStatus(dto.getStatus())
                : StatusOrdemServico.ABERTA;
        os.setStatus(status);
        if (status == StatusOrdemServico.FINALIZADA) {
            os.setDataFechamento(LocalDateTime.now());
        }

        if (dto.getItens() != null) {
            os.getItens().addAll(construirItens(dto.getItens(), os));
        }
        if (dto.getServicos() != null) {
            os.getServicos().addAll(construirServicos(dto.getServicos(), os));
        }

        recalcularTotais(os);
        OrdemServico salvo = ordemServicoRepository.save(os);

        // Se a OS já nasce finalizada, dá baixa nas peças e lança no financeiro
        if (salvo.getStatus() == StatusOrdemServico.FINALIZADA) {
            darBaixaPecas(salvo);
            lancarFinanceiroFechamento(salvo);
            salvo = ordemServicoRepository.save(salvo);
        }
        return salvo;
    }

    public List<OrdemServico> listarTodas() {
        return ordemServicoRepository.findAll();
    }

    public Optional<OrdemServico> buscarPorId(Long id) {
        return ordemServicoRepository.findById(id);
    }

    public List<OrdemServico> listarPorCliente(Long clienteId) {
        return ordemServicoRepository.findByClienteIdOrderByDataAberturaDesc(clienteId);
    }

    public List<OrdemServico> listarPorVeiculo(Long veiculoId) {
        return ordemServicoRepository.findByVeiculoIdOrderByDataAberturaDesc(veiculoId);
    }

    @Transactional
    public OrdemServico atualizar(Long id, OrdemServicoDTO dto) {
        OrdemServico os = buscar(id);

        if (dto.getClienteId() != null) {
            os.setCliente(clienteRepository.findById(dto.getClienteId())
                    .orElseThrow(() -> new ClienteNaoEncontradoException(dto.getClienteId())));
        }
        if (dto.getVeiculoId() != null) {
            os.setVeiculo(veiculoRepository.findById(dto.getVeiculoId())
                    .orElseThrow(() -> new VeiculoNaoEncontradoException(dto.getVeiculoId())));
        }
        if (dto.getDescricao() != null) {
            os.setDescricao(dto.getDescricao());
        }
        if (dto.getItens() != null) {
            os.getItens().clear();
            os.getItens().addAll(construirItens(dto.getItens(), os));
        }
        if (dto.getServicos() != null) {
            os.getServicos().clear();
            os.getServicos().addAll(construirServicos(dto.getServicos(), os));
        }

        recalcularTotais(os);
        return ordemServicoRepository.save(os);
    }

    @Transactional
    public OrdemServico atualizarStatus(Long id, String statusStr) {
        OrdemServico os = buscar(id);
        StatusOrdemServico novo = parseStatus(statusStr);
        boolean jaBaixado = Boolean.TRUE.equals(os.getEstoqueBaixado());

        if (novo == StatusOrdemServico.FINALIZADA) {
            os.setDataFechamento(LocalDateTime.now());
            if (!jaBaixado) {
                darBaixaPecas(os);                  // baixa no estoque via Kardex
                lancarFinanceiroFechamento(os);     // receita peça/serviço + repasses (contas a pagar)
            }
        } else {
            os.setDataFechamento(null);
            if (jaBaixado) {
                estornarPecas(os);                          // devolve as peças ao estoque
                financeiroService.removerPorOs(os.getId()); // e desfaz os lançamentos
            }
        }

        os.setStatus(novo);
        return ordemServicoRepository.save(os);
    }

    @Transactional
    public void deletar(Long id) {
        ordemServicoRepository.deleteById(id);
    }

    // ------------------------------------------------------------------ helpers

    private OrdemServico buscar(Long id) {
        return ordemServicoRepository.findById(id)
                .orElseThrow(() -> new OrdemServicoNaoEncontradaException(id));
    }

    /** Dá baixa no estoque de cada peça da OS (SAIDA no Kardex). Valida saldo; rola back tudo se faltar. */
    private void darBaixaPecas(OrdemServico os) {
        for (ItemOS item : os.getItens()) {
            if (item.getQuantidade() == null || item.getQuantidade().signum() <= 0) continue;
            estoqueService.registrarSaida(item.getProduto().getId(), item.getQuantidade(),
                    "OS #" + os.getId() + " - " + item.getProduto().getNome());
        }
        os.setEstoqueBaixado(true);
    }

    /** Estorna a baixa: devolve cada peça ao estoque (ENTRADA no Kardex). */
    private void estornarPecas(OrdemServico os) {
        for (ItemOS item : os.getItens()) {
            if (item.getQuantidade() == null || item.getQuantidade().signum() <= 0) continue;
            estoqueService.registrarEntrada(item.getProduto().getId(), item.getQuantidade(),
                    "Estorno OS #" + os.getId() + " - " + item.getProduto().getNome());
        }
        os.setEstoqueBaixado(false);
    }

    /** Lança no financeiro o fechamento da OS: receita de peça/serviço e repasses (contas a pagar). */
    private void lancarFinanceiroFechamento(OrdemServico os) {
        List<RepasseParceiro> repasses = os.getServicos().stream()
                .filter(sv -> sv.getValorRepasse() != null && sv.getValorRepasse().signum() > 0)
                .map(sv -> new RepasseParceiro(sv.getParceiro(), sv.getValorRepasse()))
                .toList();
        financeiroService.registrarFechamentoOs(os.getId(), os.getValorPecas(),
                custoDasPecas(os), os.getValorServicos(), repasses);
    }

    /** Custo total das peças da OS (COGS), para apurar o lucro de peça no financeiro. */
    private BigDecimal custoDasPecas(OrdemServico os) {
        return os.getItens().stream()
                .map(i -> nz(i.getQuantidade()).multiply(
                        i.getProduto() != null && i.getProduto().getPrecoCusto() != null
                                ? BigDecimal.valueOf(i.getProduto().getPrecoCusto()) : BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private List<ItemOS> construirItens(List<ItemOSDTO> dtos, OrdemServico os) {
        List<ItemOS> itens = new ArrayList<>();
        for (ItemOSDTO d : dtos) {
            Produtos produto = produtoRepository.findById(d.getProdutoId())
                    .orElseThrow(() -> new ProdutoNaoEncontradoException(d.getProdutoId()));
            ItemOS item = new ItemOS();
            item.setOrdemServico(os);
            item.setProduto(produto);
            item.setQuantidade(nz(d.getQuantidade()));
            item.setPrecoUnitario(d.getPrecoUnitario() != null
                    ? d.getPrecoUnitario()
                    : (produto.getPrecoVenda() != null ? BigDecimal.valueOf(produto.getPrecoVenda()) : BigDecimal.ZERO));
            itens.add(item);
        }
        return itens;
    }

    private List<ServicoOS> construirServicos(List<ServicoOSDTO> dtos, OrdemServico os) {
        List<ServicoOS> servicos = new ArrayList<>();
        for (ServicoOSDTO d : dtos) {
            ServicoOS s = new ServicoOS();
            s.setOrdemServico(os);
            if (d.getServicoId() != null) {
                Servicos cat = servicoRepository.findById(d.getServicoId())
                        .orElseThrow(() -> new ServicoNaoEncontradoException(d.getServicoId()));
                s.setServico(cat);
                s.setDescricao(d.getDescricao() != null ? d.getDescricao() : cat.getNome());
                s.setValor(d.getValor() != null
                        ? d.getValor()
                        : (cat.getValorBase() != null ? BigDecimal.valueOf(cat.getValorBase()) : BigDecimal.ZERO));
            } else {
                s.setDescricao(d.getDescricao());
                s.setValor(nz(d.getValor()));
            }
            s.setParceiro(d.getParceiro());
            s.setValorRepasse(nz(d.getValorRepasse()));
            servicos.add(s);
        }
        return servicos;
    }

    private void recalcularTotais(OrdemServico os) {
        BigDecimal pecas = os.getItens().stream()
                .map(i -> nz(i.getQuantidade()).multiply(nz(i.getPrecoUnitario())))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal servicos = os.getServicos().stream()
                .map(s -> nz(s.getValor()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal repasses = os.getServicos().stream()
                .map(s -> nz(s.getValorRepasse()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        os.setValorPecas(pecas);
        os.setValorServicos(servicos);
        os.setValorRepasses(repasses);
        os.setValorTotal(pecas.add(servicos));
    }

    private BigDecimal nz(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    private StatusOrdemServico parseStatus(String s) {
        try {
            return StatusOrdemServico.valueOf(s.trim().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new RegraDeNegocioException("Status inválido: " + s
                    + ". Use: ABERTA, EM_ANDAMENTO, AGUARDANDO_PECA, FINALIZADA, CANCELADA");
        }
    }
}
