-- Cria o banco dedicado aos testes de integração.
-- Executado automaticamente pelo postgres APENAS na primeira inicialização
-- do volume (docker-entrypoint-initdb.d). Mantém os testes isolados do banco
-- de produção "loja" — os testes apagam todas as tabelas no @BeforeEach.
CREATE DATABASE loja_test;
