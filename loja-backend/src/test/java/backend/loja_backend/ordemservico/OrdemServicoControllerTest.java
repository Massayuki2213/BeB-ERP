package backend.loja_backend.ordemservico;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import backend.loja_backend.AbstractIntegrationTest;
import backend.loja_backend.cliente.ClienteRepository;
import backend.loja_backend.estoque.MovimentacaoEstoqueRepository;
import backend.loja_backend.financeiro.LancamentoFinanceiroRepository;
import backend.loja_backend.produto.ProdutoRepository;
import backend.loja_backend.servico.ServicoRepository;
import backend.loja_backend.veiculo.VeiculoRepository;

class OrdemServicoControllerTest extends AbstractIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired OrdemServicoRepository osRepo;
    @Autowired ClienteRepository clienteRepo;
    @Autowired VeiculoRepository veiculoRepo;
    @Autowired ProdutoRepository produtoRepo;
    @Autowired ServicoRepository servicoRepo;
    @Autowired LancamentoFinanceiroRepository financeiroRepo;
    @Autowired MovimentacaoEstoqueRepository movRepo;

    @BeforeEach
    void setUp() {
    }

    // ------------------------------------------------------------------ testes

    @Test
    void GET_osInexistente_deveRetornar404ComJsonDeErro() throws Exception {
        mockMvc.perform(get("/api/ordens-servico/9999"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void POST_osSemClienteId_deveRetornar400ComListaDeCampos() throws Exception {
        // clienteId e veiculoId são obrigatórios
        String body = """
                {
                  "descricao": "instalação"
                }
                """;

        mockMvc.perform(post("/api/ordens-servico")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors").isArray())
                .andExpect(jsonPath("$.errors[?(@.campo == 'clienteId')]").exists());
    }

    @Test
    void PATCH_osStatusInvalido_deveRetornar422() throws Exception {
        // Primeiro cria um cliente e veiculo para ter uma OS válida
        String clienteJson = """
                {"nome":"Teste"}
                """;
        String clienteResp = mockMvc.perform(post("/api/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(clienteJson))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        // Extrai id via string simples (sem biblioteca extra)
        Long clienteId = Long.parseLong(clienteResp.replaceAll(".*\"id\":(\\d+).*", "$1"));

        String veiculoJson = String.format("""
                {"clienteId":%d,"placa":"TST-9001"}
                """, clienteId);
        String veiculoResp = mockMvc.perform(post("/api/veiculos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(veiculoJson))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long veiculoId = Long.parseLong(veiculoResp.replaceAll(".*\"id\":(\\d+).*", "$1"));

        String osJson = String.format("""
                {"clienteId":%d,"veiculoId":%d}
                """, clienteId, veiculoId);
        String osResp = mockMvc.perform(post("/api/ordens-servico")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(osJson))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long osId = Long.parseLong(osResp.replaceAll(".*\"id\":(\\d+).*", "$1"));

        // Tenta alterar para um status que não existe
        mockMvc.perform(patch("/api/ordens-servico/{id}/status", osId)
                        .param("status", "INVALIDO_XPTO"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.status").value(422));
    }
}
