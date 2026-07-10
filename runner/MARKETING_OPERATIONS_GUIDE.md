# Agrostech — Guia de Operações de Marketing & Bot do Telegram
### Como gerar conteúdo e configurar a integração com o Telegram

Este guia explica como a geração de conteúdo acontece de forma programática através dos agentes e como colocar o Bot do Telegram para funcionar na prática.

---

## 1. Como a Geração de Conteúdo Acontece

Nossos agentes digitais operam como um **Digital Twin** da equipe real. Eles utilizam a classe base em [base_agent.py](file:///c:/Users/Razer/.gemini/antigravity-ide/scratch/agrostech/runner/base_agent.py) para carregar os system prompts em Markdown e chamar a API do modelo LLM (Gemini/GPT/Claude).

### O Fluxo de Trabalho (Pipeline) de Geração:
Quando você executa o gerador de conteúdo mensal, o seguinte fluxo de trabalho inter-agente ocorre de forma sequencial:

```
[Marketing Agent] — Define estratégia do mês
        ↓ (briefing estratégico)
[Content Director] — Elabora o briefing de canais e formatos
        ├── [Instagram Image Agent] — Cria prompts de imagem e carrosséis
        ├── [Instagram Reels Agent] — Roteiriza Reels e sugere áudios
        └── [TikTok Agent] — Cria roteiros nativos (Gen-Z vs Millennial)
        ↓ (peças criadas)
[Visual Identity Agent] — Revisa tudo contra o Brand Style Guide
        ↓ (peças revisadas com feedbacks)
[Content Director] — Ajusta os pontos de marca e gera pacote final
        ↓ (output salvo)
💾 data/generated/conteudo_[mes_ano].md
```

---

## 2. Como Executar e Gerar Conteúdo no Terminal

Certifique-se de que está na pasta raiz ou em `runner/` e que instalou as dependências:
```bash
cd runner/
pip install -r requirements.txt
```

### Opção A: Geração de Campanha Automatizada (Modo Pipeline)
Para gerar todo o conteúdo de um mês automaticamente e salvar o relatório formatado:
```bash
python runner/marketing_agent.py --generate "Julho 2026"
```
Isso criará o arquivo `data/generated/conteudo_julho_2026.md` contendo todos os posts, legendas, scripts de vídeo e prompts revisados visualmente.

### Opção B: Menu CLI Interativo (Conversar com Agentes)
Para fazer perguntas individuais a qualquer agente (ex: pedir um prompt extra para o Image Agent ou novas trends para o TikTok Agent):
```bash
python runner/marketing_agent.py
```
Isso abrirá um menu interativo no terminal:
```
============================================================
📣 AGROSTECH — MARKETING & VISUAL CONTENT TEAM
============================================================
1. Marketing Agent (Estratégia)
2. Content Director (Calendário & Briefings)
3. Instagram Image Agent (Carrosséis & Prompts)
4. Instagram Reels Agent (Vídeos Curtos & Áudios)
5. TikTok Agent (Trends & Roteiros Duais)
6. Visual Identity Agent (Marca & Templates)
7. 🚀 Workflow: Geração de Conteúdo Mensal Completo
8. Sair
============================================================
```

---

## 3. Como Configurar e Rodar o Bot do Telegram

O bot do Telegram permite que a equipe humana gerencie tarefas do ClickUp e visualize os briefings e trends direto pelo celular no campo. Para colocá-lo para funcionar, siga os passos abaixo:

### Passo 1: Criar o Bot e Obter o Token
1. Abra o Telegram no celular ou desktop e pesquise por `@BotFather`.
2. Envie o comando `/newbot` e siga as instruções para dar um nome e um username ao seu bot (ex: `@AgrosTechBot`).
3. O BotFather gerará um **token de API** (uma sequência longa de letras e números). Copie este token.

### Passo 2: Configurar o arquivo `.env`
Na pasta `runner/`, crie um arquivo chamado `.env` (se ainda não existir) e adicione o seu token do Telegram:
```env
TELEGRAM_BOT_TOKEN=insira_seu_token_aqui
GEMINI_API_KEY=insira_sua_api_key_do_gemini_aqui
```

### Passo 3: Inicializar o Banco de Dados do Bot (SQLite)
O bot possui segurança RBAC. Para evitar que estranhos executem comandos, ele só responde a IDs cadastrados na tabela `users` do banco SQLite.

Rode o script de seeding para criar as tabelas e usuários padrão:
```bash
python runner/seed_telegram_db.py
```

### Passo 4: Cadastrar o seu próprio Telegram ID
Para poder testar e interagir com o bot, você precisa adicionar o seu ID do Telegram ao banco.
1. Para descobrir seu ID, envie qualquer mensagem para o bot `@userinfobot` no Telegram. Ele retornará seu ID numérico (ex: `123456789`).
2. Cadastre-se na base rodando o comando:
   ```bash
   python runner/seed_telegram_db.py --add [SEU_ID] "[SEU_NOME]" admin
   ```
   *(Substitua `[SEU_ID]` e `[SEU_NOME]` pelos seus dados reais. O papel `admin` dá acesso a todos os comandos).*

### Passo 5: Iniciar o Bot
Agora basta rodar o servidor do bot:
```bash
python runner/telegram_bot.py
```
O console mostrará `[START] Launching Agrostech Telegram Bot gateway...`.

Abra o seu bot no Telegram e envie o comando `/start`. Ele reconhecerá seu nome e papel de administrador! Experimente enviar os comandos `/ajuda`, `/status` ou `/trends`.
