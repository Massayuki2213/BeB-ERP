# ROADMAP — Refatoração B&B Car Sound ERP

Plano de ação para a refatoração completa do sistema, orquestrado via Docker.
As tasks têm **numeração fixa** — para executar, basta pedir: *"faça a task N"*.

> **Fora de escopo (decisão do projeto):**
> - ❌ Autenticação / login / perfis de usuário
> - ❌ Banco em cache (Redis ou similar)

---

## Diagnóstico do estado atual

**Backend** — Spring Boot 3.5.6 / Java 21 / PostgreSQL:
- Entidades: `Clientes`, `Produtos`, `Servicos`, `OrdemVenda` (PDV), `ItensVendas`.
- PDV funcional com baixa de estoque na venda (`OrdemVendaService`).
- Dashboard que soma vendas por forma de pagamento.

**Frontend** — React 19 / Vite / TypeScript:
- Páginas: Dashboard, Produtos, Clientes, Serviços, PDV, Notas.

### Lacunas vs. visão alvo
| Falta | Situação atual |
|---|---|
| 🐳 Docker | Nada conteinerizado; senha do banco fixa no `application.properties` |
| 🔧 **Ordem de Serviço** | **Não existe.** Só há `OrdemVenda` (venda de balcão, não OS). Sem veículo, mão de obra ou repasse de parceiro |
| 🚗 Veículo/histórico | `Clientes` não tem relação com veículo |
| 📏 Estoque fracionado | `quantidadeEstoque` é `Integer` — não vende por metro (fio/insulfilm) |
| 💰 Financeiro | Só um somatório no dashboard. Sem contas a pagar/receber, sem livro caixa |
| 📅 Agenda/Box | Não existe |
| 🧱 Arquitetura | Pacotes inconsistentes (`entity/PDV/entity/...`), sem migrations (`ddl-auto=update`) |

---

## FASE 0 — Infra & Fundação

### Task 1 — Dockerização completa + externalizar config
`docker-compose` com Postgres + backend + frontend + Adminer; Dockerfiles multi-stage;
arquivo `.env` (remove a senha fixa do código); CORS e `baseURL` do front por variável de ambiente.
**Depende de:** —

### Task 2 — Migrations (Flyway) + reorganização da arquitetura
Baseline do schema atual em migrations versionadas (substitui `ddl-auto=update`);
reorganiza os pacotes para um padrão de camadas coerente e consolida o módulo PDV.
**Depende de:** 1

---

## FASE 1 — Domínio Core

### Task 3 — Veículos + Histórico
Entidade `Veiculo` (placa, modelo, marca, ano, cor) com relação Cliente 1:N Veículo.
Base para garantia e upgrade futuro.
**Depende de:** 2

### Task 4 — Estoque fracionado + Kardex
`Produto` ganha `unidadeMedida` (UN, METRO…) e quantidade vira decimal;
tabela de movimentação de estoque (entradas/saídas rastreáveis).
**Depende de:** 2

### Task 5 — Ordem de Serviço (o coração) ⭐
`OrdemDeServico` + `ItensOS` (peças consumidas) + `ServicosOS` (mão de obra),
vinculando cliente + veículo, com **campo de repasse a parceiro terceirizado** por item/serviço
e workflow de status (aberta → em andamento → finalizada).
**Depende de:** 3, 4

---

## FASE 2 — Operação & Dinheiro

### Task 6 — Baixa automática de estoque integrada (OS + PDV)
Fechou OS/venda, dá baixa automática usando o Kardex; respeita medida fracionada.
> Obs.: a baixa do **PDV via Kardex já foi feita na Task 4**. Restou aqui a baixa ao
> fechar a **Ordem de Serviço** (peças consumidas) + unificação/validações.
**Depende de:** 4, 5

### Task 7 — Refino do PDV (venda rápida de balcão)
Garante venda rápida sem exigir OS, integrada a estoque e pronta para alimentar o financeiro.
**Depende de:** 6

### Task 8 — Financeiro (Livro Caixa + Fluxo)
Contas a pagar/receber e fluxo de caixa diário; entradas de PDV e fechamento de OS caem automático,
**separando lucro de peça vs. lucro de serviço**; repasse de parceiro entra como saída.
**Depende de:** 5, 7

### Task 9 — Agenda / Controle de Box
Painel de horários por box, com vínculo opcional a OS/cliente/veículo para não encavalar carros.
**Depende de:** 3

---

## FASE 3 — Frontend & Acabamento

### Task 10 — Frontend das novas telas
Telas de OS, Veículos/Histórico, Financeiro e Agenda; API client por env e tipos atualizados.
**Depende de:** 5, 8, 9

### Task 11 — Dashboard/Relatórios reformulados
Fluxo de caixa diário, peça vs. serviço, gatilhos de garantia/upgrade.
**Depende de:** 8

### Task 12 — (Opcional) Testes automatizados
Cobertura de testes para o domínio core (OS, estoque, financeiro).
**Depende de:** 2

---

## Caminho crítico

```
1 → 2 → (3 e 4 em paralelo) → 5 → 6 → 7 → 8
```
Tasks **9**, **11** e **12** são paralelizáveis após a base estar pronta.

## Progresso
- [x] Task 1 — Dockerização + .env ✅
- [x] Task 2 — Migrations + reorganização ✅
- [x] Task 3 — Veículos + Histórico ✅
- [x] Task 4 — Estoque fracionado + Kardex ✅ (inclui baixa do PDV via Kardex — adiantado da Task 6)
- [x] Task 5 — Ordem de Serviço ✅
- [x] Task 6 — Baixa automática de estoque ✅
- [x] Task 7 — Refino do PDV ✅
- [x] Task 8 — Financeiro ✅
- [x] Task 9 — Agenda / Box ✅
- [x] Task 10 — Frontend das novas telas ✅
- [x] Task 11 — Dashboard/Relatórios ✅
- [ ] Task 12 — Testes automatizados (opcional)
