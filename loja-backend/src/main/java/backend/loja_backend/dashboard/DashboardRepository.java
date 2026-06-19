package backend.loja_backend.dashboard;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import backend.loja_backend.pdv.OrdemVenda;

// Substitua Long pelo tipo da sua entidade OrdemVenda id, se for diferente
public interface DashboardRepository extends CrudRepository<OrdemVenda, Long> {

    // JPQL usando a entity "OrdemVenda" e seus campos (ajuste nomes se necessário)
    @Query("SELECT o.formaPagamento AS forma, SUM(o.valorTotal) AS total " +
           "FROM OrdemVenda o " +
           "WHERE o.status = 'FINALIZADA' " +
           "AND o.dataVenda BETWEEN :start AND :end " +
           "GROUP BY o.formaPagamento")
    List<FormaTotalProjection> sumByFormaBetween(@Param("start") LocalDateTime start,
                                                 @Param("end") LocalDateTime end);

    interface FormaTotalProjection {
        String getForma();
        BigDecimal getTotal();
    }
}
