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

    // --- CONFIGURAÇÃO: ID DO PRODUTO CORINGA ---
    private static final Long ID_MAO_DE_OBRA = 4L; 

    @Transactional
    public OrdemVenda criarOrdemVenda(OrdemVendasDTO dto, Clientes cliente) {
        // 1. Dados do Cabeçalho da Venda
        OrdemVenda ordem = new OrdemVenda();
        ordem.setCliente(cliente);
        ordem.setDescricao(dto.getDescricao());
        ordem.setValorTotal(BigDecimal.valueOf(dto.getValorTotal()));
        ordem.setDataVenda(LocalDateTime.now());
        ordem.setStatus(dto.getStatus());
        ordem.setFormaPagamento(dto.getFormaPagamento());

        List<ItensVendas> itensVendas = new ArrayList<>();
        
        // 2. Processar cada item da lista
        for (ItensVendasDTO itemDTO : dto.getItensVendas()) {
            
            // Busca o Produto no banco
            Produtos produto = produtoRepository.findById(itemDTO.getProdutoId())
                    .orElseThrow(() -> new RuntimeException("Produto não encontrado ID: " + itemDTO.getProdutoId()));

            // --- VERIFICAÇÃO PELO ID 4 ---
            // Se for o ID 4, consideramos serviço
            boolean isServico = produto.getIdProduto().equals(ID_MAO_DE_OBRA);

            // 3. Só baixa estoque se NÃO for serviço
            if (!isServico) {
                // Verifica se tem estoque (assumindo que o getter é getQuantidadeEstoque ou getQuantidade)
                // Ajuste 'getQuantidadeEstoque()' se seu Lombok gerou outro nome
                int estoqueAtual = produto.getQuantidadeEstoque() != null ? produto.getQuantidadeEstoque() : 0;
                
                if (estoqueAtual < itemDTO.getQuantidade()) {
                    throw new RuntimeException("Estoque insuficiente para: " + produto.getNome());
                }
                
                produto.setQuantidadeEstoque(estoqueAtual - itemDTO.getQuantidade());
                produtoRepository.save(produto);
            }

            // 4. Cria o Item da Venda
            ItensVendas itemVenda = new ItensVendas();
            itemVenda.setProduto(produto);
            itemVenda.setOrdemVenda(ordem);
            itemVenda.setQuantidade(itemDTO.getQuantidade());
            
            // Confia no preço que veio do Front (para aceitar o valor do serviço)
            itemVenda.setPrecoUnitario(BigDecimal.valueOf(itemDTO.getPrecoUnitario()));
            
            // Calcula ou usa o total vindo do front
            if (itemDTO.getPrecoTotal() != null) {
                itemVenda.setPrecoTotal(BigDecimal.valueOf(itemDTO.getPrecoTotal()));
            } else {
                itemVenda.setPrecoTotal(BigDecimal.valueOf(itemDTO.getPrecoUnitario() * itemDTO.getQuantidade()));
            }

            // 5. O PULO DO GATO: Salvar o nome correto
            // Se o Front mandou "Instalação", salvamos "Instalação". Se não, salvamos o nome original.
            if (itemDTO.getNomeItem() != null && !itemDTO.getNomeItem().isEmpty()) {
                itemVenda.setNomeProduto(itemDTO.getNomeItem());
            } else {
                itemVenda.setNomeProduto(produto.getNome());
            }

            itensVendas.add(itemVenda);
        }

        ordem.setItensVendas(itensVendas);
        return ordemVendaRepository.save(ordem);
    }

    // --- MÉTODOS IMPLEMENTADOS CORRETAMENTE ---

    public List<OrdemVenda> listarTodas() {
        return ordemVendaRepository.findAll();
    }

    // Corrigido: Retorna Optional<OrdemVenda>, não Clientes
    public Optional<OrdemVenda> buscarPorId(Long id) {
        return ordemVendaRepository.findById(id);
    }

    @Transactional
    public void deletar(Long id) {
        // Opcional: Verificar se existe antes de deletar
        if (!ordemVendaRepository.existsById(id)) {
            throw new RuntimeException("Venda não encontrada para exclusão");
        }
        ordemVendaRepository.deleteById(id);
    }
}