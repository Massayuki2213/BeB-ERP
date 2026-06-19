-- V9 — Busca escalável de produtos.
-- Índice trigram (pg_trgm) para acelerar buscas "LIKE '%termo%'" por nome em bases grandes.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_produtos_nome_trgm ON produtos USING gin (LOWER(nome) gin_trgm_ops);
