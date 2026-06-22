package backend.loja_backend.pdv;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/ordens-venda")
@Tag(name = "Ordens de Venda", description = "PDV: vendas rápidas de balcão (cliente opcional)")
@RequiredArgsConstructor
public class OrdemVendaController {

    private final OrdemVendaService ordemVendaService;

    @PostMapping
    public ResponseEntity<OrdemVenda> criarOrdemVenda(@Valid @RequestBody OrdemVendasDTO dto) {
        return ResponseEntity.ok(ordemVendaService.criarOrdemVenda(dto));
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
