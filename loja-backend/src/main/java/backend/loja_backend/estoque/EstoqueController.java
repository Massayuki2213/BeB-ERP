package backend.loja_backend.estoque;

import java.util.List;
import java.util.function.Supplier;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/estoque")
@Tag(name = "Estoque", description = "Kardex: entradas, saídas, ajustes e extrato de movimentações")
@RequiredArgsConstructor
public class EstoqueController {

    private final EstoqueService estoqueService;

    @PostMapping("/entrada")
    @Operation(summary = "Registrar entrada de estoque (compra, devolução)")
    public ResponseEntity<?> entrada(@Valid @RequestBody MovimentacaoEstoqueDTO dto) {
        return executar(() -> estoqueService.registrarEntrada(dto.getProdutoId(), dto.getQuantidade(), dto.getObservacao()));
    }

    @PostMapping("/saida")
    @Operation(summary = "Registrar saída manual de estoque (perda, uso interno)")
    public ResponseEntity<?> saida(@Valid @RequestBody MovimentacaoEstoqueDTO dto) {
        return executar(() -> estoqueService.registrarSaida(dto.getProdutoId(), dto.getQuantidade(), dto.getObservacao()));
    }

    @PostMapping("/ajuste")
    @Operation(summary = "Ajustar saldo para um valor absoluto (inventário). Campo 'quantidade' = novo saldo")
    public ResponseEntity<?> ajuste(@Valid @RequestBody MovimentacaoEstoqueDTO dto) {
        return executar(() -> estoqueService.registrarAjuste(dto.getProdutoId(), dto.getQuantidade(), dto.getObservacao()));
    }

    @GetMapping("/produto/{produtoId}")
    @Operation(summary = "Extrato (Kardex) de um produto")
    public List<MovimentacaoEstoque> extrato(@PathVariable Long produtoId) {
        return estoqueService.extrato(produtoId);
    }

    @GetMapping
    @Operation(summary = "Listar todas as movimentações")
    public List<MovimentacaoEstoque> listar() {
        return estoqueService.listarTodas();
    }

    private ResponseEntity<MovimentacaoEstoque> executar(Supplier<MovimentacaoEstoque> acao) {
        return ResponseEntity.status(HttpStatus.CREATED).body(acao.get());
    }
}
