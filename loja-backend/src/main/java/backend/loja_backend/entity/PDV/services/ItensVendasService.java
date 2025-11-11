//ItensVendasService.java
package backend.loja_backend.entity.PDV.services;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import backend.loja_backend.entity.PDV.dto.ItensVendasDTO;
import backend.loja_backend.entity.PDV.entity.ItensVendas;
import backend.loja_backend.entity.PDV.repositories.ItensVendasRepository;
import backend.loja_backend.entity.Produtos;
import backend.loja_backend.entity.PDV.entity.OrdemVenda;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ItensVendasService {

    private final ItensVendasRepository itensVendasRepository;

    @Transactional
    public ItensVendas criarItemVenda(ItensVendasDTO dto, Produtos produto, OrdemVenda ordemVenda) {
        ItensVendas item = new ItensVendas();
        item.setProduto(produto);
        item.setOrdemVenda(ordemVenda);
        item.setQuantidade(dto.getQuantidade());
        item.setPrecoUnitario(java.math.BigDecimal.valueOf(dto.getPrecoUnitario()));

        return itensVendasRepository.save(item);
    }

    public List<ItensVendas> listarTodos() {
        return itensVendasRepository.findAll();
    }

    public Optional<ItensVendas> buscarPorId(Long id) {
        return itensVendasRepository.findById(id);
    }

    @Transactional
    public void deletar(Long id) {
        itensVendasRepository.deleteById(id);
    }
}
