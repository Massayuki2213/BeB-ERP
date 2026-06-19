package backend.loja_backend.common;

import java.util.List;

/**
 * Resposta paginada genérica e estável (evita serializar PageImpl direto).
 * Padrão para todas as listagens grandes do sistema.
 */
public record PageResponse<T>(
        List<T> content,
        long totalElements,
        int totalPages,
        int page,
        int size) {
}
