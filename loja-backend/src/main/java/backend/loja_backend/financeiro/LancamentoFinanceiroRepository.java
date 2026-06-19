package backend.loja_backend.financeiro;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LancamentoFinanceiroRepository extends JpaRepository<LancamentoFinanceiro, Long> {

    List<LancamentoFinanceiro> findAllByOrderByDataDescIdDesc();

    List<LancamentoFinanceiro> findByTipoAndStatusOrderByDataVencimentoAscIdAsc(
            TipoLancamento tipo, StatusLancamento status);

    List<LancamentoFinanceiro> findByStatusAndDataBetweenOrderByDataAsc(
            StatusLancamento status, LocalDate inicio, LocalDate fim);

    List<LancamentoFinanceiro> findByDataBetweenOrderByDataAscIdAsc(LocalDate inicio, LocalDate fim);

    void deleteByOrdemVendaId(Long ordemVendaId);

    void deleteByOrdemServicoId(Long ordemServicoId);
}
