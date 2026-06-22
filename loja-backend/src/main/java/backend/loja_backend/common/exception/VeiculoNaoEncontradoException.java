package backend.loja_backend.common.exception;

public class VeiculoNaoEncontradoException extends EntidadeNaoEncontradaException {
    public VeiculoNaoEncontradoException(Long id) {
        super("Veículo não encontrado: " + id);
    }
}
