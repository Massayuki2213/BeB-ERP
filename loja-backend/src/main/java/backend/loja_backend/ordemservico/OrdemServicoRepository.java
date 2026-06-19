package backend.loja_backend.ordemservico;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OrdemServicoRepository extends JpaRepository<OrdemServico, Long> {

    List<OrdemServico> findByClienteIdOrderByDataAberturaDesc(Long clienteId);

    List<OrdemServico> findByVeiculoIdOrderByDataAberturaDesc(Long veiculoId);
}
