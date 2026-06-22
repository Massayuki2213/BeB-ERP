package backend.loja_backend.common.exception;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EntidadeNaoEncontradaException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            EntidadeNaoEncontradaException e, HttpServletRequest req) {
        return build(HttpStatus.NOT_FOUND, "Not Found", e.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler(EstoqueInsuficienteException.class)
    public ResponseEntity<ErrorResponse> handleConflict(
            EstoqueInsuficienteException e, HttpServletRequest req) {
        return build(HttpStatus.CONFLICT, "Conflict", e.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler(RegraDeNegocioException.class)
    public ResponseEntity<ErrorResponse> handleUnprocessable(
            RegraDeNegocioException e, HttpServletRequest req) {
        return build(HttpStatus.UNPROCESSABLE_ENTITY, "Unprocessable Entity", e.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException e, HttpServletRequest req) {
        List<ErrorResponse.FieldError> fieldErrors = e.getBindingResult().getFieldErrors().stream()
                .map(f -> new ErrorResponse.FieldError(f.getField(), f.getDefaultMessage()))
                .toList();
        ErrorResponse body = new ErrorResponse(
                LocalDateTime.now(), 400, "Validation Failed",
                fieldErrors.size() + " campo(s) inválido(s)",
                req.getRequestURI(), fieldErrors);
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception e, HttpServletRequest req) {
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error",
                "Erro interno do servidor", req.getRequestURI());
    }

    private ResponseEntity<ErrorResponse> build(
            HttpStatus status, String error, String message, String path) {
        ErrorResponse body = new ErrorResponse(
                LocalDateTime.now(), status.value(), error, message, path, null);
        return ResponseEntity.status(status).body(body);
    }
}
