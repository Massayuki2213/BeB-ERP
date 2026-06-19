package backend.loja_backend.produto;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import backend.loja_backend.common.PageResponse;

import java.util.List;
import java.util.Set;


@RestController
@RequestMapping("/api/produtos")
@Tag(name = "Produto", description = "API para gerenciamento de Produtos")
public class ProdutoController {

    // Campos permitidos para ordenação (evita erro com sort arbitrário)
    private static final Set<String> CAMPOS_ORDENACAO =
            Set.of("id", "nome", "precoVenda", "precoCusto", "quantidadeEstoque", "unidadeMedida");

    @Autowired
    private ProdutoService produtoService;

    @GetMapping("/{id}")
    @Operation(summary = "Buscar produto por ID", description = "Retorna um produto específico pelo seu ID")
    public ResponseEntity<Produtos> buscarPorId(@PathVariable Long id) {
        return produtoService.buscarPorId(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    @Operation(summary = "Listar todos os produtos", description = "Retorna uma lista de todos os produtos")
    public List<Produtos> listarTodos() {
        return (List<Produtos>) produtoService.listarTodos();
    }

    @GetMapping("/pagina")
    @Operation(summary = "Listar produtos paginado",
            description = "Paginação + busca por nome. Ex.: /api/produtos/pagina?page=0&size=20&q=led&sort=nome&dir=asc")
    public PageResponse<Produtos> listarPaginado(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "nome") String sort,
            @RequestParam(defaultValue = "asc") String dir) {

        String campo = CAMPOS_ORDENACAO.contains(sort) ? sort : "nome";
        Sort.Direction direcao = "desc".equalsIgnoreCase(dir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 200),
                Sort.by(direcao, campo));

        Page<Produtos> p = produtoService.listarPaginado(q, pageable);
        return new PageResponse<>(p.getContent(), p.getTotalElements(), p.getTotalPages(), p.getNumber(), p.getSize());
    }

    @PostMapping
    @Operation(summary = "Cadastrar novo produto", description = "Cria um novo produto no banco de dados")
    public ResponseEntity<Produtos> criar(@RequestBody ProdutoDTO produto) {
        Produtos novoProduto = produtoService.salvar(produto);
        return ResponseEntity.status(HttpStatus.CREATED).body(novoProduto);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deletar produto", description = "Remove um produto do banco de dados")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        produtoService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar produto", description = "Atualiza os dados de um produto existente")
    public ResponseEntity<Produtos> atualizar(@PathVariable Long id, @RequestBody Produtos produto) {
        try {
            Produtos produtoAtualizado = produtoService.atualizar(id, produto);
            return ResponseEntity.ok(produtoAtualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

}
