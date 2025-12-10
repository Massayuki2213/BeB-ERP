// loja-backend/src/main/java/backend/loja_backend/services/ProdutoService.java
package backend.loja_backend.services;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;

import backend.loja_backend.repositories.ProdutoRepository;
import backend.loja_backend.dto.ProdutoDTO;
import backend.loja_backend.entity.Produtos;

import org.springframework.stereotype.Service;

@Service
public class ProdutoService {

    @Autowired
    private ProdutoRepository produtoRepositorie;

    public Iterable<Produtos> listarTodos() {
        return produtoRepositorie.findAll();
    }

    public Optional<Produtos> buscarPorId(Long idProduto) {
        return produtoRepositorie.findById(idProduto);
    }

    public Produtos salvar(ProdutoDTO produtoDTO) {
        Produtos produto = new Produtos();
        produto.setNome(produtoDTO.getNome());
        produto.setDescricao(produtoDTO.getDescricao());
        produto.setPrecoCusto(produtoDTO.getPrecoCusto());
        produto.setPrecoVenda(produtoDTO.getPrecoVenda());
        produto.setQuantidadeEstoque(produtoDTO.getQuantidadeEstoque());
        produto.setCategoria(produtoDTO.getCategoria());
        return produtoRepositorie.save(produto);
    }
    
    public Produtos atualizar(Long idProduto, ProdutoDTO produtoDTO) {
        return produtoRepositorie.findById(idProduto)
                .map(produtoExistente -> { // Nomeei como 'produtoExistente' para clareza
                    // Mapeia os dados do DTO para a entidade existente
                    produtoExistente.setNome(produtoDTO.getNome());
                    // produtoExistente.setDescricao(produtoDTO.getDescricao()); // O DTO que você
                    // me enviou tinha descrição
                    produtoExistente.setPrecoCusto(produtoDTO.getPrecoCusto());
                    produtoExistente.setPrecoVenda(produtoDTO.getPrecoVenda());

                    // O campo que você quer atualizar
                    produtoExistente.setQuantidadeEstoque(produtoDTO.getQuantidadeEstoque());

                    produtoExistente.setCategoria(produtoDTO.getCategoria());

                    return produtoRepositorie.save(produtoExistente);
                })
                .orElseThrow(() -> new RuntimeException("Produto não encontrado"));
    }

    public void deletar(Long idProduto) {
        produtoRepositorie.deleteById(idProduto);
    }
}
