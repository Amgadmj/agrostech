# Guia de Deploy Rápido: Vercel & Supabase (AgrosTech SaaS Beta)

Este guia orienta o deploy da versão beta da plataforma **AgrosTech SaaS** em ambientes temporários/gratuitos na **Vercel** e no **Supabase**.

---

## 1. Banco de Dados & Autenticação (Supabase)

### Passo 1: Criar Projeto no Supabase
1. Acesse [database.new](https://database.new) ou [supabase.com](https://supabase.com).
2. Crie uma organização e um novo projeto (ex: `agrostech-beta-demo`).
3. Defina a senha do banco de dados e selecione uma região próxima (ex: `sa-east-1` São Paulo).

### Passo 2: Executar o Schema do Banco
1. No painel do projeto Supabase, acesse **SQL Editor** no menu lateral esquerdo.
2. Copie todo o conteúdo do arquivo [`supabase/schema.sql`](file:///c:/Users/Razer/Desktop/Agrostech/saas/supabase/schema.sql).
3. Cole no editor e clique em **Run**.
4. O script ativará a extensão `postgis`, criará as tabelas operacionais (`users`, `land_parcels`, `compliance_records`, `financed_operations`, `departmental_cases`, `findings`, `reports`, `sar_processing_jobs`, `audit_events`), configurará as políticas RLS não-recursivas com helpers `SECURITY DEFINER` e inserirá os dados semente da **Fazenda Buritis** e do piloto **Coplacana (Cana-de-Açúcar)**.

### Passo 3: Obter Credenciais
No menu **Project Settings > API**, copie:
- **Project URL** (`https://<project-ref>.supabase.co`)
- **anon / public key**
- **service_role key** (necessária para APIs de auditoria backend)

---

## 2. Deploy do Frontend & APIs (Vercel)

### Opção A: Deploy via CLI da Vercel (Recomendado / Rápido)
No terminal, dentro da pasta `saas`:
```bash
# 1. Instalar Vercel CLI caso não tenha
npm install -g vercel

# 2. Executar deploy
vercel
```
Siga as instruções interativas:
- `Set up and deploy?` **y**
- `Which scope?` Escolha sua conta pessoal/equipe
- `Link to existing project?` **n**
- `What's your project's name?` **agrostech-beta**
- `In which directory is your code located?` **./**
- `Want to modify these settings?` **n**

Para deploy definitivo em produção:
```bash
vercel --prod
```

### Opção B: Deploy via Painel Web da Vercel (Git)
1. Suba o repositório no GitHub ou GitLab.
2. Acesse [vercel.com/new](https://vercel.com/new).
3. Importe o repositório e defina o **Root Directory** como `saas` (ou a raiz se estiver isolado).
4. Em **Environment Variables**, adicione as variáveis abaixo.
5. Clique em **Deploy**.

---

## 3. Variáveis de Ambiente Necessárias (Vercel Environment Variables)

Configure no painel da Vercel (**Settings > Environment Variables**) ou via `vercel env add`:

| Variável | Valor para Demonstração / Beta | Obrigatório |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Sua URL do Supabase (`https://<ref>.supabase.co`) | Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sua chave pública anon do Supabase | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Sua chave privada service_role do Supabase | Sim |
| `NEXT_PUBLIC_DEMO_MODE` | `true` (permite navegação guiada com cookies de perfil) | Sim (para beta) |
| `INTEGRITY_MODE` | `demo` | Sim |
| `ALLOW_MOCK_FALLBACK` | `true` | Sim |
| `NEXT_PUBLIC_MAP_STYLE` | `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json` | Opcional |
| `REGISTRO_RURAL_API_KEY` | Sua chave da API Registro Rural (se disponível) | Opcional |
| `BDC_ACCESS_TOKEN` | Token INPE BDC (se disponível) | Opcional |

---

## 4. Teste e Validação da Instância em Produção

Após o deploy:
1. Acesse o domínio gerado (ex: `https://agrostech-beta.vercel.app`).
2. Acesse `/login` e clique em **Entrar como Gestor B2B (Demo)** ou **Produtor B2C**.
3. Navegue pelos fluxos:
   - **M1: Área Líquida**: Visualização 2D no mapa interativo com camadas temáticas do MapBiomas e cálculo de dedução RL/APP.
   - **M2: Gêmeo 3D (Opcional)**: Modelo tridimensional com extrusão topográfica.
   - **M3: Monitoramento SAR / Shield-RJ**: Detecção de anomalias de colheita e auditoria preventiva.
   - **Alternador Departamental**: Alterne no cabeçalho entre **Crédito & Risco** (MCR 2-9) e **Agri-Precisão** (Coplacana / Cana).
