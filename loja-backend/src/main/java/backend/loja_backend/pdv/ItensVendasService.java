package backend.loja_backend.pdv;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import backend.loja_backend.produto.Produtos;
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
