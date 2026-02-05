package backend.loja_backend.repositories;

import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;
import backend.loja_backend.entity.LancamentoCaixa;
import java.util.List;

public interface LancamentoCaixaRepository extends JpaRepository<LancamentoCaixa, Long> {
    List<LancamentoCaixa> findByDataHoraBetween(LocalDateTime inicio, LocalDateTime fim);
}