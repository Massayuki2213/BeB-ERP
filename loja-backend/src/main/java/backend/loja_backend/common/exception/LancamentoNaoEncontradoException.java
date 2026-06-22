package backend.loja_backend.common.exception;

public class LancamentoNaoEncontradoException extends EntidadeNaoEncontradaException {
    public LancamentoNaoEncontradoException(Long id) {
        super("Lançamento não encontrado: " + id);
    }
}
