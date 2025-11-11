package backend.loja_backend.controllers;

import backend.loja_backend.services.ClienteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import backend.loja_backend.dto.ClienteDTO;
import backend.loja_backend.entity.Clientes;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
@Tag(name = "Cliente", description = "API para gerenciamento de Clientes")
public class ClienteController {

    @Autowired
    private ClienteService clienteService;
        
    @GetMapping("/{id}")
    @Operation(summary = "Buscar cliente por ID", description = "Retorna um cliente específico pelo seu ID")
    public ResponseEntity<Clientes> buscarPorId(@PathVariable Long id) {
        return clienteService.buscarPorId(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    @Operation(summary = "Listar todos os clientes", description = "Retorna uma lista de todos os clientes")
    public List<Clientes> listarTodos() {
        return clienteService.listarTodos();
    }
    
    @PostMapping
    @Operation(summary = "Cadastrar novo cliente", description = "Cria um novo cliente no banco de dados")
    public ResponseEntity<Clientes> criar(@RequestBody ClienteDTO cliente) {
        Clientes novoCliente = clienteService.salvar(cliente);
        return ResponseEntity.status(HttpStatus.CREATED).body(novoCliente);
  
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar cliente", description = "Atualiza os dados de um cliente existente")
    public ResponseEntity<Clientes> atualizar(@PathVariable Long id, @RequestBody Clientes cliente) {
        try {
            Clientes clienteAtualizado = clienteService.atualizar(id, cliente);
            return ResponseEntity.ok(clienteAtualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Deletar cliente", description = "Remove um cliente do banco de dados")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        clienteService.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
