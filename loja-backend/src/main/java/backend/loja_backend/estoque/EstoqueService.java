package backend.loja_backend.estoque;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import backend.loja_backend.produto.ProdutoRepository;
import backend.loja_backend.produto.Produtos;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EstoqueService {

    private final MovimentacaoEstoqueRepository movimentacaoRepository;
    private final ProdutoRepository produtoRepository;

    @Transactional
    public MovimentacaoEstoque registrarEntrada(Long produtoId, BigDecimal quantidade, String observacao) {
        validarPositiva(quantidade);
        Produtos produto = buscarProduto(produtoId);
        BigDecimal novoSaldo = saldoAtual(produto).add(quantidade);
        return aplicar(produto, TipoMovimentacao.ENTRADA, quantidade, novoSaldo, observacao);
    }

    @Transactional
    public MovimentacaoEstoque registrarSaida(Long produtoId, BigDecimal quantidade, String observacao) {
        validarPositiva(quantidade);
        Produtos produto = buscarProduto(produtoId);
        BigDecimal saldo = saldoAtual(produto);
        if (saldo.compareTo(quantidade) < 0) {
            throw new RuntimeException("Estoque insuficiente para o produto: " + produto.getNome()
                    + " (saldo " + saldo + ", saída " + quantidade + ")");
        }
        return aplicar(produto, TipoMovimentacao.SAIDA, quantidade, saldo.subtract(quantidade), observacao);
    }

    @Transactional
    public MovimentacaoEstoque registrarAjuste(Long produtoId, BigDecimal novoSaldo, String observacao) {
        if (novoSaldo == null || novoSaldo.signum() < 0) {
            throw new RuntimeException("Saldo de ajuste inválido: " + novoSaldo);
        }
        Produtos produto = buscarProduto(produtoId);
        BigDecimal delta = novoSaldo.subtract(saldoAtual(produto)).abs();
        return aplicar(produto, TipoMovimentacao.AJUSTE, delta, novoSaldo, observacao);
    }

    public List<MovimentacaoEstoque> extrato(Long produtoId) {
        return movimentacaoRepository.findByProdutoIdOrderByDataMovimentacaoDescIdDesc(produtoId);
    }

    public List<MovimentacaoEstoque> listarTodas() {
        return movimentacaoRepository.findAllByOrderByDataMovimentacaoDescIdDesc();
    }

    // --- internos ---

    private MovimentacaoEstoque aplicar(Produtos produto, TipoMovimentacao tipo, BigDecimal quantidade,
                                        BigDecimal novoSaldo, String observacao) {
        produto.setQuantidadeEstoque(novoSaldo);
        produtoRepository.save(produto);

        MovimentacaoEstoque mov = new MovimentacaoEstoque();
        mov.setProduto(produto);
        mov.setTipo(tipo);
        mov.setQuantidade(quantidade);
        mov.setSaldoApos(novoSaldo);
        mov.setObservacao(observacao);
        mov.setDataMovimentacao(LocalDateTime.now());
        return movimentacaoRepository.save(mov);
    }

    private Produtos buscarProduto(Long produtoId) {
        return produtoRepository.findById(produtoId)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado: " + produtoId));
    }

    private BigDecimal saldoAtual(Produtos produto) {
        return produto.getQuantidadeEstoque() != null ? produto.getQuantidadeEstoque() : BigDecimal.ZERO;
    }

    private void validarPositiva(BigDecimal quantidade) {
        if (quantidade == null || quantidade.signum() <= 0) {
            throw new RuntimeException("Quantidade deve ser maior que zero: " + quantidade);
        }
    }
}
