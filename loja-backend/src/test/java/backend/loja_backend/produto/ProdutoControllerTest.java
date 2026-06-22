package backend.loja_backend.produto;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import backend.loja_backend.AbstractIntegrationTest;
import backend.loja_backend.estoque.MovimentacaoEstoqueRepository;

class ProdutoControllerTest extends AbstractIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ProdutoRepository produtoRepo;
    @Autowired MovimentacaoEstoqueRepository movRepo;

    @BeforeEach
    void setUp() {
    }

    // ------------------------------------------------------------------ testes

    @Test
    void POST_produtoComBodyVazio_deveRetornar400ComListaDeCampos() throws Exception {
        mockMvc.perform(post("/api/produtos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors").isArray())
                // nome e precoVenda são obrigatórios
                .andExpect(jsonPath("$.errors[?(@.campo == 'nome')]").exists())
                .andExpect(jsonPath("$.errors[?(@.campo == 'precoVenda')]").exists())
                .andExpect(jsonPath("$.errors[?(@.campo == 'unidadeMedida')]").exists());
    }

    @Test
    void POST_produtoValido_deveRetornar201() throws Exception {
        String body = """
                {
                  "nome": "Tweeter",
                  "precoVenda": 120.0,
                  "precoCusto": 60.0,
                  "quantidadeEstoque": 10,
                  "unidadeMedida": "UN"
                }
                """;

        mockMvc.perform(post("/api/produtos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.nome").value("Tweeter"));
    }
}
