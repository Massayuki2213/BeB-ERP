package backend.loja_backend.common.exception;

public class ProdutoNaoEncontradoException extends EntidadeNaoEncontradaException {
    public ProdutoNaoEncontradoException(Long id) {
        super("Produto não encontrado: " + id);
    }
    public ProdutoNaoEncontradoException(String msg) {
        super(msg);
    }
}
