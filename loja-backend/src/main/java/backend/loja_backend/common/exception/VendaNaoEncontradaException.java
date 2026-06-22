package backend.loja_backend.common.exception;

public class VendaNaoEncontradaException extends EntidadeNaoEncontradaException {
    public VendaNaoEncontradaException(Long id) {
        super("Venda não encontrada: " + id);
    }
}
