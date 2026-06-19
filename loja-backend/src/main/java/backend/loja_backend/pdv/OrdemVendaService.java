package backend.loja_backend.pdv;

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
import backend.loja_backend.produto.ProdutoRepository;
import backend.loja_backend.produto.Produtos;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrdemVendaService {

    private final OrdemVendaRepository ordemVendaRepository;
    private final ProdutoRepository produtoRepository;
    private final ClienteRepository clienteRepository;
    private final EstoqueService estoqueService;
    private final FinanceiroService financeiroService;

    @Transactional
    public OrdemVenda criarOrdemVenda(OrdemVendasDTO dto) {
        if (dto.getItensVendas() == null || dto.getItensVendas().isEmpty()) {
            throw new RuntimeException("A venda precisa de ao menos um item.");
        }

        OrdemVenda ordem = new OrdemVenda();

        // Cliente é opcional (venda rápida de balcão)
        if (dto.getClienteId() != null) {
            Clientes cliente = clienteRepository.findById(dto.getClienteId())
                    .orElseThrow(() -> new RuntimeException("Cliente não encontrado: " + dto.getClienteId()));
            ordem.setCliente(cliente);
        }

        ordem.setDescricao(dto.getDescricao());
        ordem.setDataVenda(LocalDateTime.now());
        // Venda de balcão já sai concluída por padrão
        ordem.setStatus(dto.getStatus() != null ? dto.getStatus() : "FINALIZADA");
        ordem.setFormaPagamento(dto.getFormaPagamento());

        List<ItensVendas> itensVendas = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal custoTotal = BigDecimal.ZERO;

        for (ItensVendasDTO itemDTO : dto.getItensVendas()) {
            Produtos produto = produtoRepository.findById(itemDTO.getProdutoId())
                    .orElseThrow(() -> new RuntimeException("Produto não encontrado: " + itemDTO.getProdutoId()));

            BigDecimal quantidade = itemDTO.getQuantidade();
            BigDecimal precoUnitario = itemDTO.getPrecoUnitario() != null
                    ? BigDecimal.valueOf(itemDTO.getPrecoUnitario())
                    : (produto.getPrecoVenda() != null ? BigDecimal.valueOf(produto.getPrecoVenda()) : BigDecimal.ZERO);
            BigDecimal custoUnitario = produto.getPrecoCusto() != null
                    ? BigDecimal.valueOf(produto.getPrecoCusto()) : BigDecimal.ZERO;

            // Baixa de estoque via Kardex (valida saldo; rola back tudo se faltar)
            estoqueService.registrarSaida(produto.getId(), quantidade, "Venda PDV - " + produto.getNome());

            ItensVendas itemVenda = new ItensVendas();
            itemVenda.setProduto(produto);
            itemVenda.setOrdemVenda(ordem);
            itemVenda.setQuantidade(quantidade);
            itemVenda.setPrecoUnitario(precoUnitario);
            itensVendas.add(itemVenda);

            total = total.add(quantidade.multiply(precoUnitario));
            custoTotal = custoTotal.add(quantidade.multiply(custoUnitario));
        }

        ordem.setItensVendas(itensVendas);
        // Total calculado no servidor (não confia no valor enviado pelo cliente)
        ordem.setValorTotal(total.setScale(2, RoundingMode.HALF_UP));
        OrdemVenda salvo = ordemVendaRepository.save(ordem);

        // Lança a receita no livro caixa (com o custo das peças para apurar o lucro)
        financeiroService.registrarVendaPdv(salvo.getId(), salvo.getValorTotal(),
                custoTotal.setScale(2, RoundingMode.HALF_UP), salvo.getFormaPagamento());
        return salvo;
    }

    public List<OrdemVenda> listarTodas() {
        return ordemVendaRepository.findAll();
    }

    public Optional<OrdemVenda> buscarPorId(Long id) {
        return ordemVendaRepository.findById(id);
    }

    @Transactional
    public void deletar(Long id) {
        OrdemVenda ordem = ordemVendaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Venda não encontrada: " + id));

        // Estorna o estoque das peças vendidas (criar dá baixa, excluir devolve)
        if (ordem.getItensVendas() != null) {
            for (ItensVendas item : ordem.getItensVendas()) {
                if (item.getProduto() != null && item.getQuantidade() != null
                        && item.getQuantidade().signum() > 0) {
                    estoqueService.registrarEntrada(item.getProduto().getId(), item.getQuantidade(),
                            "Estorno venda PDV #" + id + " - " + item.getProduto().getNome());
                }
            }
        }

        // Desfaz os lançamentos financeiros da venda
        financeiroService.removerPorVenda(id);

        ordemVendaRepository.deleteById(id);
    }
}
