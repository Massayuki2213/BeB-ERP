package backend.loja_backend.financeiro;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import backend.loja_backend.common.exception.LancamentoNaoEncontradoException;
import backend.loja_backend.common.exception.RegraDeNegocioException;

@Service
@RequiredArgsConstructor
public class FinanceiroService {

    private final LancamentoFinanceiroRepository repo;

    // ----------------------------------------------------- geração automática

    /** Venda de balcão (PDV): receita de peça liquidada na hora. */
    @Transactional
    public void registrarVendaPdv(Long vendaId, BigDecimal valorTotal, BigDecimal custoPecas, String formaPagamento) {
        LancamentoFinanceiro l = novo(TipoLancamento.RECEITA, CategoriaLancamento.VENDA_PECA,
                "Venda PDV #" + vendaId, nz(valorTotal), OrigemLancamento.PDV);
        l.setCusto(nz(custoPecas));
        l.setStatus(StatusLancamento.LIQUIDADO);
        l.setFormaPagamento(formaPagamento);
        l.setOrdemVendaId(vendaId);
        repo.save(l);
    }

    @Transactional
    public void removerPorVenda(Long ordemVendaId) {
        repo.deleteByOrdemVendaId(ordemVendaId);
    }

    /** Fechamento de OS: receita de peça + receita de serviço (liquidadas) e repasses como contas a pagar. */
    @Transactional
    public void registrarFechamentoOs(Long osId, BigDecimal valorPecas, BigDecimal custoPecas,
                                      BigDecimal valorServicos, List<RepasseParceiro> repasses) {
        if (nz(valorPecas).signum() > 0) {
            LancamentoFinanceiro p = novo(TipoLancamento.RECEITA, CategoriaLancamento.VENDA_PECA,
                    "OS #" + osId + " - peças", nz(valorPecas), OrigemLancamento.OS);
            p.setCusto(nz(custoPecas));
            p.setStatus(StatusLancamento.LIQUIDADO);
            p.setOrdemServicoId(osId);
            repo.save(p);
        }
        if (nz(valorServicos).signum() > 0) {
            LancamentoFinanceiro s = novo(TipoLancamento.RECEITA, CategoriaLancamento.VENDA_SERVICO,
                    "OS #" + osId + " - serviços", nz(valorServicos), OrigemLancamento.OS);
            s.setCusto(BigDecimal.ZERO);
            s.setStatus(StatusLancamento.LIQUIDADO);
            s.setOrdemServicoId(osId);
            repo.save(s);
        }
        if (repasses != null) {
            for (RepasseParceiro r : repasses) {
                if (r.valor() == null || r.valor().signum() <= 0) continue;
                String parceiro = r.parceiro() != null ? r.parceiro() : "parceiro";
                LancamentoFinanceiro d = novo(TipoLancamento.DESPESA, CategoriaLancamento.REPASSE_PARCEIRO,
                        "Repasse OS #" + osId + " - " + parceiro, r.valor(), OrigemLancamento.OS);
                d.setStatus(StatusLancamento.PENDENTE);   // conta a pagar ao parceiro
                d.setOrdemServicoId(osId);
                repo.save(d);
            }
        }
    }

    @Transactional
    public void removerPorOs(Long ordemServicoId) {
        repo.deleteByOrdemServicoId(ordemServicoId);
    }

    // ----------------------------------------------------- manual / status

    @Transactional
    public LancamentoFinanceiro criarManual(LancamentoFinanceiroDTO dto) {
        if (dto.getTipo() == null) {
            throw new RegraDeNegocioException("tipo é obrigatório (RECEITA ou DESPESA)");
        }
        if (dto.getValor() == null || dto.getValor().signum() <= 0) {
            throw new RegraDeNegocioException("valor deve ser maior que zero");
        }
        LancamentoFinanceiro l = new LancamentoFinanceiro();
        l.setTipo(dto.getTipo());
        l.setCategoria(dto.getCategoria() != null ? dto.getCategoria()
                : (dto.getTipo() == TipoLancamento.RECEITA
                    ? CategoriaLancamento.OUTRA_RECEITA : CategoriaLancamento.OUTRA_DESPESA));
        l.setDescricao(dto.getDescricao());
        l.setValor(dto.getValor());
        l.setCusto(dto.getCusto());
        l.setData(dto.getData() != null ? dto.getData() : LocalDate.now());
        l.setDataVencimento(dto.getDataVencimento());
        l.setStatus(dto.getStatus() != null ? dto.getStatus() : StatusLancamento.LIQUIDADO);
        l.setFormaPagamento(dto.getFormaPagamento());
        l.setOrigem(OrigemLancamento.MANUAL);
        return repo.save(l);
    }

    @Transactional
    public LancamentoFinanceiro liquidar(Long id) {
        LancamentoFinanceiro l = buscar(id);
        l.setStatus(StatusLancamento.LIQUIDADO);
        l.setData(LocalDate.now());   // entra no fluxo de caixa na data do pagamento/recebimento
        return repo.save(l);
    }

    @Transactional
    public LancamentoFinanceiro cancelar(Long id) {
        LancamentoFinanceiro l = buscar(id);
        l.setStatus(StatusLancamento.CANCELADO);
        return repo.save(l);
    }

    @Transactional
    public void deletar(Long id) {
        repo.deleteById(id);
    }

    // ----------------------------------------------------- consultas

    public List<LancamentoFinanceiro> listarTodos() {
        return repo.findAllByOrderByDataDescIdDesc();
    }

    public List<LancamentoFinanceiro> contasAPagar() {
        return repo.findByTipoAndStatusOrderByDataVencimentoAscIdAsc(TipoLancamento.DESPESA, StatusLancamento.PENDENTE);
    }

    public List<LancamentoFinanceiro> contasAReceber() {
        return repo.findByTipoAndStatusOrderByDataVencimentoAscIdAsc(TipoLancamento.RECEITA, StatusLancamento.PENDENTE);
    }

    /** Fluxo de caixa diário (somente liquidados), com saldo do dia e acumulado. */
    public List<FluxoCaixaDia> fluxoCaixa(LocalDate inicio, LocalDate fim) {
        List<LancamentoFinanceiro> ls =
                repo.findByStatusAndDataBetweenOrderByDataAsc(StatusLancamento.LIQUIDADO, inicio, fim);

        Map<LocalDate, BigDecimal[]> porDia = new TreeMap<>();
        for (LancamentoFinanceiro l : ls) {
            BigDecimal[] acc = porDia.computeIfAbsent(l.getData(),
                    d -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            if (l.getTipo() == TipoLancamento.RECEITA) {
                acc[0] = acc[0].add(nz(l.getValor()));
            } else {
                acc[1] = acc[1].add(nz(l.getValor()));
            }
        }

        List<FluxoCaixaDia> resultado = new ArrayList<>();
        BigDecimal acumulado = BigDecimal.ZERO;
        for (Map.Entry<LocalDate, BigDecimal[]> e : porDia.entrySet()) {
            BigDecimal entradas = e.getValue()[0];
            BigDecimal saidas = e.getValue()[1];
            BigDecimal saldoDia = entradas.subtract(saidas);
            acumulado = acumulado.add(saldoDia);
            resultado.add(new FluxoCaixaDia(e.getKey(), entradas, saidas, saldoDia, acumulado));
        }
        return resultado;
    }

    /** Resumo por competência (todos menos cancelados): lucro peça vs. serviço. */
    public ResumoFinanceiro resumo(LocalDate inicio, LocalDate fim) {
        List<LancamentoFinanceiro> ls = repo.findByDataBetweenOrderByDataAscIdAsc(inicio, fim);

        BigDecimal receitaPecas = BigDecimal.ZERO, custoPecas = BigDecimal.ZERO;
        BigDecimal receitaServicos = BigDecimal.ZERO, repasses = BigDecimal.ZERO;
        BigDecimal totalEntradas = BigDecimal.ZERO, totalSaidas = BigDecimal.ZERO;

        for (LancamentoFinanceiro l : ls) {
            if (l.getStatus() == StatusLancamento.CANCELADO) continue;
            BigDecimal valor = nz(l.getValor());
            if (l.getTipo() == TipoLancamento.RECEITA) {
                totalEntradas = totalEntradas.add(valor);
            } else {
                totalSaidas = totalSaidas.add(valor);
            }
            switch (l.getCategoria()) {
                case VENDA_PECA -> {
                    receitaPecas = receitaPecas.add(valor);
                    custoPecas = custoPecas.add(nz(l.getCusto()));
                }
                case VENDA_SERVICO -> receitaServicos = receitaServicos.add(valor);
                case REPASSE_PARCEIRO -> repasses = repasses.add(valor);
                default -> { }
            }
        }

        return new ResumoFinanceiro(
                receitaPecas, custoPecas, receitaPecas.subtract(custoPecas),
                receitaServicos, repasses, receitaServicos.subtract(repasses),
                totalEntradas, totalSaidas, totalEntradas.subtract(totalSaidas));
    }

    // ----------------------------------------------------- helpers

    private LancamentoFinanceiro novo(TipoLancamento tipo, CategoriaLancamento cat, String desc,
                                      BigDecimal valor, OrigemLancamento origem) {
        LancamentoFinanceiro l = new LancamentoFinanceiro();
        l.setTipo(tipo);
        l.setCategoria(cat);
        l.setDescricao(desc);
        l.setValor(valor);
        l.setData(LocalDate.now());
        l.setOrigem(origem);
        return l;
    }

    private LancamentoFinanceiro buscar(Long id) {
        return repo.findById(id).orElseThrow(() -> new LancamentoNaoEncontradoException(id));
    }

    private BigDecimal nz(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}
