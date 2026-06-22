package backend.loja_backend.common.exception;

public class ServicoNaoEncontradoException extends EntidadeNaoEncontradaException {
    public ServicoNaoEncontradoException(Long id) {
        super("Serviço não encontrado: " + id);
    }
    public ServicoNaoEncontradoException(String msg) {
        super(msg);
    }
}
