# ROADMAP DE QUALIDADE — B&B Car Sound ERP

Plano de ação para elevar o sistema ao nível de **produção profissional**.
As três frentes abaixo são independentes e podem ser executadas em qualquer ordem,
mas a sequência sugerida é: **P1 → P2 → P3**.

> **Critério de "pronto":** cada ponto tem uma checklist ao final.
> Só marque como concluído quando todos os itens estiverem verdes.

---

## Por que esses três pontos?

O sistema já tem domínio correto, stack moderna e Docker funcionando.
O que o separa de um produto entregável a um cliente real é a **resiliência**:
o que acontece quando algo dá errado, quando o usuário digita dados inválidos
ou quando um desenvolvedor muda o `OrdemServicoService` sem perceber que quebrou o financeiro?
Esses três pontos respondem exatamente a isso.

---

## P1 — Tratamento de Erro Centralizado

### Por que precisa ser feito

**Situação atual:**
Cada controller tem um `try/catch` próprio que captura qualquer `RuntimeException`
e devolve uma `String` de texto livre:

```java
// OrdemServicoController.java — como está hoje
} catch (RuntimeException e) {
    return ResponseEntity.badRequest().body("Erro: " + e.getMessage());
}
```

**Problemas causados:**
1. **O frontend não consegue distinguir erros.** "Erro: Cliente não encontrado: 5"
   e "Erro: Estoque insuficiente para Fio 4mm" chegam com o mesmo `400` e o mesmo formato de texto.
   Não é possível mostrar mensagens diferentes ou redirecionar o usuário para a tela certa.
2. **Formato inconsistente.** Alguns endpoints retornam `String`, outros retornam objetos,
   outros deixam o Spring gerar HTML de erro — o `JSON.parse` no front quebra silenciosamente.
3. **Exceções não capturadas viram 500.** Qualquer `NullPointerException` esquecida devolve
   uma stack trace completa do servidor — expõe internals e fica ilegível para quem consome a API.
4. **Código duplicado.** O mesmo `try/catch` está em `OrdemServicoController`, `PdvController`,
   `FinanceiroController`... Qualquer mudança precisa ser replicada em N lugares.

**O que vai mudar com a solução:**
- Um único lugar cuida de todos os erros (`GlobalExceptionHandler`)
- Cada tipo de problema tem um código HTTP preciso: `404` para "não encontrado", `409` para "estoque insuficiente", `422` para dado inválido
- O frontend recebe sempre o mesmo JSON estruturado e pode agir de forma programática

---

### Passo a passo

#### Passo 1.1 — Criar o pacote `common/exception`

Criar o diretório `loja-backend/src/main/java/backend/loja_backend/common/exception/`.
Esse pacote vai conter todas as exceções de domínio do projeto.

#### Passo 1.2 — Criar as exceções de domínio

Criar uma classe base e as exceções específicas:

| Classe | HTTP alvo | Quando usar |
|---|---|---|
| `EntidadeNaoEncontradaException` (base) | `404` | Herança para as específicas |
| `ClienteNaoEncontradoException` | `404` | `clienteRepository.findById` falha |
| `ProdutoNaoEncontradoException` | `404` | `produtoRepository.findById` falha |
| `VeiculoNaoEncontradoException` | `404` | `veiculoRepository.findById` falha |
| `ServicoNaoEncontradoException` | `404` | `servicoRepository.findById` falha |
| `EstoqueInsuficienteException` | `409` | Quantidade em estoque < quantidade solicitada |
| `RegraDeNegocioException` | `422` | Violação de regra (OS já finalizada, status inválido etc.) |

Cada classe só precisa de um construtor que passa a mensagem para a superclasse — sem lógica.

#### Passo 1.3 — Criar o corpo de resposta padronizado `ErrorResponse`

No pacote `common/exception`, criar um record ou classe simples:

```
timestamp  — data/hora do erro (ISO 8601)
status     — código HTTP numérico (ex: 404)
error      — nome curto do erro (ex: "Not Found")
message    — mensagem legível para exibir ao usuário
path       — endpoint que gerou o erro (ex: "/api/ordens-servico/99")
```

#### Passo 1.4 — Criar o `GlobalExceptionHandler`

No pacote `common/exception`, criar uma classe anotada com `@RestControllerAdvice`.
Ela deve ter um `@ExceptionHandler` para cada tipo:

- `EntidadeNaoEncontradaException` → `HttpStatus.NOT_FOUND` (404)
- `EstoqueInsuficienteException` → `HttpStatus.CONFLICT` (409)
- `RegraDeNegocioException` → `HttpStatus.UNPROCESSABLE_ENTITY` (422)
- `Exception` (fallback genérico) → `HttpStatus.INTERNAL_SERVER_ERROR` (500), **sem expor stack trace**

Injetar `HttpServletRequest` para preencher o campo `path` do `ErrorResponse`.

#### Passo 1.5 — Substituir `RuntimeException` nos Services

Em **todos** os services (`OrdemServicoService`, `PdvService`, `EstoqueService`, `FinanceiroService`,
`ClienteService`, `ProdutoService`, `VeiculoService`, `AgendaService`),
trocar cada `throw new RuntimeException("...")` pela exceção de domínio correspondente.

Exemplo:
```java
// antes
.orElseThrow(() -> new RuntimeException("Cliente não encontrado: " + id));

// depois
.orElseThrow(() -> new ClienteNaoEncontradoException(id));
```

#### Passo 1.6 — Remover os `try/catch` dos Controllers

Com o `GlobalExceptionHandler` ativo, os controllers não precisam mais de `try/catch`.
Remover todos os blocos de captura dos controllers —
isso deixa o código mais limpo e o handler centralizado faz o trabalho.

#### Checklist P1
- [ ] Pacote `common/exception` criado com todas as classes de exceção
- [ ] `GlobalExceptionHandler` criado e anotado com `@RestControllerAdvice`
- [ ] `ErrorResponse` com os 5 campos (timestamp, status, error, message, path)
- [ ] Nenhum `RuntimeException` genérico nos services (todos trocados pelas exceções de domínio)
- [ ] Nenhum `try/catch` nos controllers
- [ ] Testado manualmente: buscar `/api/ordens-servico/9999` retorna JSON `{ "status": 404, ... }` e não HTML

---

## P2 — Validação de DTOs com Bean Validation

### Por que precisa ser feito

**Situação atual:**
Os DTOs não têm nenhuma anotação de validação. Veja `ProdutoDTO`:

```java
// ProdutoDTO.java — como está hoje
public class ProdutoDTO {
    private String nome;       // pode chegar null ou ""
    private Double precoCusto; // pode chegar -500 ou null
    private Double precoVenda; // pode chegar 0
    ...
}
```

**Problemas causados:**
1. **Dados inválidos são gravados no banco.**
   Um produto com `nome = null` ou `precoVenda = -10` passa pelo controller, pelo service
   e chega no PostgreSQL. O banco pode aceitar (se não houver constraint) ou lançar
   um erro de constraint — que sem o P1 vira um `500` com texto confuso.
2. **A interface pode exibir dados sem sentido.**
   Um produto com preço negativo ou sem nome aparece no PDV e na OS sem nenhum aviso.
3. **O comportamento do sistema fica imprevisível.**
   `OrdemServicoDTO` sem `clienteId` chega ao service, que tenta um `.findById(null)`
   e lança um erro que não é tratado corretamente.
4. **Custo de suporte aumenta.**
   Erros de dado inválido são difíceis de rastrear depois que entram no banco.
   Validar na entrada é ordens de magnitude mais barato.

**O que vai mudar com a solução:**
- Qualquer requisição com dado inválido é rejeitada **antes** de chegar no service
- O frontend recebe uma lista de erros por campo (`"nome: não pode estar em branco"`)
- Nenhum dado inválido toca o banco de dados

---

### Passo a passo

#### Passo 2.1 — Adicionar a dependência de validação no `pom.xml`

O Spring Boot inclui o Bean Validation via `spring-boot-starter-validation`.
Adicionar no `pom.xml` dentro de `<dependencies>`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

> **Atenção:** `spring-boot-starter-web` **não** inclui validação automaticamente
> desde o Spring Boot 2.3. A dependência precisa ser explícita.

#### Passo 2.2 — Anotar `ProdutoDTO`

Adicionar as anotações de validação em cada campo:

| Campo | Anotação | Motivo |
|---|---|---|
| `nome` | `@NotBlank` | Produto sem nome não pode existir |
| `precoVenda` | `@NotNull` + `@DecimalMin("0.0")` | Preço não pode ser nulo nem negativo |
| `precoCusto` | `@DecimalMin("0.0")` | Custo não pode ser negativo |
| `quantidadeEstoque` | `@DecimalMin("0.0")` | Estoque não pode ser negativo |
| `unidadeMedida` | `@NotNull` | Necessário para cálculo fracionado |

#### Passo 2.3 — Anotar `OrdemServicoDTO`

| Campo | Anotação | Motivo |
|---|---|---|
| `clienteId` | `@NotNull` | OS sem cliente é inválida |
| `veiculoId` | `@NotNull` | OS sem veículo é inválida |
| `itens[].produtoId` | `@NotNull` | Item sem produto referenciado |
| `itens[].quantidade` | `@DecimalMin("0.001")` | Deve ser positivo (suporta fracionado) |
| `itens[].precoUnitario` | `@DecimalMin("0.0")` | Preço não pode ser negativo |

#### Passo 2.4 — Anotar os demais DTOs

Percorrer todos os DTOs do projeto e aplicar o mesmo raciocínio:
- `ClienteDTO`: `@NotBlank` no `nome`
- `VeiculoDTO`: `@NotBlank` na `placa`, `@NotNull` no `clienteId`
- `ServicoDTO`: `@NotBlank` no `nome`, `@DecimalMin("0.0")` no `valorBase`
- `LancamentoFinanceiroDTO`: `@NotNull` em `tipo`, `valor`, `data`
- `AgendaDTO`: validar campos obrigatórios de data/hora

#### Passo 2.5 — Adicionar `@Valid` nos Controllers

Para o Spring ativar a validação, o parâmetro `@RequestBody` precisa de `@Valid`:

```java
// antes
public ResponseEntity<Produtos> criar(@RequestBody ProdutoDTO dto)

// depois
public ResponseEntity<Produtos> criar(@Valid @RequestBody ProdutoDTO dto)
```

Adicionar `@Valid` em **todos** os endpoints que recebem `@RequestBody` em todos os controllers.

#### Passo 2.6 — Adicionar handler para `MethodArgumentNotValidException` no `GlobalExceptionHandler`

Quando a validação falha, o Spring lança `MethodArgumentNotValidException`.
Adicionar um `@ExceptionHandler` para ela no handler criado no P1,
que extrai a lista de erros de campo e retorna `400` com um corpo como:

```json
{
  "status": 400,
  "error": "Validation Failed",
  "message": "1 campo(s) inválido(s)",
  "errors": [
    { "campo": "nome", "mensagem": "não deve estar em branco" },
    { "campo": "precoVenda", "mensagem": "deve ser maior ou igual a 0.0" }
  ],
  "path": "/api/produtos",
  "timestamp": "2026-06-22T14:30:00"
}
```

#### Checklist P2
- [ ] `spring-boot-starter-validation` no `pom.xml`
- [ ] Todos os DTOs anotados (sem campo obrigatório descoberto)
- [ ] `@Valid` em todos os `@RequestBody` de todos os controllers
- [ ] `GlobalExceptionHandler` tem handler para `MethodArgumentNotValidException` com lista de campos
- [ ] Testado manualmente: `POST /api/produtos` com body `{}` retorna `400` com lista de erros em JSON
- [ ] Testado manualmente: `POST /api/ordens-servico` sem `clienteId` retorna `400` (e não `500`)

---

## P3 — Testes de Integração

### Por que precisa ser feito

**Situação atual:**
O único teste que existe é este:

```java
// LojaBackendApplicationTests.java — como está hoje
@SpringBootTest
class LojaBackendApplicationTests {
    @Test
    void contextLoads() { }
}
```

Esse teste só verifica que o Spring consegue inicializar. Não testa nenhuma lógica.

**Problemas causados:**
1. **Nenhuma rede de segurança para refatorações.**
   O `OrdemServicoService.criar()` faz três operações encadeadas:
   salva a OS → baixa estoque (Kardex) → lança no Financeiro.
   Qualquer modificação nesse fluxo pode quebrar silenciosamente uma das etapas
   sem que ninguém perceba até o cliente reclamar.
2. **Impossível entregar com confiança.**
   Sem testes, cada deploy é um "torcer para funcionar". Com testes, é possível
   rodar `mvn test` e ter certeza que os fluxos críticos continuam corretos.
3. **Bugs de regressão são difíceis de localizar.**
   Quando um bug aparece em produção sem testes, é preciso reproduzir manualmente,
   demorado e caro. Com testes, o bug é detectado antes do deploy.
4. **A integração entre módulos não é verificada.**
   Fechar uma OS deve lançar automaticamente no Financeiro. Sem teste de integração,
   não há garantia de que essa "costura" entre módulos está funcionando.

**O que vai mudar com a solução:**
- Rodar `mvn test` valida os fluxos críticos do sistema em segundos
- Qualquer mudança que quebre o comportamento esperado é detectada antes do merge
- O código pode ser refatorado com segurança

---

### Passo a passo

#### Passo 3.1 — Escolher a estratégia de banco para testes

Dois caminhos possíveis:

| Opção | Vantagem | Desvantagem |
|---|---|---|
| **H2 in-memory** | Rápido, zero dependência externa | Dialeto diferente do PostgreSQL; pode não capturar bugs de SQL |
| **Testcontainers** | PostgreSQL real, mesmo dialeto | Precisa do Docker rodando para os testes |

**Recomendação:** usar **Testcontainers** com a anotação `@ServiceConnection`
(disponível a partir do Spring Boot 3.1). É a abordagem profissional que garante
que os testes rodam no mesmo banco do ambiente de produção.

#### Passo 3.2 — Adicionar dependências de teste no `pom.xml`

Adicionar dentro de `<dependencies>` (escopo `test`):

```xml
<!-- Testcontainers integrado com Spring Boot -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-testcontainers</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>
```

> O BOM do Testcontainers já está gerenciado pelo `spring-boot-starter-parent` — não precisa de versão explícita.

#### Passo 3.3 — Criar a classe base de teste

Criar `AbstractIntegrationTest.java` no pacote de testes.
Ela configura o Testcontainers uma vez para toda a suite de testes (via `@Container` estático),
evitando que um container PostgreSQL seja criado para cada classe de teste.

Anotações necessárias: `@SpringBootTest`, `@AutoConfigureMockMvc`, `@Testcontainers`.
O container PostgreSQL deve ser declarado com `@Container` e `@ServiceConnection`.

#### Passo 3.4 — Escrever testes para `OrdemServicoService` (fluxo crítico)

Criar `OrdemServicoServiceTest.java` herdando de `AbstractIntegrationTest`.

Cenários obrigatórios:

| Teste | O que verifica |
|---|---|
| `criarOS_deveRetornarOsComStatusAberta` | OS é salva corretamente com cliente e veículo |
| `finalizarOS_deveReduzirEstoqueDosProdutos` | Ao finalizar, `quantidadeEstoque` do produto é reduzida |
| `finalizarOS_deveCriarLancamentoNoFinanceiro` | Ao finalizar, um `LancamentoFinanceiro` de RECEITA é criado |
| `finalizarOS_comEstoqueInsuficiente_deveLancarExcecao` | Tenta finalizar OS com produto sem estoque → `EstoqueInsuficienteException` |
| `cancelarOS_naoDeveAlterarEstoque` | Cancelar OS não gera movimentação de estoque |

#### Passo 3.5 — Escrever testes para o PDV

Criar `PdvServiceTest.java` herdando de `AbstractIntegrationTest`.

Cenários obrigatórios:

| Teste | O que verifica |
|---|---|
| `realizarVenda_deveReduzirEstoque` | Estoque do produto decresce após venda |
| `realizarVenda_comEstoqueInsuficiente_deveLancarExcecao` | `EstoqueInsuficienteException` se quantidade < pedido |
| `realizarVenda_deveCriarRegistroNoKardex` | Movimentação de saída é registrada no Kardex |

#### Passo 3.6 — Escrever testes de Controller com MockMvc

Criar `OrdemServicoControllerTest.java` e `ProdutoControllerTest.java` herdando de `AbstractIntegrationTest`.

Esses testes validam a camada HTTP — status codes, formato das respostas e comportamento do `GlobalExceptionHandler`:

| Teste | O que verifica |
|---|---|
| `GET /api/ordens-servico/9999` → `404` com JSON de erro | Handler de `EntidadeNaoEncontradaException` |
| `POST /api/produtos` com body `{}` → `400` com lista de campos | Handler de `MethodArgumentNotValidException` |
| `POST /api/ordens-servico` sem clienteId → `400` | Validação do DTO |
| `PATCH /api/ordens-servico/{id}/status` com status inválido → `422` | `RegraDeNegocioException` |

#### Passo 3.7 — Configurar profile de teste no `application.properties`

Criar `src/test/resources/application.properties` (ou `application-test.properties`)
com configurações de teste:
- `spring.flyway.enabled=true` — rodar as migrations no container de teste (garante schema atualizado)
- `spring.jpa.show-sql=true` — útil para depurar SQL durante o desenvolvimento dos testes
- Não definir URL de banco — o Testcontainers com `@ServiceConnection` injeta automaticamente

#### Checklist P3
- [ ] Dependências do Testcontainers adicionadas no `pom.xml`
- [ ] `AbstractIntegrationTest` criada com container PostgreSQL compartilhado
- [ ] `OrdemServicoServiceTest` com os 5 cenários listados no Passo 3.4
- [ ] `PdvServiceTest` com os 3 cenários listados no Passo 3.5
- [ ] `OrdemServicoControllerTest` e `ProdutoControllerTest` com os 4 cenários do Passo 3.6
- [ ] `mvn test` passa com 100% dos testes verdes
- [ ] Nenhum teste usa dados fixos do banco de produção (cada teste cria seus próprios dados)

---

## Sequência sugerida de execução

```
P1 (Exceções)  →  P2 (Validação)  →  P3 (Testes)
```

**Por que essa ordem:**
- P1 cria o `GlobalExceptionHandler` que P2 vai precisar para capturar `MethodArgumentNotValidException`
- P3 escrito depois de P1 e P2 pode testar o comportamento correto dos erros 400/404/409
- Escrever os testes por último garante que eles cobrem o sistema já com a validação e o error handling no lugar

---

## Resumo das tarefas por arquivo a criar/modificar

### P1 — Novos arquivos
| Arquivo | Ação |
|---|---|
| `common/exception/EntidadeNaoEncontradaException.java` | Criar |
| `common/exception/ClienteNaoEncontradoException.java` | Criar |
| `common/exception/ProdutoNaoEncontradoException.java` | Criar |
| `common/exception/VeiculoNaoEncontradoException.java` | Criar |
| `common/exception/ServicoNaoEncontradoException.java` | Criar |
| `common/exception/EstoqueInsuficienteException.java` | Criar |
| `common/exception/RegraDeNegocioException.java` | Criar |
| `common/exception/ErrorResponse.java` | Criar |
| `common/exception/GlobalExceptionHandler.java` | Criar |

### P1 — Arquivos a modificar
Todos os `*Service.java` que usam `RuntimeException` genérico.
Todos os `*Controller.java` que têm `try/catch`.

### P2 — Arquivos a modificar
`pom.xml` + todos os `*DTO.java` do projeto + todos os `*Controller.java` com `@RequestBody`.

### P3 — Novos arquivos
`AbstractIntegrationTest.java`, `OrdemServicoServiceTest.java`,
`PdvServiceTest.java`, `OrdemServicoControllerTest.java`, `ProdutoControllerTest.java`.

### P3 — Arquivos a modificar
`pom.xml` (dependências) + criar `src/test/resources/application.properties`.
