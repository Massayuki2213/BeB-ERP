package backend.loja_backend.ordemservico;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/ordens-servico")
@Tag(name = "Ordem de Serviço", description = "OS: cliente + veículo, peças (estoque), mão de obra e repasse a parceiro")
@RequiredArgsConstructor
public class OrdemServicoController {

    private final OrdemServicoService service;

    @GetMapping
    @Operation(summary = "Listar todas as ordens de serviço")
    public List<OrdemServico> listar() {
        return service.listarTodas();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar OS por ID")
    public ResponseEntity<OrdemServico> buscar(@PathVariable Long id) {
        return service.buscarPorId(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/cliente/{clienteId}")
    @Operation(summary = "Histórico de OS de um cliente")
    public List<OrdemServico> porCliente(@PathVariable Long clienteId) {
        return service.listarPorCliente(clienteId);
    }

    @GetMapping("/veiculo/{veiculoId}")
    @Operation(summary = "Histórico de OS de um veículo")
    public List<OrdemServico> porVeiculo(@PathVariable Long veiculoId) {
        return service.listarPorVeiculo(veiculoId);
    }

    @PostMapping
    @Operation(summary = "Abrir nova OS")
    public ResponseEntity<?> criar(@RequestBody OrdemServicoDTO dto) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Erro: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar OS (dados, itens, serviços)")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody OrdemServicoDTO dto) {
        try {
            return ResponseEntity.ok(service.atualizar(id, dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Erro: " + e.getMessage());
        }
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Alterar status (ABERTA, EM_ANDAMENTO, AGUARDANDO_PECA, FINALIZADA, CANCELADA)")
    public ResponseEntity<?> alterarStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            return ResponseEntity.ok(service.atualizarStatus(id, status));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Erro: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir OS")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
