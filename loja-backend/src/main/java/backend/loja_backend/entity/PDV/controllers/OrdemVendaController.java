//OrdemVendaController.java
package backend.loja_backend.entity.PDV.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import backend.loja_backend.entity.Clientes;
import backend.loja_backend.entity.PDV.dto.OrdemVendasDTO;
import backend.loja_backend.entity.PDV.entity.OrdemVenda;
import backend.loja_backend.entity.PDV.services.OrdemVendaService;
import backend.loja_backend.repositories.ClienteRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/ordens-venda")
@CrossOrigin(origins = "http://localhost:5173")  // ← ADICIONE ESTA LINHA
@Tag(name = "Ordens de Venda", description = "Endpoints para gerenciar ordens de venda")
@RequiredArgsConstructor
public class OrdemVendaController {

    private final OrdemVendaService ordemVendaService;
    private final ClienteRepository clienteRepository;

    @PostMapping
    public ResponseEntity<?> criarOrdemVenda(@RequestBody OrdemVendasDTO dto) {
        try {
            Clientes cliente = clienteRepository.findById(dto.getClienteId())
                    .orElseThrow(() -> new RuntimeException("Cliente não encontrado!"));

            OrdemVenda novaOrdem = ordemVendaService.criarOrdemVenda(dto, cliente);
            return ResponseEntity.ok(novaOrdem);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro: " + e.getMessage());
        }
    }

    @GetMapping
    public List<OrdemVenda> listarOrdensVendas() {
        return ordemVendaService.listarTodas();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Long id) {
        return ordemVendaService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        ordemVendaService.deletar(id);
        return ResponseEntity.ok("Ordem de venda deletada com sucesso!");
    }
}