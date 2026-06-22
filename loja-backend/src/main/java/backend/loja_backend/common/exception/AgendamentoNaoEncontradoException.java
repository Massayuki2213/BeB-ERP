package backend.loja_backend.common.exception;

public class AgendamentoNaoEncontradoException extends EntidadeNaoEncontradaException {
    public AgendamentoNaoEncontradoException(Long id) {
        super("Agendamento não encontrado: " + id);
    }
}
