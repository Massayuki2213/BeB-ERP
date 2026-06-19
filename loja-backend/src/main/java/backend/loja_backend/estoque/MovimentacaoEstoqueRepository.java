package backend.loja_backend.estoque;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MovimentacaoEstoqueRepository extends JpaRepository<MovimentacaoEstoque, Long> {

    List<MovimentacaoEstoque> findByProdutoIdOrderByDataMovimentacaoDescIdDesc(Long produtoId);

    List<MovimentacaoEstoque> findAllByOrderByDataMovimentacaoDescIdDesc();
}
