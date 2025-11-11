package backend.loja_backend.repositories;
import org.springframework.data.jpa.repository.JpaRepository;

import backend.loja_backend.entity.Servicos;

public interface ServicoRepository extends JpaRepository<Servicos, Long> {

}