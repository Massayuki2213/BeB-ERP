//OrdemVendaRepository.java
package backend.loja_backend.entity.PDV.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import backend.loja_backend.entity.PDV.entity.OrdemVenda;

@Repository
public interface OrdemVendaRepository extends JpaRepository<OrdemVenda, Long> {

}
