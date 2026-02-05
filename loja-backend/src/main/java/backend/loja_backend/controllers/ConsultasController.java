package backend.loja_backend.controllers;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/consultas")
@CrossOrigin(origins = "http://localhost:5173")
public class ConsultasController {

    @GetMapping("/ean/{codigo}")
    public ResponseEntity<?> consultarEan(@PathVariable String codigo) {
        String token = "aAtECnwRpJhVwcMMStYJ7g"; // Seu token Bluesoft
        String url = "https://api.cosmos.bluesoft.com.br/gtins/" + codigo;

        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Cosmos-Token", token);
            headers.set("User-Agent", "Cosmos-API-Request");

            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            // O Java faz a requisição (O Java não sofre com CORS)
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            
            return ResponseEntity.ok(response.getBody());

        } catch (Exception e) {
            // Se der erro (404 não encontrado ou 429 limite), retorna 404 para o front
            return ResponseEntity.notFound().build();
        }
    }
}