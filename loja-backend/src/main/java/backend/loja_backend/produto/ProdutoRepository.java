package backend.loja_backend.produto;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProdutoRepository extends JpaRepository<Produtos, Long> {

    // Busca paginada por nome (case-insensitive). Apoia o índice trigram (V9).
    Page<Produtos> findByNomeContainingIgnoreCase(String nome, Pageable pageable);
}
