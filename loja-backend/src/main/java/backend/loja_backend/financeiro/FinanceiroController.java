package backend.loja_backend.financeiro;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/financeiro")
@Tag(name = "Financeiro", description = "Livro caixa, fluxo de caixa, contas a pagar/receber")
@RequiredArgsConstructor
public class FinanceiroController {

    private final FinanceiroService service;

    @GetMapping("/lancamentos")
    @Operation(summary = "Listar todos os lançamentos")
    public List<LancamentoFinanceiro> listar() {
        return service.listarTodos();
    }

    @PostMapping("/lancamentos")
    @Operation(summary = "Criar lançamento manual (receita/despesa ou conta a pagar/receber)")
    public ResponseEntity<?> criar(@RequestBody LancamentoFinanceiroDTO dto) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(service.criarManual(dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Erro: " + e.getMessage());
        }
    }

    @PatchMapping("/lancamentos/{id}/liquidar")
    @Operation(summary = "Liquidar (marcar como pago/recebido) — entra no fluxo de caixa")
    public ResponseEntity<?> liquidar(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.liquidar(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Erro: " + e.getMessage());
        }
    }

    @PatchMapping("/lancamentos/{id}/cancelar")
    @Operation(summary = "Cancelar lançamento")
    public ResponseEntity<?> cancelar(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.cancelar(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Erro: " + e.getMessage());
        }
    }

    @DeleteMapping("/lancamentos/{id}")
    @Operation(summary = "Excluir lançamento")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/contas-a-pagar")
    @Operation(summary = "Despesas em aberto (contas a pagar)")
    public List<LancamentoFinanceiro> contasAPagar() {
        return service.contasAPagar();
    }

    @GetMapping("/contas-a-receber")
    @Operation(summary = "Receitas em aberto (contas a receber)")
    public List<LancamentoFinanceiro> contasAReceber() {
        return service.contasAReceber();
    }

    @GetMapping("/fluxo-caixa")
    @Operation(summary = "Fluxo de caixa diário (liquidados) entre duas datas (yyyy-MM-dd)")
    public List<FluxoCaixaDia> fluxoCaixa(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return service.fluxoCaixa(inicio, fim);
    }

    @GetMapping("/resumo")
    @Operation(summary = "Resumo do período: lucro de peça vs. serviço e saldo")
    public ResumoFinanceiro resumo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return service.resumo(inicio, fim);
    }
}
