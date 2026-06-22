package backend.loja_backend.agenda;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/agendamentos")
@Tag(name = "Agenda", description = "Controle de box: horários e ocupação das baias")
@RequiredArgsConstructor
public class AgendaController {

    private final AgendaService service;

    @GetMapping
    @Operation(summary = "Listar todos os agendamentos")
    public List<Agendamento> listar() {
        return service.listarTodos();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar agendamento por ID")
    public ResponseEntity<Agendamento> buscar(@PathVariable Long id) {
        return service.buscarPorId(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/periodo")
    @Operation(summary = "Agendamentos entre duas datas/horas (painel do dia/semana)")
    public List<Agendamento> porPeriodo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim) {
        return service.listarPorPeriodo(inicio, fim);
    }

    @GetMapping("/box/{box}")
    @Operation(summary = "Agendamentos de um box")
    public List<Agendamento> porBox(@PathVariable Integer box) {
        return service.listarPorBox(box);
    }

    @GetMapping("/veiculo/{veiculoId}")
    @Operation(summary = "Agendamentos de um veículo (histórico)")
    public List<Agendamento> porVeiculo(@PathVariable Long veiculoId) {
        return service.listarPorVeiculo(veiculoId);
    }

    @PostMapping
    @Operation(summary = "Criar agendamento (valida conflito de box)")
    public ResponseEntity<Agendamento> criar(@Valid @RequestBody AgendamentoDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar agendamento (valida conflito de box)")
    public ResponseEntity<Agendamento> atualizar(@PathVariable Long id, @Valid @RequestBody AgendamentoDTO dto) {
        return ResponseEntity.ok(service.atualizar(id, dto));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Alterar status (AGENDADO, EM_ANDAMENTO, CONCLUIDO, CANCELADO, NAO_COMPARECEU)")
    public ResponseEntity<Agendamento> alterarStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(service.atualizarStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir agendamento")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
