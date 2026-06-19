<div align="center">

# 🔊 B&B Car Sound — ERP

**Sistema de gestão completo para loja de som e acessórios automotivos**

![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)

</div>

---

## 📋 Sobre o Projeto

O **B&B Car Sound ERP** é um sistema de gestão desenvolvido sob medida para lojas de som e acessórios automotivos. Cobre todo o ciclo operacional: do **PDV** à **Ordem de Serviço**, do controle de **estoque fracionado** ao **financeiro** e **agenda de box**.

> 📌 Histórico completo de tarefas e progresso em [ROADMAP.md](ROADMAP.md).

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Backend** | Spring Boot 3.5 · Java 21 · Spring Data JPA · Flyway |
| **Frontend** | React 19 · Vite · TypeScript · Nginx |
| **Banco de Dados** | PostgreSQL 16 |
| **Infra** | Docker · Docker Compose |
| **API Docs** | SpringDoc OpenAPI (Swagger UI) |

---

## ✅ Funcionalidades

| Módulo | Descrição |
|---|---|
| 🏠 **Dashboard** | Resumo financeiro: vendas, formas de pagamento e fluxo de caixa |
| 📦 **Produtos** | Cadastro com estoque fracionado (UN, METRO) e controle por Kardex |
| 👤 **Clientes** | Cadastro completo com histórico de atendimentos e veículos |
| 🚗 **Veículos** | Registro de veículos vinculados a clientes (placa, modelo, ano, cor) |
| 🔧 **Ordem de Serviço** | Abertura de OS com peças, mão de obra e repasse a parceiros terceirizados |
| 🛒 **PDV** | Venda rápida de balcão com baixa automática de estoque |
| 💰 **Financeiro** | Contas a pagar/receber, livro caixa e separação de lucro de peça vs. serviço |
| 📅 **Agenda** | Controle de box por horário, vinculado a OS/cliente/veículo |
| 🔩 **Serviços** | Cadastro de serviços oferecidos pela loja |
| 📄 **Notas / Histórico** | Histórico de vendas e ordens de serviço |

---

## 🚀 Como Rodar

### Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando

### 1. Clone o repositório

```bash
git clone https://github.com/Massayuki2213/BeB-ERP.git
cd BeB-ERP
```

### 2. Configure o ambiente

```bash
# Crie o .env a partir do modelo e ajuste as credenciais
cp .env.example .env
```

### 3. Suba a stack

```bash
docker compose up --build
```

### Serviços disponíveis

| Serviço | URL |
|---|---|
| 🌐 **Frontend** | http://localhost:5173 |
| ⚙️ **Backend API** | http://localhost:8080 |
| 📖 **Swagger UI** | http://localhost:8080/swagger-ui.html |
| 🗄️ **Adminer** (DB Admin) | http://localhost:8081 |

> **Adminer:** Sistema `PostgreSQL` · Servidor `db` · Usuário/Senha/Base = os valores do seu `.env`

---

## 🗄️ Banco de Dados (Flyway Migrations)

O schema é versionado com **Flyway** — o Hibernate roda em modo `validate` (não altera o banco automaticamente). Toda mudança de schema é registrada como uma migration.

```
loja-backend/src/main/resources/db/migration/
├── V1__baseline_schema.sql          # Schema inicial
├── V2__add_tabela_veiculos.sql      # Módulo de veículos
├── V3__estoque_fracionado_e_kardex.sql  # Estoque decimal + rastreabilidade
├── V4__ordem_servico.sql            # Ordem de Serviço
├── V5__os_estoque_baixado.sql       # Baixa de estoque na OS
├── V6__pdv_cliente_opcional.sql     # PDV sem cliente obrigatório
├── V7__financeiro.sql               # Módulo financeiro
├── V8__agenda.sql                   # Agenda de box
└── V9__produtos_busca_indice.sql    # Índices de busca
```

### Comandos úteis

```bash
docker compose down          # Parar todos os serviços
docker compose down -v       # Parar e apagar volume do banco (reset total)
docker compose up --build    # Reconstruir após mudanças no código
docker compose up -d         # Subir em background (sem logs)
```

---

## 📁 Estrutura do Projeto

```
BeB-ERP/
├── docker-compose.yml          # Orquestração dos serviços
├── .env.example                # Modelo de variáveis de ambiente
│
├── erp-frontend/               # React 19 + Vite + TypeScript
│   ├── src/
│   │   ├── pages/              # Dashboard, PDV, OS, Financeiro, Agenda...
│   │   ├── components/         # Sidebar, Modais, etc.
│   │   ├── services/api.ts     # Client HTTP (Axios)
│   │   └── types/index.ts      # Tipos TypeScript
│   ├── nginx.conf              # Configuração Nginx (produção)
│   └── Dockerfile
│
└── loja-backend/               # Spring Boot 3.5 + Java 21
    └── src/main/java/.../
        ├── agenda/             # Módulo Agenda
        ├── cliente/            # Módulo Clientes
        ├── dashboard/          # Módulo Dashboard
        ├── estoque/            # Kardex e movimentação
        ├── financeiro/         # Contas e fluxo de caixa
        ├── ordemservico/       # Ordem de Serviço (core)
        ├── pdv/                # Ponto de Venda
        ├── produto/            # Cadastro e estoque
        ├── servico/            # Serviços oferecidos
        └── veiculo/            # Veículos dos clientes
```

---

## 🔄 Roadmap

| # | Tarefa | Status |
|---|---|---|
| 1 | Dockerização + `.env` | ✅ Concluído |
| 2 | Migrations (Flyway) + reorganização de pacotes | ✅ Concluído |
| 3 | Veículos + Histórico | ✅ Concluído |
| 4 | Estoque fracionado + Kardex | ✅ Concluído |
| 5 | Ordem de Serviço ⭐ | ✅ Concluído |
| 6 | Baixa automática de estoque (OS + PDV) | ✅ Concluído |
| 7 | Refino do PDV | ✅ Concluído |
| 8 | Financeiro (Livro Caixa + Fluxo) | ✅ Concluído |
| 9 | Agenda / Controle de Box | ✅ Concluído |
| 10 | Frontend das novas telas | ✅ Concluído |
| 11 | Dashboard / Relatórios reformulados | ✅ Concluído |
| 12 | Testes automatizados (opcional) | ⏳ Pendente |

---

<div align="center">
  <sub>Desenvolvido para B&B Car Sound 🚗🔊</sub>
</div>

> A estrutura de pacotes do backend é **por feature/domínio**
> (`cliente/`, `produto/`, `servico/`, `pdv/`, `dashboard/`) — cada módulo com seu
> controller/service/repository/entity/dto. Novos domínios (OS, veículo, estoque, financeiro,
> agenda) entram como novas pastas.

## Variáveis de ambiente

Todas ficam no `.env` (não versionado). Veja [.env.example](.env.example) para o modelo.
Pontos de atenção:
- `POSTGRES_PASSWORD` e `SPRING_DATASOURCE_PASSWORD` **devem ser iguais**.
- Dentro da rede do Docker o backend acessa o banco pelo host `db` (nome do serviço), não `localhost`.
- `VITE_API_BASE_URL` é "assada" no bundle do frontend em tempo de build — ao mudar, refaça o build (`docker compose up --build`).
