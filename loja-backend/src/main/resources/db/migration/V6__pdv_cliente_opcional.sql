-- V6 — PDV: cliente passa a ser opcional na venda de balcão (venda rápida sem cadastro).

ALTER TABLE ordem_venda ALTER COLUMN cliente_id DROP NOT NULL;
