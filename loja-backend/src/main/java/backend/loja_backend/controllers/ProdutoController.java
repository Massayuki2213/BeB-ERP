package backend.loja_backend.controllers;

import backend.loja_backend.services.ProdutoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import backend.loja_backend.dto.ProdutoDTO;
import backend.loja_backend.entity.Produtos;

import java.util.List;


@RestController
@RequestMapping("/api/produtos")
@Tag(name = "Produto", description = "API para gerenciamento de Produtos")
public class ProdutoController {

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
    
  