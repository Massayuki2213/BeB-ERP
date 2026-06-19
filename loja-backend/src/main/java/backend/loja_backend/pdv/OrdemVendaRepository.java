package backend.loja_backend.pdv;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrdemVendaRepository extends JpaRepository<OrdemVenda, Long> {

}
