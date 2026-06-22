package backend.loja_backend.common.exception;

import java.time.LocalDateTime;
import java.util.List;

public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        String path,
        List<FieldError> errors) {

    /** Usado apenas na resposta de validação de campos. */
    public record FieldError(String campo, String mensagem) {}
}
