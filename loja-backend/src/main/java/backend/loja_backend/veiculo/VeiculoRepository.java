package backend.loja_backend.veiculo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface VeiculoRepository extends JpaRepository<Veiculo, Long> {

    List<Veiculo> findByClienteId(Long clienteId);

    Optional<Veiculo> findByPlaca(String placa);
}
