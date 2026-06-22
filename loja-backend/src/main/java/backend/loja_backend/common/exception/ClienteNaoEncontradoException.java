package backend.loja_backend.common.exception;

public class ClienteNaoEncontradoException extends EntidadeNaoEncontradaException {
    public ClienteNaoEncontradoException(Long id) {
        super("Cliente não encontrado: " + id);
    }
    public ClienteNaoEncontradoException(String msg) {
        super(msg);
    }
}
