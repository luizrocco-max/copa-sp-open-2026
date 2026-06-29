# Configurar publicação automática (Cloudflare Worker)

Objetivo: o painel admin publica direto no site, sem mandar arquivo para ninguém.
A chave do GitHub fica em segredo no Cloudflare — nunca na página.

## 1) Criar o token do GitHub (fine-grained)
1. Acesse https://github.com/settings/personal-access-tokens/new (logado como **luizrocco-max**).
2. **Token name:** `copa-publish` · **Expiration:** o que preferir (ex.: 1 ano).
3. **Resource owner:** luizrocco-max · **Repository access:** *Only select repositories* → `copa-sp-open-2026`.
4. **Permissions → Repository permissions → Contents:** *Read and write*.
5. **Generate token** e **copie** o valor (começa com `github_pat_...`). Guarde — só aparece uma vez.

## 2) Criar o Worker no Cloudflare
1. Crie uma conta grátis em https://dash.cloudflare.com (se ainda não tiver).
2. Menu lateral **Workers & Pages → Create → Create Worker**.
3. Dê um nome (ex.: `copa-publish`) → **Deploy** (cria com o código de exemplo).
4. Clique em **Edit code**, apague tudo e **cole o conteúdo de `worker.js`** (deste mesmo repo, pasta `backend/`). **Deploy**.

## 3) Definir as variáveis do Worker
No Worker → **Settings → Variables and Secrets → Add**:
- `GITHUB_TOKEN`  → tipo **Secret** → cole o token do passo 1.
- `ADMIN_PASSWORD` → tipo **Secret** → `a6509j` (a mesma senha do login do painel).
- `GH_REPO` → tipo **Text** → `luizrocco-max/copa-sp-open-2026`
- `GH_BRANCH` → tipo **Text** → `main`
- (opcional) `ALLOW_ORIGIN` → `https://copasaopaulodetiroahelice.com.br`

**Deploy** novamente para aplicar.

## 4) Pegar a URL do Worker
Na página do Worker aparece a URL, algo como:
`https://copa-publish.SEU-SUBDOMINIO.workers.dev`

➡️ **Me mande essa URL no chat.** Eu coloco no painel admin e republico — aí o botão
"🚀 Publicar para todos" passa a funcionar.

## Teste rápido (opcional)
Depois de tudo, no painel admin: faça upload de uma planilha → **Publicar para todos** →
em ~1 min o site oficial reflete a mudança para todos os visitantes.
