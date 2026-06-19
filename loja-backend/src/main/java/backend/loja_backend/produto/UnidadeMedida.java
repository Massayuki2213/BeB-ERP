package backend.loja_backend.produto;

/**
 * Unidade de medida do produto. Permite estoque/venda fracionados (ex.: METRO para fio e insulfilm).
 */
public enum UnidadeMedida {
    UN,      // unidade avulsa
    PAR,     // par (ex.: lâmpadas, alto-falantes)
    METRO,   // por metro (fio, insulfilm)
    KIT,
    CAIXA,
    LITRO,
    KG
}
