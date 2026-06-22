package backend.loja_backend.common.exception;

public class OrdemServicoNaoEncontradaException extends EntidadeNaoEncontradaException {
    public OrdemServicoNaoEncontradaException(Long id) {
        super("Ordem de serviço não encontrada: " + id);
    }
}
