package backend.loja_backend;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Classe base para todos os testes de integração.
 *
 * Usa o banco DEDICADO loja_test no PostgreSQL do Docker Compose (localhost:5432).
 * Antes de cada teste limpa TODAS as tabelas em ordem topológica (FK-safe),
 * garantindo isolamento sem precisar de Testcontainers.
 */
@SpringBootTest
@AutoConfigureMockMvc
public abstract class AbstractIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @BeforeEach
    void limparBancoDeDados() {
        // Trava de segurança: estes testes apagam TODAS as tabelas.
        // Só permitimos rodar contra o banco de teste — nunca contra produção.
        if (datasourceUrl == null || !datasourceUrl.contains("loja_test")) {
            throw new IllegalStateException(
                    "Testes de integração só podem rodar contra o banco 'loja_test'. URL atual: "
                            + datasourceUrl);
        }

        // Ordem FK-safe: filhos antes dos pais
        jdbcTemplate.execute("DELETE FROM movimentacao_estoque");
        jdbcTemplate.execute("DELETE FROM lancamento_financeiro");
        jdbcTemplate.execute("DELETE FROM agendamento");
        jdbcTemplate.execute("DELETE FROM itens_vendas");
        jdbcTemplate.execute("DELETE FROM ordem_venda");
        jdbcTemplate.execute("DELETE FROM item_os");
        jdbcTemplate.execute("DELETE FROM servico_os");
        jdbcTemplate.execute("DELETE FROM ordem_servico");
        jdbcTemplate.execute("DELETE FROM veiculos");
        jdbcTemplate.execute("DELETE FROM produtos");
        jdbcTemplate.execute("DELETE FROM servicos");
        jdbcTemplate.execute("DELETE FROM clientes");
    }
}
