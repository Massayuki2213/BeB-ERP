package backend.loja_backend.financeiro;

import java.math.BigDecimal;

/** Dados de um repasse a parceiro terceirizado, passados pela OS ao financeiro (sem acoplar entidades). */
public record RepasseParceiro(String parceiro, BigDecimal valor) {
}
