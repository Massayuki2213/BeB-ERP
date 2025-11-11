//OrdemVendaService.java
package backend.loja_backend.entity.PDV.services;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import backend.loja_backend.entity.Clientes;
import backend.loja_backend.entity.Produtos;
import backend.loja_backend.entity.PDV.dto.ItensVendasDTO;
import backend.loja_backend.entity.PDV.dto.OrdemVendasDTO;
import backend.loja_backend.entity.PDV.entity.ItensVendas;
import backend.loja_backend.entity.PDV.entity.OrdemVenda;
import backend.loja_backend.entity.PDV.repositories.OrdemVendaRepository;
import backend.loja_backend.repositories.ProdutoRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrdemVendaService {

    private final OrdemVendaRepository ordemVendaRepository;
    private final ProdutoRepository produtoRepository;

    @Transactional
    public OrdemVenda criarOrdemVenda(OrdemVendasDTO dto, Clientes cliente) {
        // Criar ordem de venda
        OrdemVenda ordem = new OrdemVenda();
        ordem.setCliente(cliente);
        ordem.setDescricao(dto.getDescricao());
        ordem.setValorTotal(BigDecimal.valueOf(dto.getValorTotal()));
        ordem.setDataVenda(LocalDateTime.now());
        ordem.setStatus(dto.getStatus());
        ordem.setFormaPagamento(dto.getFormaPagamento());

        // Processar itens da venda
        List<ItensVendas> itensVendas = new ArrayList<>();
        
        for (ItensVendasDTO itemDTO : dto.getItensVendas()) {
            // Buscar produto
            Produtos produto = produtoRepository.findById(itemDTO.getProdutoId())
                    .orElseThrow(() -> new RuntimeException("Produto não encontrado: " + itemDTO.getProdutoId()));

            // Validar estoque
            if (produto.getQuantidade() == null || produto.getQuantidade() < itemDTO.getQuantidade()) {
                throw new RuntimeException("Estoque insuficiente para o produto: " + produto.getNome());
            }

            // Dar baixa no estoque
            produto.setQuantidade(produto.getQuantidade() - itemDTO.getQuantidade());
            produtoRepository.save(produto);

            // Criar item da venda
            ItensVendas itemVenda = new ItensVendas();
            itemVenda.setProduto(produto);
            itemVenda.setOrdemVenda(ordem);
            itemVenda.setQuantidade(itemDTO.getQuantidade());
            itemVenda.setPrecoUnitario(BigDecimal.valueOf(itemDTO.getPrecoUnitario()));

            itensVendas.add(itemVenda);
        }

        // Associar itens à ordem
        ordem.setItensVendas(itensVendas);

        // Salvar ordem (cascade salvará os itens)
        return ordemVendaRepository.save(ordem);
    }

    public List<OrdemVenda> listarTodas() {
        return ordemVendaRepository.findAll();
    }

    public Optional<OrdemVenda> buscarPorId(Long id) {
        return ordemVendaRepository.findById(id);
    }

    @Transactional
    public void deletar(Long id) {
        ordemVendaRepository.deleteById(id);
    }
}