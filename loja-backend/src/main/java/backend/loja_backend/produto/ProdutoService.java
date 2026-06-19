package backend.loja_backend.produto;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class ProdutoService {

    @Autowired
    private ProdutoRepository produtoRepositorie;

    public Iterable<Produtos> listarTodos() {
        return produtoRepositorie.findAll();
    }

    public Page<Produtos> listarPaginado(String q, Pageable pageable) {
        if (q == null || q.isBlank()) {
            return produtoRepositorie.findAll(pageable);
        }
        return produtoRepositorie.findByNomeContainingIgnoreCase(q.trim(), pageable);
    }

    public Optional<Produtos> buscarPorId(Long id) {
        return produtoRepositorie.findById(id);
    }

    public Produtos salvar(ProdutoDTO produtoDTO) {
        Produtos produto = new Produtos();
        produto.setNome(produtoDTO.getNome());
        produto.setDescricao(produtoDTO.getDescricao());
        produto.setPrecoCusto(produtoDTO.getPrecoCusto());
        produto.setPrecoVenda(produtoDTO.getPrecoVenda());
        produto.setQuantidadeEstoque(produtoDTO.getQuantidadeEstoque());
        produto.setUnidadeMedida(produtoDTO.getUnidadeMedida() != null
                ? produtoDTO.getUnidadeMedida()
                : UnidadeMedida.UN);
        return produtoRepositorie.save(produto);
    }

    public Produtos atualizar(Long id, Produtos produtoAtualizado) {
        return produtoRepositorie.findById(id)
            .map(produto -> {
                produto.setNome(produtoAtualizado.getNome());
                produto.setDescricao(produtoAtualizado.getDescricao());
                produto.setPrecoCusto(produtoAtualizado.getPrecoCusto());
                produto.setPrecoVenda(produtoAtualizado.getPrecoVenda());
                produto.setQuantidadeEstoque(produtoAtualizado.getQuantidadeEstoque());
                // só troca a unidade se vier preenchida (evita resetar para UN em update parcial)
                if (produtoAtualizado.getUnidadeMedida() != null) {
                    produto.setUnidadeMedida(produtoAtualizado.getUnidadeMedida());
                }
                return produtoRepositorie.save(produto);
            })
            .orElseThrow(() -> new RuntimeException("Produto não encontrado"));
    }

    public void deletar(Long id) {
        produtoRepositorie.deleteById(id);
    }
}
