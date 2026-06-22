# Guia de Deploy — B&B Car Sound ERP (produção)

Coloca o sistema no ar em um VPS, acessível por uma URL com **HTTPS gratuito** e
protegido por **login (usuário + senha)**. Banco e backend ficam escondidos da internet.

```
Internet ──https──▶ Caddy (HTTPS + senha) ──▶ frontend (nginx) ──▶ backend ──▶ Postgres
                     (única coisa exposta)        site + /api                  (com backup)
```

Custo aproximado: **VPS ~R$25/mês + domínio ~R$40/ano**.

---

## ✅ O que VOCÊ precisa fazer (o resto já está pronto no repo)

1. **Comprar o domínio na Hostinger.**
   - O nome não pode ter espaço nem `&`. Sugestão: `bbcarsound.com.br` (ou `.com`).
   - "B&B Car Sound" é o nome da loja; o domínio é a versão "sem espaços".

2. **Contratar um VPS** (~R$25/mês), Ubuntu 24.04. Hostinger tem VPS; serve bem.

3. **Apontar o domínio para o VPS:** no painel de DNS da Hostinger, criar um
   registro **A** com o nome `@` (ou o subdomínio que quiser) apontando para o
   **IP do VPS**.

4. **No VPS, seguir a seção "Passo a passo no servidor"** abaixo (copiar/colar comandos).
   O único conteúdo que você digita é: a senha do banco e a senha de login do Lucas.

É isso. Não precisa configurar certificado (o Caddy faz sozinho), nem mexer em código.

---

## Passo a passo no servidor

### 1. Instalar Docker (uma vez)
```bash
curl -fsSL https://get.docker.com | sh
```

### 2. Liberar só as portas necessárias
```bash
ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw enable
```

### 3. Baixar o projeto
```bash
git clone <URL_DO_SEU_REPO> bb-erp
cd bb-erp
```

### 4. Criar o arquivo de segredos
```bash
cp .env.prod.example .env.prod
nano .env.prod
```
Preencha:
- `POSTGRES_PASSWORD` → uma senha forte para o banco.
- `SITE_ADDRESS` → seu domínio (ex.: `bbcarsound.com.br`, sem `https://`).
- `CORS_ALLOWED_ORIGINS` → `https://` + seu domínio.
- `BASIC_AUTH_USER` → já vem `lucas`.
- `BASIC_AUTH_HASH` → gere o hash da senha do Lucas:
  ```bash
  docker run --rm caddy caddy hash-password --plaintext 'a-senha-do-lucas'
  ```
  Cole o resultado (começa com `$2a$...`). **Se o compose reclamar do `$`, duplique cada `$` → `$$`.**

### 5. Subir tudo
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```
O Caddy busca o certificado HTTPS sozinho no primeiro acesso (pode levar ~1 min).
Acesse `https://SEU_DOMINIO` → vai pedir usuário e senha → entra. ✅

### 6. Backup automático diário (importante!)
```bash
mkdir -p ~/backups
chmod +x scripts/backup.sh
crontab -e
# adicione a linha (ajuste o caminho absoluto do projeto):
0 3 * * * /root/bb-erp/scripts/backup.sh >> /root/backups/backup.log 2>&1
```
Teste agora mesmo e confira que gerou o arquivo:
```bash
./scripts/backup.sh && ls -lh ~/backups
```

---

## Tarefas do dia a dia

**Atualizar o sistema depois de mudar o código:**
```bash
cd ~/bb-erp && git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

**Ver logs:**
```bash
docker compose -f docker-compose.prod.yml logs -f
```

**Restaurar um backup** (teste isso pelo menos uma vez!):
```bash
gunzip -c ~/backups/loja-XXXX.sql.gz | docker exec -i beb-db psql -U postgres -d loja
```

**Levar os dados que já existem na loja (PC) para o servidor:**
```bash
# no PC:
docker exec beb-db pg_dump -U postgres loja | gzip > loja.sql.gz
# enviar o arquivo para o VPS (scp) e restaurar com o comando de restaurar acima.
```

---

## Quando evoluir (não precisa agora)
- **Login de verdade** (tela de login, logout, vários usuários com permissões) via
  Spring Security — útil só quando entrar funcionário além do Lucas.
- `spring.jpa.show-sql` pode ser desligado em produção (menos ruído no log).
- Mandar uma cópia dos backups para fora do servidor (ex.: Backblaze B2, grátis até 10 GB).
