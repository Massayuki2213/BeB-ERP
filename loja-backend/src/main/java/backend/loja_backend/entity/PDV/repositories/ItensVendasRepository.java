//ItensVendasRepository.java
package backend.loja_backend.entity.PDV.repositories;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import backend.loja_backend.entity.PDV.entity.ItensVendas;

@Repository
public interface ItensVendasRepository extends JpaRepository<ItensVendas, Long> {

}
