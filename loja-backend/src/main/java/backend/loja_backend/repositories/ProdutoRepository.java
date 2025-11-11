package backend.loja_backend.repositories;
import org.springframework.data.jpa.repository.JpaRepository;

import backend.loja_backend.entity.Produtos;

public interface ProdutoRepository extends JpaRepository<Produtos, Long> {
    
}
