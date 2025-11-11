package backend.loja_backend.repositories;
import org.springframework.data.jpa.repository.JpaRepository;

import backend.loja_backend.entity.Clientes;

public interface ClienteRepository extends JpaRepository<Clientes, Long> {

}