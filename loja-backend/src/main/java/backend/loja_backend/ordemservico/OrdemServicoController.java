package backend.loja_backend.ordemservico;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import backend.loja_backend.common.exception.OrdemServicoNaoEncontradaException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
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
        OrdemServico os = service.buscarPorId(id)
                .orElseThrow(() -> new OrdemServicoNaoEncontradaException(id));
        return ResponseEntity.ok(os);
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
    public ResponseEntity<OrdemServico> criar(@Valid @RequestBody OrdemServicoDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar OS (dados, itens, serviços)")
    public ResponseEntity<OrdemServico> atualizar(@PathVariable Long id, @Valid @RequestBody OrdemServicoDTO dto) {
        return ResponseEntity.ok(service.atualizar(id, dto));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Alterar status (ABERTA, EM_ANDAMENTO, AGUARDANDO_PECA, FINALIZADA, CANCELADA)")
    public ResponseEntity<OrdemServico> alterarStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(service.atualizarStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir OS")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
