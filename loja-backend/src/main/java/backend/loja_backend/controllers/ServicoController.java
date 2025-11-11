package backend.loja_backend.controllers;


import backend.loja_backend.services.ServicoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import backend.loja_backend.dto.ServicoDTO;
import backend.loja_backend.entity.Servicos;

import java.util.List;
@RestController
@RequestMapping("/api/servicos")
@Tag(name = "Serviço", description = "API para gerenciamento de Serviços")
public class ServicoController {

    @Autowired
    private ServicoService servicoService;
    @GetMapping("/{id}")
    @Operation(summary = "Buscar serviço por ID", description = "Retorna um serviço específico pelo seu ID")
    public ResponseEntity<Servicos> buscarPorId(@PathVariable Long id) {    
        return servicoService.buscarPorId(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    @Operation(summary = "Listar todos os serviços", description = "Retorna uma lista de todos os serviços")
    public List<Servicos> listarTodos() {
        return (List<Servicos>) servicoService.listarTodos();
    }

    @PostMapping
    @Operation(summary = "Cadastrar novo serviço", description = "Cria um novo serviço no banco de dados")
    public ResponseEntity<Servicos> criar(@RequestBody ServicoDTO servicoDTO) {
        Servicos novoServico = servicoService.salvar(servicoDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(novoServico);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deletar serviço", description = "Remove um serviço do banco de dados")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        servicoService.deletar(id);
        return ResponseEntity.noContent().build(); 
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Atualizar serviço", description = "Atualiza os dados de um serviço existente")
    public ResponseEntity<Servicos> atualizar(@PathVariable Long id, @RequestBody Servicos servico) {
        try {
            Servicos servicoAtualizado = servicoService.atualizar(id, servico);
            return ResponseEntity.ok(servicoAtualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }   

}
