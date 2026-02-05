package backend.loja_backend.services;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import backend.loja_backend.dto.ProdutoDTO;
import backend.loja_backend.entity.Produtos;
import backend.loja_backend.repositories.ProdutoRepository;

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

    // --- SALVAR (CRIAR NOVO) ---
    public Produtos salvar(ProdutoDTO dto) {
        Produtos produto = new Produtos();
        
        produto.setNome(dto.getNome());
        produto.setDescricao(dto.getDescricao());
        produto.setCategoria(dto.getCategoria());
        produto.setQuantidadeEstoque(dto.getQuantidadeEstoque());
        
        // Mapeando o Código de Barras do DTO para a Entidade
        produto.setCodigoBarras(dto.getCodigoBarras()); 

        // Preços (Double)
        produto.setPrecoCusto(dto.getPrecoCusto());
        produto.setPrecoVenda(dto.getPrecoVenda());

        return produtoRepositorie.save(produto);
    }
    
    // --- ATUALIZAR ---
    public Produtos atualizar(Long idProduto, ProdutoDTO dto) {
        return produtoRepositorie.findById(idProduto)
                .map(produtoExistente -> {
                    
                    produtoExistente.setNome(dto.getNome());
                    produtoExistente.setDescricao(dto.getDescricao());
                    produtoExistente.setCategoria(dto.getCategoria());
                    produtoExistente.setQuantidadeEstoque(dto.getQuantidadeEstoque());
                    
                    // Atualiza o código de barras caso tenha mudado
                    produtoExistente.setCodigoBarras(dto.getCodigoBarras());

                    // Atualiza preços
                    produtoExistente.setPrecoCusto(dto.getPrecoCusto());
                    produtoExistente.setPrecoVenda(dto.getPrecoVenda());

                    return produtoRepositorie.save(produtoExistente);
                })
                .orElseThrow(() -> new RuntimeException("Produto não encontrado"));
    }

    public void deletar(Long idProduto) {
        produtoRepositorie.deleteById(idProduto);
    }
}