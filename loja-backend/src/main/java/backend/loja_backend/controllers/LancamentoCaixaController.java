package backend.loja_backend.controllers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import backend.loja_backend.entity.LancamentoCaixa;
import backend.loja_backend.repositories.LancamentoCaixaRepository;

@RestController
@RequestMapping("/api/lancamentos-caixa")
@CrossOrigin(origins = "http://localhost:5173") // Ajuste se a porta do seu front for diferente
public class LancamentoCaixaController {

    @Autowired
    private LancamentoCaixaRepository repository;

    // --- AQUI ESTAVA O ERRO: AGORA SÓ EXISTE UM MÉTODO GET ---
    @GetMapping
    public List<LancamentoCaixa> listarTodos(@RequestParam(required = false) String data) {
        if (data != null && !data.isEmpty()) {
            // Se o Front mandou uma data (ex: "2026-01-29"), filtramos do começo ao fim do dia
            try {
                LocalDate dia = LocalDate.parse(data);
                LocalDateTime inicio = dia.atStartOfDay(); // 00:00:00
                LocalDateTime fim = dia.atTime(23, 59, 59); // 23:59:59
                return repository.findByDataHoraBetween(inicio, fim);
            } catch (Exception e) {
                // Se a data vier quebrada, retorna tudo ou lista vazia (optei por tudo para não travar)
                return repository.findAll();
            }
        }
        
        // Se não mandou data, retorna o histórico completo
        // Ordenando por data (mais recente primeiro) fica melhor visualmente
        List<LancamentoCaixa> lista = repository.findAll();
        lista.sort((a, b) -> b.getDataHora().compareTo(a.getDataHora()));
        return lista;
    }

    // Lançar Manualmente (Ex: Pagar Luz, Sangria, Aporte)
    @PostMapping
    public LancamentoCaixa lancarManual(@RequestBody LancamentoCaixa lancamento) {
        if (lancamento.getDataHora() == null) {
            lancamento.setDataHora(LocalDateTime.now());
        }
        return repository.save(lancamento);
    }
}