package backend.loja_backend.agenda;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {

    List<Agendamento> findAllByOrderByDataHoraInicioAsc();

    List<Agendamento> findByDataHoraInicioBetweenOrderByDataHoraInicioAsc(LocalDateTime inicio, LocalDateTime fim);

    List<Agendamento> findByBoxOrderByDataHoraInicioAsc(Integer box);

    List<Agendamento> findByVeiculoIdOrderByDataHoraInicioDesc(Long veiculoId);

    // Agendamentos no mesmo box que se sobrepõem ao intervalo [inicio, fim)
    List<Agendamento> findByBoxAndDataHoraInicioLessThanAndDataHoraFimGreaterThan(
            Integer box, LocalDateTime fim, LocalDateTime inicio);
}
