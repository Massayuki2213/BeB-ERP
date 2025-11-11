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
                return produtoRepositorie.save(produto);
            })
            .orElseThrow(() -> new RuntimeException("Produto não encontrado"));
    }

    public void deletar(Long id) {
        produtoRepositorie.deleteById(id);
    }
}
