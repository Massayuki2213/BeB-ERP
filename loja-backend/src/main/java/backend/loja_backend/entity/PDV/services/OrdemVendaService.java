package backend.loja_backend.entity.PDV.services;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import backend.loja_backend.entity.Clientes;
import backend.loja_backend.entity.LancamentoCaixa;
import backend.loja_backend.entity.MovimentacaoEstoque;
import backend.loja_backend.entity.Produtos;
import backend.loja_backend.entity.PDV.dto.ItensVendasDTO;
import backend.loja_backend.entity.PDV.dto.OrdemVendasDTO;
import backend.loja_backend.entity.PDV.entity.ItensVendas;
import backend.loja_backend.entity.PDV.entity.OrdemVenda;
import backend.loja_backend.entity.PDV.repositories.OrdemVendaRepository;
import backend.loja_backend.repositories.LancamentoCaixaRepository;
import backend.loja_backend.repositories.MovimentacaoEstoqueRepository;
import backend.loja_backend.repositories.ProdutoRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrdemVendaService {

    private final OrdemVendaRepository ordemVendaRepository;
    private final ProdutoRepository produtoRepository;
    
    // --- NOVOS REPOSITORIES INJETADOS ---
    private final MovimentacaoEstoqueRepository movimentacaoRepository;
    private final LancamentoCaixaRepository lancamentoCaixaRepository;

    private static final Long ID_MAO_DE_OBRA = 4L; 

    @Transactional
    public OrdemVenda criarOrdemVenda(OrdemVendasDTO dto, Clientes cliente) {
        // 1. Monta o Cabeçalho da Venda
        OrdemVenda ordem = new OrdemVenda();
        ordem.setCliente(cliente);
        ordem.setDescricao(dto.getDescricao());
        ordem.setValorTotal(BigDecimal.valueOf(dto.getValorTotal()));
        ordem.setDataVenda(LocalDateTime.now());
        ordem.setStatus(dto.getStatus());
        ordem.setFormaPagamento(dto.getFormaPagamento());

        // Precisamos salvar a ordem PRIMEIRO para ter o ID dela e usar no histórico
        // Mas como temos itens dependentes, vamos montar a lista primeiro e salvar tudo no final.
        // O JPA gerencia os IDs na transação.
        
        List<ItensVendas> itensVendas = new ArrayList<>();
        
        // 2. Processar Itens
        for (ItensVendasDTO itemDTO : dto.getItensVendas()) {
            
            Produtos produto = produtoRepository.findById(itemDTO.getProdutoId())
                    .orElseThrow(() -> new RuntimeException("Produto não encontrado ID: " + itemDTO.getProdutoId()));

            boolean isServico = produto.getIdProduto().equals(ID_MAO_DE_OBRA);

            // 3. Controle de Estoque (Baixa + Histórico)
            if (!isServico) {
                int estoqueAtual = produto.getQuantidadeEstoque() != null ? produto.getQuantidadeEstoque() : 0;
                
                if (estoqueAtual < itemDTO.getQuantidade()) {
                    throw new RuntimeException("Estoque insuficiente para: " + produto.getNome());
                }
                
                // A. Baixa a quantidade no cadastro do produto
                produto.setQuantidadeEstoque(estoqueAtual - itemDTO.getQuantidade());
                produtoRepository.save(produto);

                // B. (NOVO) Registra no Histórico de Movimentação
                MovimentacaoEstoque mov = new MovimentacaoEstoque();
                mov.setProduto(produto);
                mov.setQuantidade(-itemDTO.getQuantidade()); // Negativo pois é saída
                mov.setTipo("SAIDA");
                mov.setDataHora(LocalDateTime.now());
                mov.setObservacao("Venda PDV (Cliente: " + cliente.getNome() + ")");
                movimentacaoRepository.save(mov);
            }

            // 4. Cria o Item da Venda
            ItensVendas itemVenda = new ItensVendas();
            itemVenda.setProduto(produto);
            itemVenda.setOrdemVenda(ordem);
            itemVenda.setQuantidade(itemDTO.getQuantidade());
            itemVenda.setPrecoUnitario(BigDecimal.valueOf(itemDTO.getPrecoUnitario()));
            
            if (itemDTO.getPrecoTotal() != null) {
                itemVenda.setPrecoTotal(BigDecimal.valueOf(itemDTO.getPrecoTotal()));
            } else {
                itemVenda.setPrecoTotal(BigDecimal.valueOf(itemDTO.getPrecoUnitario() * itemDTO.getQuantidade()));
            }

            if (itemDTO.getNomeItem() != null && !itemDTO.getNomeItem().isEmpty()) {
                itemVenda.setNomeProduto(itemDTO.getNomeItem());
            } else {
                itemVenda.setNomeProduto(produto.getNome());
            }

            itensVendas.add(itemVenda);
        }

        ordem.setItensVendas(itensVendas);
        
        // 5. Salva a Venda no Banco
        OrdemVenda vendaSalva = ordemVendaRepository.save(ordem);

        // 6. (NOVO) Lança no Livro Caixa (Financeiro)
        LancamentoCaixa caixa = new LancamentoCaixa();
        caixa.setDescricao("Venda #" + vendaSalva.getId() + " - " + cliente.getNome());
        caixa.setValor(vendaSalva.getValorTotal()); // Já é BigDecimal
        caixa.setTipo("RECEITA");
        caixa.setDataHora(LocalDateTime.now());
        caixa.setVendaOrigem(vendaSalva); // Amarra com a venda
        
        lancamentoCaixaRepository.save(caixa);

        return vendaSalva;
    }

    // --- MÉTODOS DE LEITURA E DELEÇÃO MANTIDOS ---

    public List<OrdemVenda> listarTodas() {
        return ordemVendaRepository.findAll();
    }

    public Optional<OrdemVenda> buscarPorId(Long id) {
        return ordemVendaRepository.findById(id);
    }

    @Transactional
    public void deletar(Long id) {
        if (!ordemVendaRepository.existsById(id)) {
            throw new RuntimeException("Venda não encontrada para exclusão");
        }
        // Nota: Se você deletar a venda, o registro no caixa também deveria ser estornado?
        // Por padrão, como não configuramos Cascade no Caixa para Venda (apenas Venda->Itens),
        // o registro do caixa ficará lá. Isso é bom para auditoria, mas idealmente deveria criar um estorno.
        ordemVendaRepository.deleteById(id);
    }
}