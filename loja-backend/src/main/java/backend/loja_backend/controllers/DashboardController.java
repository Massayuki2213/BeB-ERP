package backend.loja_backend.controllers;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import backend.loja_backend.repositories.DashboardRepository;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardRepository repo;

    public DashboardController(DashboardRepository repo) {
        this.repo = repo;
    }

    /**
     * GET /api/dashboard/totais?start=2025-11-01T00:00:00&end=2025-11-30T23:59:59
     *
     * start and end should be ISO_LOCAL_DATE_TIME (yyyy-MM-dd'T'HH:mm:ss)
     */
    @GetMapping("/totais")
    public ResponseEntity<Map<String, BigDecimal>> totais(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam("end")   @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        List<DashboardRepository.FormaTotalProjection> rows = repo.sumByFormaBetween(start, end);

        BigDecimal totalDinheiro = BigDecimal.ZERO;
        BigDecimal totalPix = BigDecimal.ZERO;
        Map<String, BigDecimal> map = new HashMap<>();

        for (var r : rows) {
            String forma = r.getForma() != null ? r.getForma().toUpperCase() : "UNKNOWN";
            BigDecimal total = r.getTotal() != null ? r.getTotal() : BigDecimal.ZERO;
            map.put(forma, total);

            if ("DINHEIRO".equals(forma)) totalDinheiro = totalDinheiro.add(total);
            if ("PIX".equals(forma)) totalPix = totalPix.add(total);
        }

        // garantir chaves mesmo se não houver resultados
        map.put("DINHEIRO", map.getOrDefault("DINHEIRO", BigDecimal.ZERO));
        map.put("PIX", map.getOrDefault("PIX", BigDecimal.ZERO));
        map.put("TOTAL_DINHEIRO_PIX", map.get("DINHEIRO").add(map.get("PIX")));

        return ResponseEntity.ok(map);
    }
}
