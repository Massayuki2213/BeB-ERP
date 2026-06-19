-- V5 — Flag de controle da baixa de estoque da OS.
-- Evita baixar/estornar peças em duplicidade ao alternar o status da Ordem de Serviço.

ALTER TABLE ordem_servico
    ADD COLUMN estoque_baixado BOOLEAN NOT NULL DEFAULT false;
