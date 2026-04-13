# 🕊️ Sistema Jovens do Verbo - JDV

Sistema completo de gestão do ministério de jovens: cadastro de jovens, eventos e controle financeiro com distribuição de ganhos.

---

## 🏗️ Arquitetura

```
verbo-da-vida/
├── backend/                        # FastAPI + PostgreSQL
│   ├── app/
│   │   ├── api/v1/endpoints/      # Rotas REST (jovens, eventos, financeiro, notificações)
│   │   ├── core/                  # Config, Scheduler (APScheduler)
│   │   ├── db/                    # Session, Base
│   │   ├── models/                # SQLAlchemy ORM
│   │   ├── schemas/               # Pydantic schemas
│   │   ├── services/              # Regras de negócio
│   │   └── tasks/                 # Background task de aniversário (06:00 diário)
│   ├── tests/                     # pytest + 100% de cobertura
│   ├── alembic/                   # Migrations
│   └── requirements.txt
├── frontend/                      # Next.js 14 + React + TypeScript
│   └── src/
│       ├── app/                   # App Router pages
│       ├── components/            # UI, Layout, Financeiro
│       ├── services/              # Camada de API (axios)
│       ├── types/                 # Tipos TypeScript
│       └── lib/                   # Utils, Providers
├── whatsapp-webjs/                # Serviço Node para envio via WhatsApp Web (dockerizado)
└── docker-compose.yml
```

---

## 🚀 Execução rápida com Docker

```bash
# 1. Clone e entre na pasta
cd verbo-da-vida

# 2. Copie o .env
cp .env.example .env

# 3. Suba tudo
docker-compose up --build
```

No fluxo Docker de desenvolvimento, o frontend instala dependências em `frontend/node_modules` e usa `frontend/.next` no host. Como o container roda com o mesmo UID/GID do usuário local, o VS Code enxerga as dependências e o Next.js consegue recriar os artefatos sem gerar arquivos `root`.



### Serviço WhatsApp (evolution-api)

O serviço `evolution-api` é responsável pelo envio de mensagens automáticas via WhatsApp, como notificações de aniversário.


**Primeira execução:**
1. Veja os logs para escanear o QR Code e autenticar:
   ```bash
   docker compose -f docker-compose.prod.yml logs -f evolution-api
   ```
2. Após autenticar, a sessão fica salva no volume do evolution-api.


**Variáveis importantes no .env:**
```
WHATSAPP_ENABLED=true
WHATSAPP_RECIPIENT_PHONE=5583SEUNUMERO
WHATSAPP_TIMEOUT_SECONDS=10
EVOLUTION_API_URL=http://evolution-api:8080
AUTHENTICATION_API_KEY=SEU_TOKEN
EVOLUTION_INSTANCE_NAME=nome-da-instancia
REDIS_PASSWORD=senha-redis
```


**Logs e monitoramento:**
Veja os logs para acompanhar envios e possíveis erros:
```bash
docker compose -f docker-compose.prod.yml logs -f evolution-api
```

- **Frontend**: http://localhost:3000  
- **Backend API**: http://localhost:8000  
- **Swagger docs**: http://localhost:8000/api/v1/openapi.json  

---

## 💻 Execução local (sem Docker)

### Backend

```bash
cd backend

# Crie e ative um virtualenv
python -m venv venv
source venv/bin/activate   # Linux/Mac
# venv\Scripts\activate    # Windows

# Instale dependências
pip install -r requirements.txt

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com sua URL do PostgreSQL

# Rode as migrations
alembic upgrade head

# Inicie o servidor
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

npm install
npm run dev
```

---

## 🧪 Testes (100% de cobertura)

```bash
cd backend

# Ative o virtualenv e instale dependências
pip install -r requirements.txt

# Rode os testes
pytest

# Com relatório de cobertura HTML
pytest --cov=app --cov-report=html
# Abra htmlcov/index.html no navegador
```

Os testes usam **SQLite em memória** — não precisam de PostgreSQL rodando.

Para alterar o usuário que pode editar o sistema, ajuste as variáveis `ADMIN_USERNAME`, `ADMIN_PASSWORD` e `ACCESS_TOKEN_EXPIRE_HOURS` no arquivo `.env` do backend.


---

---

## 📋 Funcionalidades

### Jovens
- Cadastro completo (nome, nascimento, telefone, e-mail, endereço)
- Habilitação para receber ganhos financeiros
- Filtro de aniversariantes do dia

### Eventos
- Cadastro de eventos com data/hora e local
- Separação entre próximos e realizados

### Caixa Financeiro
- Registro de vendas semanais com:
  - Total investido / arrecadado
  - Separação dinheiro vs Pix
  - Itens vendidos (produto, quantidade, preço unit., total)
- Distribuição de ganhos por jovem (rateio manual ou igualitário)
- Resumo geral: total em caixa, lucro líquido, etc.
- Ganhos mensais por jovem com totais
- Filtros por mês/ano ou período específico
- Gráfico de desempenho semanal (Recharts)

### Notificações de Aniversário 🎂
- Task em background executada **todos os dias às 06:00**
- Cria notificações automáticas para aniversariantes
- Ícone de sino na navbar com badge de contagem de não lidas
- Marcar como lida individualmente ou todas de uma vez

### Acesso e autenticação
- Leitura pública liberada para todos os módulos
- Criação, edição, exclusão e marcações exigem usuário autenticado
- Login por token via endpoint `POST /api/v1/auth/login`
- Credenciais padrão locais: `admin` / `admin123`

---

## 🔌 Endpoints da API

| Módulo | Endpoint | Descrição |
|--------|----------|-----------|
| Health | `GET /health` | Status da API |
| Auth | `POST /api/v1/auth/login` | Autenticar e obter token |
| Auth | `GET /api/v1/auth/me` | Validar sessão autenticada |
| Jovens | `GET/POST /api/v1/jovens/` | Listar / criar |
| Jovens | `GET/PUT/DELETE /api/v1/jovens/{id}` | Buscar / editar / deletar |
| Jovens | `GET /api/v1/jovens/habilitados-financeiro` | Habilitados para ganhos |
| Jovens | `GET /api/v1/jovens/aniversariantes-hoje` | Aniversariantes do dia |
| Eventos | `GET/POST /api/v1/eventos/` | CRUD de eventos |
| Financeiro | `GET/POST /api/v1/financeiro/vendas` | Listar / criar vendas |
| Financeiro | `GET /api/v1/financeiro/resumo` | Resumo geral do caixa |
| Financeiro | `POST /api/v1/financeiro/distribuir-ganhos` | Distribuir ganhos |
| Financeiro | `GET /api/v1/financeiro/ganhos/mensais` | Ganhos por jovem no mês |
| Notificações | `GET /api/v1/notificacoes/` | Listar notificações |
| Notificações | `GET /api/v1/notificacoes/count-nao-lidas` | Contagem de não lidas |
| Notificações | `PATCH /api/v1/notificacoes/{id}/marcar-lida` | Marcar como lida |
| Notificações | `PATCH /api/v1/notificacoes/marcar-todas-lidas` | Marcar todas como lidas |

---

## 🛠️ Stack técnica

| Camada | Tecnologia |
|--------|-----------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2 (async), Alembic |
| Banco de dados | PostgreSQL 16 |
| Background tasks | APScheduler (CronTrigger 06:00) |
| Testes | pytest, pytest-asyncio, pytest-cov (100%) |
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| UI | Tailwind CSS, Lucide React |
| Estado/Cache | TanStack Query v5 |
| Formulários | React Hook Form |
| HTTP Client | Axios |
| Gráficos | Recharts |
| Infra | Docker, Docker Compose |
| WhatsApp | whatsapp-web.js, Express, Puppeteer |

---

## 🚀 Deploy em Produção (Oracle Cloud Free Tier)

A Oracle Cloud oferece VMs **Always Free** (gratuitas para sempre) com ARM64, ideais para este projeto.

### 1. Criar a VM na Oracle Cloud

1. Crie uma conta em [cloud.oracle.com](https://cloud.oracle.com)
2. Vá em **Compute → Instances → Create Instance**
3. Configure:
   - **Image**: Ubuntu 22.04 (ou 24.04)
   - **Shape**: VM.Standard.A1.Flex — **2 OCPUs, 12GB RAM** (Always Free)
   - **Networking**: Crie uma VCN com subnet pública
   - **SSH Key**: Adicione sua chave pública (`~/.ssh/id_rsa.pub`)
4. Após criar, libere as portas **80** e **443** na **Security List** da subnet:
   - Source CIDR: `0.0.0.0/0`, Protocol: TCP, Dest Port: `80`
   - Source CIDR: `0.0.0.0/0`, Protocol: TCP, Dest Port: `443`

### 2. Apontar o domínio

No seu provedor de DNS, crie um registro **A** apontando para o IP público da VM:

```
seudominio.com.br  →  A  →  <IP_DA_VM>
```

> Sem domínio? Para teste rápido, use serviços como [nip.io](https://nip.io): `<IP>.nip.io`
> (Ex: `150.230.50.10.nip.io`). O Caddy gerará HTTPS automático.

### 3. Setup do servidor

```bash
# Conecte via SSH
ssh ubuntu@<IP_DA_VM>

# Execute o script de setup (instala Docker, abre portas)
# Opção A: direto do repo clonado
git clone <repo-url> /opt/verbo-da-vida
cd /opt/verbo-da-vida
bash scripts/setup-server.sh

# Faça logout/login para o grupo docker funcionar
exit
ssh ubuntu@<IP_DA_VM>
```


### 4. Configurar e subir

```bash
cd /opt/verbo-da-vida

# Crie o arquivo de variáveis de produção
cp .env.example .env

# Edite com senhas seguras (OBRIGATÓRIO trocar todos os valores TROCAR_*)
nano .env
# → Preencha DOMAIN, POSTGRES_PASSWORD, SECRET_KEY, ADMIN_PASSWORD, etc.

# Suba os serviços principais
docker compose -f docker-compose.prod.yml up -d --build

# Verifique os logs
docker compose -f docker-compose.prod.yml logs -f

# Teste o health check
curl https://seudominio.com.br/health
```

O **Caddy** gera o certificado HTTPS automaticamente via Let's Encrypt na primeira requisição.

### O que muda em produção

| Item | Desenvolvimento | Produção |
|------|----------------|----------|
| Backend workers | 1 (com --reload) | 4 (uvicorn workers) |
| Frontend | `next dev` | `next build` + `next start` (standalone) |
| Swagger/Docs | Habilitado | Desabilitado |
| Reverse proxy | Não usado | Caddy com HTTPS automático |
| Volumes de código | Bind mounts | Código embutido na imagem |
| Postgres | Senhas padrão | Senhas configuráveis via .env |
| Redis | Sem senha | Com senha |
| Restart policy | Nenhuma | `always` |

### Atualizações

```bash
cd /opt/verbo-da-vida
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

### Monitoramento

```bash
# Status dos containers
docker compose -f docker-compose.prod.yml ps

# Logs em tempo real
docker compose -f docker-compose.prod.yml logs -f backend

# Uso de recursos
docker stats
```
