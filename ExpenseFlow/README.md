# ExpenseFlow 2.0 🚀
Plataforma automatizada de gestão financeira pessoal utilizando RPA (UiPath) + Backend Python.

---

## 📋 Pré-requisitos

Antes de rodar o projeto, cada membro do grupo precisa ter instalado:

- [UiPath Studio](https://www.uipath.com/start-trial) (Community Edition é gratuita)
- [Python 3.10+](https://www.python.org/downloads/)
- Conta no [UiPath Automation Cloud](https://cloud.uipath.com) (gratuita)
- Conta Gmail ou Outlook configurada no UiPath (ver Passo 3)

---

## ⚙️ Configuração passo a passo

### Passo 1 — Clonar / abrir o projeto
Coloque a pasta do projeto em qualquer diretório da sua máquina.
> ⚠️ O projeto **não depende** de um caminho fixo — funciona em qualquer pasta.

---

### Passo 2 — Criar o arquivo `.env`
Na raiz do projeto, crie um arquivo chamado **`.env`** (baseado no `.env.example`):

```
ORCHESTRATOR_URL=https://cloud.uipath.com
UIPATH_ORG=seu_org_aqui
UIPATH_TENANT=seu_tenant_aqui
UIPATH_CLIENT_ID=seu_client_id_aqui
UIPATH_CLIENT_SECRET=seu_client_secret_aqui
UIPATH_FOLDER_ID=seu_folder_id_aqui
UIPATH_PROCESS_NAME=ExpenseFlow

GMAIL_CONTA_1=seu_email@gmail.com
GMAIL_CONNECTION_ID_1=seu_connection_id_aqui
```

**Como obter as credenciais do UiPath:**
1. Acesse [cloud.uipath.com](https://cloud.uipath.com)
2. Vá em **Admin → External Applications → Add Application**
3. Crie um app do tipo "Confidential" com os escopos `OR.Jobs`, `OR.Folders`, `OR.Execution`
4. Copie o `Client ID` e `Client Secret` gerados
5. O `UIPATH_ORG` e `UIPATH_TENANT` estão na URL: `cloud.uipath.com/{ORG}/{TENANT}/`
6. O `UIPATH_FOLDER_ID` está em **Orchestrator → Pastas → (clique na pasta) → ID na URL**

---

### Passo 3 — Configurar conexão de e-mail no UiPath
Cada membro precisa conectar sua própria conta de e-mail:

1. No UiPath Studio, abra o projeto
2. Clique em **Integration Service → Connections → Add Connection**
3. Escolha **Gmail** ou **Outlook 365** e autentique com sua conta
4. Após criar a conexão, abra o workflow `Workflows\Gmail\CapturarEmailsGmail.xaml`
5. Clique na activity **"Para Cada E-mail Gmail"** e selecione sua conexão no campo `ConnectionId`
6. Repita para `Workflows\Outlook\CapturarEmailsOutlook.xaml`
7. Copie o Connection ID gerado e coloque no `.env` como `GMAIL_CONNECTION_ID_1`

---

### Passo 4 — Instalar dependências Python

```bash
cd caminho/para/o/projeto
pip install -r requirements.txt
```

Se não existir `requirements.txt`, instale manualmente:
```bash
pip install fastapi uvicorn httpx python-dotenv openpyxl
```

---

### Passo 5 — Verificar a planilha Excel
O arquivo `Dados\ExpenseFlow_Dados.xlsx` já vem com o projeto.
Certifique-se de que a aba **`Transacoes`** tem exatamente estas colunas na linha 1:

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| Hash | Data | Categoria | Descricao | Origem | Valor |

---

### Passo 6 — Rodar o backend

```bash
python app.py
```
Ou com uvicorn:
```bash
uvicorn app:app --reload --port 5000
```

Acesse: [http://localhost:5000](http://localhost:5000)

---

### Passo 7 — Publicar o robô no Orchestrator
1. No UiPath Studio, clique em **Publish**
2. Escolha seu tenant do Orchestrator
3. Após publicar, vá em **Orchestrator → Processos** e confirme que `ExpenseFlow` aparece

---

## 🗂️ Estrutura do Projeto

```
ExpenseFlow/
├── Main.xaml                          # Workflow principal (ponto de entrada)
├── orchestrator.py                    # Cliente da API do UiPath Orchestrator
├── app.py                             # Backend web (Flask/FastAPI)
├── .env.example                       # Template de configuração (NÃO contém dados reais)
├── .env                               # ⚠️ Suas credenciais (NÃO compartilhe/commite)
├── Dados/
│   └── ExpenseFlow_Dados.xlsx         # Planilha de armazenamento de transações
└── Workflows/
    ├── Gmail/
    │   └── CapturarEmailsGmail.xaml   # Captura e-mails Gmail
    ├── Outlook/
    │   └── CapturarEmailsOutlook.xaml # Captura e-mails Outlook
    └── Processamento/
        ├── ExtrairDadosTransacao.xaml # Extrai valor, data e categoria
        ├── GerarHash.xaml             # Gera hash SHA256 para deduplicação
        ├── VerificarDuplicata.xaml    # Verifica se transação já existe
        └── EnviarParaAPI.xaml         # Salva transação no Excel
```

---

## ❓ Problemas comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `Input array is longer than the number of columns` | Colunas do Excel erradas | Ver Passo 5 — verificar headers da aba Transacoes |
| `Falha na autenticacao: 401` | Credenciais do .env incorretas | Rever Client ID e Secret no UiPath Cloud |
| `Processo 'ExpenseFlow' nao encontrado` | Robô não publicado | Ver Passo 7 — publicar no Orchestrator |
| `Nenhuma transação encontrada` | Conexão de e-mail não configurada | Ver Passo 3 — conectar conta de e-mail |

---

## 🔒 Segurança
- **Nunca** compartilhe o arquivo `.env` (contém suas credenciais)
- O `.env.example` é o único arquivo de configuração que deve ir para o repositório
- Cada membro do grupo usa suas **próprias** credenciais e conexões de e-mail
