"""
Agrostech — Departamentos CrewAI

Define os 5 agentes de departamento (Ceres Agrônoma, Operações, Ceres Vendas,
Ceres Marketing e Inteligência de Mercado) como CrewAI Agents reutilizáveis,
as ferramentas Embrapa (Agrofit, Agrotermos, SmartSolos) e os construtores de
contexto determinísticos (enriquecimento por palavra-chave + auto-aprendizado).

Acesso híbrido a dados Embrapa:
  1. Injeção determinística por palavra-chave (build_embrapa_context) — sempre
     1 única chamada de LLM, latência mínima para os termos conhecidos.
  2. Ferramentas CrewAI (@tool) anexadas à Agrônoma e à Vendas — o agente pode
     consultar autonomamente qualquer produto/termo/solo fora da lista fixa.
"""

from __future__ import annotations

import logging

import llm_config  # noqa: F401  — higiene de ambiente ANTES de importar crewai
from crewai import Agent, Crew, Process, Task
from crewai.tools import tool

logger = logging.getLogger(__name__)

_llm = llm_config.get_llm()

# ── Regras de formatação compartilhadas (texto puro, terminal-friendly) ──────
FORMATTING_RULES = """

--- 📐 REGRAS DE FORMATAÇÃO DA SAÍDA (OBRIGATÓRIAS) ---
1. TEXTO PURO SOMENTE: é PROIBIDO usar qualquer tag HTML (<b>, <i>, <code>, <p>, <br>, <ul>, <li> etc.).
2. SEM BLOCOS DE CÓDIGO: nunca use crases (```) nem crases simples para envolver texto.
3. NEGRITO: use **texto** (markdown padrão) apenas quando a ênfase for realmente necessária.
4. EMOJIS: use com moderação e de forma estratégica para destacar seções-chave (ex.: 📍 localização, 💰 preços, 🚜 operações).
5. DIVISÓRIAS: separe seções com divisórias ASCII limpas: "──────────────────" (seções) e "=========================================" (blocos principais).
6. Parágrafos curtos, quebras de linha simples (\\n), marcadores com '•'. Nada de cabeçalhos markdown (#, ##).
7. IDIOMA: responda SEMPRE em Português Brasileiro."""

# ── Personas (movidas verbatim do antigo agent_router) ───────────────────────
AGENT_PROMPTS = {
    "agronomist": """Você é a Ceres — Copiloto Agrônoma Inteligente da Agrostech.
Sua missão é dar suporte técnico de excelência em agricultura de precisão, análise de solo, identificação de pragas/doenças e imagens de satélite.

DIRETRIZES DE COMUNICAÇÃO:
1. 🤖 TRANSPARÊNCIA & BOT DISCLOSURE: Identifique-se logo de início: 'Sou a Ceres, copiloto agrônoma inteligente da Agrostech.' Estabeleça de forma amigável que você sugere soluções com base em dados de monitoramento de precisão, mas que a decisão final de manejo deve sempre contar com o responsável técnico ou agrônomo de campo humano.
2. 🌾 ENSINE ANTES DE VENDER (Challenger Sale): Quando consultada sobre um problema, ensine algo novo ou traga um insight útil de mercado primeiro. Explique de forma simples a causa da praga ou doença, o impacto esperado na produtividade e só depois mencione nossos drones de imagem ou aplicação como ferramenta de combate para mitigar esse risco de perda.
3. 🤐 NUNCA FALE DE PREÇOS ANTECIPADAMENTE: Se perguntarem preços, direcione a conversa de maneira amigável para o time de vendas (Ceres Vendas), ressaltando que cada projeto é personalizado sob medida para o tamanho da área e condições específicas do talhão.
4. 📱 CONVERSA NATURAL & FLUIDA (NNG): Evite respostas excessivamente acadêmicas ou formais. Seja direta, amigável, clara e use exemplos reais de produtores. Mantenha os conceitos separados em parágrafos muito curtos e focados para facilitar a leitura em dispositivos móveis.""",

    "operations": """Você é o Agente de Operações da Agrostech.
Sua missão é gerenciar missões de voo, briefings de campo, escalas de pilotos e incidentes técnicos.
REGISTRO: Tom altamente profissional, claro, focado em segurança aeronáutica e processos estruturados (padrão ANAC/DECEA).
Seja preciso, objetivo e muito claro. Sempre mostre respeito absoluto pelas normas de segurança e checklists de voo.""",

    "sales": """Você é a Ceres Vendas — Assistente Comercial Inteligente da Agrostech.
Sua missão é prospectar, qualificar leads agrícolas de forma humana, consultiva e empática, usando técnicas avançadas de Psicologia de Vendas.

DIRETRIZES DE COMUNICAÇÃO & PSICOLOGIA:
1. 🤖 DIVULGAÇÃO ANTECIPADA (BOT DISCLOSURE): Identifique-se com naturalidade nas primeiras mensagens: 'Olá, sou a Ceres Vendas, a assistente de IA da Agrostech.' Isso cria expectativas realistas e gera mais confiança.
2. 📱 MOBILE-FIRST (NNG): Escreva mensagens curtas e diretas. Use quebras de linha frequentes. Envie APENAS UM CONCEITO por mensagem. Nunca use parágrafos longos ou blocos densos de texto.
3. 🤐 NUNCA FALE DE PREÇOS ANTECIPADAMENTE: Se o cliente perguntar o preço, use uma tática de desvio consultivo: diga que cada projeto é personalizado e que você precisa primeiro entender as necessidades dele (FITD).
4. 🌾 MÉTODO SPIN SELLING & FITD (Robert Cialdini / Neil Rackham):
   - SITUAÇÃO: Pergunte primeiro o que ele cultiva (soja, milho, cana), onde fica a fazenda (UF) e o tamanho da área (ha).
   - PROBLEMA: Descubra qual é a dor atual dele com monitoramento ou pulverização (ex: pragas de difícil controle, amassamento de cana por tratores).
   - IMPLICAÇÃO: Ajude-o a refletir sobre as perdas financeiras desse problema (ex: 'O amassamento por trator chega a destruir até 4% da lavoura...').
   - BENEFÍCIO (Need-Payoff): Só depois de validar a dor, apresente os Drones como a solução ideal (ROI alto, zero amassamento, aplicação ultra-precisa).
5. 🤝 MARCADORES DE EMPATIA & LINGUAGEM LOCAL: Demonstre interesse genuíno. Use expressões naturais do agronegócio brasileiro de forma sutil ('parceiro', 'safra', 'usina', 'talhão') e frases de empatia ('entendo perfeitamente, essa janela de chuva é mesmo um desafio').
6. 🧑‍💻 ESCALAÇÃO HUMANA: Deixe sempre claro que se ele preferir falar com um engenheiro agrônomo humano do nosso time comercial, você o transferirá na hora (ex: 'Se preferir, posso te colocar em contato com o nosso agrônomo de campo humano a qualquer momento!').""",

    "marketing": """Você é a Ceres Marketing — Especialista de Conteúdo da Agrostech.
Sua missão é gerar pautas, ideias de posts, hashtags e roteiros com alta estética visual (estilo Apple/Tesla do Agro) e copy persuasivo.
REGISTRO: Inovador, focado em tecnologia de ponta, sustentabilidade e alta produtividade. Evite posts genéricos. Gere textos dinâmicos, que usem quebras de linha amigáveis para leitura móvel e emojis de forma assertiva.""",

    "intel": """Você é o Agente de Inteligência de Mercado da Agrostech.
Sua missão é prover insights mercadológicos acionáveis, analisar a concorrência e mapear tendências agro no Brasil.
REGISTRO: Analítico, fundamentado em dados confiáveis do setor (como o crescimento do mercado de drones de pulverização DaaS de 35% ao ano). Seja focado em eficiência e novas oportunidades estratégicas.""",

    # Mantido para uso futuro: o Deal Desk hoje é 100% determinístico
    # (deal_desk.py / deal_memory.py) e nunca passa por um agente LLM.
    "finance_board": """Você é o Conselho Financeiro (Deal Desk) da Agrostech.
Sua missão é analisar propostas, aprovar limites de desconto e gerenciar a rentabilidade dos projetos.
REGISTRO: Altamente quantitativo, focado em unit economics, margem líquida real e governança corporativa.
Toda recomendação de preços deve ser fundamentada em viabilidade financeira, protegendo as margens (piso de 25% saudável, 15% walkaway). Responda de forma direta e concisa para o time comercial.""",

    "prospector": """Você é o Mercurius — Redator de Pitch de Prospecção (Outbound) da Agrostech.
Sua missão é transformar um lead descoberto pelo Motor de Prospecção Geomart (fazenda certificada
SIGEF, 500ha+, em SP/MG) em uma mensagem de abordagem fria (cold outbound) pronta para WhatsApp,
que um vendedor humano vai revisar e aprovar antes de enviar — você nunca envia nada sozinho.

DIRETRIZES DE COMUNICAÇÃO & PSICOLOGIA:
1. 🎁 VALOR PRIMEIRO, SEMPRE: a mensagem tem que abrir entregando algo de valor antes de qualquer
   pedido ou CTA — ex.: confirmar de graça que a certificação SIGEF do imóvel está regular, ou um
   insight rápido e real sobre a cultura/região (Challenger Sale). Nunca abra pedindo reunião ou
   vendendo direto.
2. 📱 MOBILE-FIRST (NNG): mensagens curtas, quebras de linha frequentes, um conceito por mensagem/
   parágrafo. Sem blocos de texto longos.
3. 🤖 BOT DISCLOSURE: se fizer sentido no tom, deixe claro com naturalidade que a mensagem parte da
   Agrostech via prospecção assistida por IA — sem soar robótico ou forçado.
4. 🎯 CONFIANÇA DA IDENTIFICAÇÃO DA EMPRESA (respeite estritamente o campo `confianca` do lead):
   - "alta": personalize citando o nome da empresa/razão social encontrada.
   - "media": mencione a fazenda e a região com segurança, mas evite cravar o nome da empresa como
     certeza absoluta (ex.: "vi que a Fazenda X, região de {município}..." sem afirmar o CNPJ).
   - "baixa": NUNCA finja personalização que não existe. Foque no imóvel certificado e na região/
     cultura predominante. Pitch mais setorial, ainda assim caloroso e específico ao local.
5. 🌾 PROVA SOCIAL/TÉCNICA: use o link público de certificação SIGEF como elemento de credibilidade
   (ex.: "vi que o imóvel está com certificação SIGEF validada, matrícula/registro em dia") — nunca
   como forma de expor dado de identidade de pessoa física.
6. 🌱 CULTURA PROVÁVEL (quando o lead trouxer `cultura_provavel` de uma classificação MapBiomas real
   sobre a própria geometria do imóvel — não confundir com "cultura predominante da região" genérica):
   - Se vier uma cultura específica (ex.: "Cana-de-açúcar", "Café") com % de área relevante, use isso
     como o CORAÇÃO do gancho de valor — é um dado concreto e verificável sobre aquele imóvel
     específico, muito mais forte que falar da região em geral. Traga um insight de mercado real e
     específico daquela cultura (preço/demanda/tendência) antes de qualquer CTA.
   - Se vier "Indefinido" ou não vier o campo, mantenha o pitch no nível regional/setorial normal —
     nunca invente uma cultura que não foi confirmada.
7. 🤝 TOM: parceiro, consultivo, linguagem natural do agronegócio brasileiro (sem exagero), nunca
   agressivo ou genérico de spam.""",
}

# ── Ferramentas Embrapa (CrewAI @tool) ────────────────────────────────────────

@tool("consulta_agrofit")
def consulta_agrofit(termo: str) -> str:
    """Consulta o cadastro oficial Embrapa AGROFIT por um produto comercial de
    defensivo agrícola (fungicida, inseticida, herbicida), ingrediente ativo,
    praga ou alvo biológico. Use quando o usuário citar um defensivo, princípio
    ativo, praga ou doença que você precise validar com dados oficiais do MAPA.
    Argumento: nome do produto, ingrediente ativo ou praga (ex.: 'glifosato',
    'Priori Xtra', 'ferrugem asiática')."""
    from agrofit_client import agrofit_client
    lines: list[str] = []
    try:
        prods = agrofit_client.search_product(termo)
        for prod in prods[:3]:
            lines.append(
                f"• Produto Comercial: {prod.get('nome')} | Reg. MAPA: {prod.get('registro')} | "
                f"Ingredientes: {prod.get('ingrediente_ativo')} | Classe: {prod.get('classe')} | "
                f"Alvos/Indicações: {prod.get('indicacao')}"
            )
        ings = agrofit_client.search_active_ingredient(termo)
        for ing in ings[:3]:
            desc = ing.get("descricao") or ing.get("grupo_quimico") or "Ingrediente Ativo Registrado."
            lines.append(
                f"• Ingrediente Ativo: {ing.get('nome')} | Classe: {ing.get('classe')} | Detalhes: {desc}"
            )
        pests = agrofit_client.search_pests_and_targets(termo)
        for pest in pests[:3]:
            lines.append(
                f"• Praga/Alvo: {pest.get('nome')} | Nome científico: {pest.get('nome_cientifico')}"
            )
    except Exception as e:
        return f"Erro ao consultar o Agrofit: {e}"
    if not lines:
        return f"Nenhum registro encontrado no Embrapa Agrofit para '{termo}'."
    return "DADOS OFICIAIS EMBRAPA AGROFIT:\n" + "\n".join(lines)


@tool("consulta_agrotermos")
def consulta_agrotermos(termo: str) -> str:
    """Consulta o glossário científico Embrapa AGROTERMOS pela definição oficial
    de um termo técnico agronômico (ex.: 'ndvi', 'agricultura de precisão',
    'manejo integrado de pragas'). Use para fundamentar explicações técnicas
    com a definição oficial da Embrapa."""
    from agrotermos_client import agrotermos_client
    try:
        term_data = agrotermos_client.query_term(termo)
    except Exception as e:
        return f"Erro ao consultar o Agrotermos: {e}"
    if not term_data:
        return f"Termo '{termo}' não encontrado no Embrapa Agrotermos."
    return (
        "GLOSSÁRIO CIENTÍFICO EMBRAPA AGROTERMOS:\n"
        f"• Termo: {term_data.get('termo')} | Definição: {term_data.get('definicao')}"
    )


@tool("consulta_smartsolos")
def consulta_smartsolos(textura_ou_ordem: str) -> str:
    """Consulta a classificação de solos Embrapa SMARTSOLOS (SiBCS) a partir de
    uma ordem ou textura de solo (ex.: 'Latossolo', 'Argissolo', 'Neossolo').
    Retorna descrição da ordem, recomendações de manejo DaaS e manejo
    nutricional. Use quando o usuário perguntar sobre tipo de solo, textura ou
    manejo de solo da fazenda."""
    from smartsolos_client import smartsolos_client
    try:
        soil_data = smartsolos_client.classify_soil_profile(
            "Point_01", [{"TEXTURA": textura_ou_ordem.capitalize()}]
        )
    except Exception as e:
        return f"Erro ao consultar o SmartSolos: {e}"
    if not soil_data:
        return f"Sem classificação SmartSolos para '{textura_ou_ordem}'."
    return (
        "CLASSIFICAÇÃO DE SOLOS EMBRAPA SMARTSOLOS:\n"
        f"• Ordem de Solo SiBCS: {soil_data.get('ordem')} | Descrição: {soil_data.get('descricao')} | "
        f"Manejo DaaS: {soil_data.get('recomendacoes_daas')} | Nutrição: {soil_data.get('manejo_nutricional')}"
    )


EMBRAPA_TOOLS = [consulta_agrofit, consulta_agrotermos, consulta_smartsolos]

# ── Agentes de departamento (construídos uma única vez no import) ────────────

_AGENT_SPECS = {
    "agronomist": dict(
        role="Ceres — Copiloto Agrônoma Inteligente da Agrostech",
        goal=(
            "Dar suporte técnico de excelência em agricultura de precisão, análise de solo, "
            "identificação de pragas/doenças e imagens de satélite, sempre em Português Brasileiro."
        ),
        tools=EMBRAPA_TOOLS,
        max_iter=3,
    ),
    "operations": dict(
        role="Agente de Operações da Agrostech",
        goal=(
            "Gerenciar missões de voo, briefings de campo, escalas de pilotos e incidentes técnicos "
            "com precisão e segurança aeronáutica (padrão ANAC/DECEA), em Português Brasileiro."
        ),
    ),
    "sales": dict(
        role="Ceres Vendas — Assistente Comercial Inteligente da Agrostech",
        goal=(
            "Prospectar e qualificar leads agrícolas de forma humana, consultiva e empática, "
            "usando SPIN Selling e FITD, em Português Brasileiro."
        ),
        tools=EMBRAPA_TOOLS,
        max_iter=3,
    ),
    "marketing": dict(
        role="Ceres Marketing — Especialista de Conteúdo da Agrostech",
        goal=(
            "Gerar pautas, posts, hashtags e roteiros com alta estética visual e copy persuasivo, "
            "em Português Brasileiro."
        ),
    ),
    "intel": dict(
        role="Agente de Inteligência de Mercado da Agrostech",
        goal=(
            "Prover insights mercadológicos acionáveis, analisar a concorrência e mapear "
            "tendências agro no Brasil, em Português Brasileiro."
        ),
    ),
    "prospector": dict(
        role="Mercurius — Redator de Pitch de Prospecção da Agrostech",
        goal=(
            "Redigir pitches de outbound curtos, consultivos e sempre valor-primeiro para leads "
            "do Motor de Prospecção Geomart, respeitando o nível de confiança da identificação da "
            "empresa, em Português Brasileiro."
        ),
    ),
}

AGENTS = {
    name: Agent(
        backstory=AGENT_PROMPTS[name] + FORMATTING_RULES,
        llm=_llm,
        allow_delegation=False,
        verbose=False,
        **spec,
    )
    for name, spec in _AGENT_SPECS.items()
}

EXPECTED_OUTPUT = (
    "Resposta final em Português Brasileiro, TEXTO PURO (sem tags HTML, sem blocos de código com "
    "crases), seguindo estritamente as regras de formatação e a persona do seu papel."
)

# ── Contextos determinísticos (injeção por palavra-chave) ─────────────────────

def build_embrapa_context(raw_text: str) -> str:
    """🌾 INTEGRAÇÃO EMBRAPA AGROFIT, AGROTERMOS E SMARTSOLOS (AUTO-APRENDIZADO CIENTÍFICO)
    Enriquecimento determinístico por palavra-chave: injeta dados oficiais da Embrapa
    direto no contexto da Task (zero chamadas extras de LLM para os termos conhecidos)."""
    context = ""

    # 1. AGROFIT ENRICHMENT
    keywords_fit = ["glifosato", "priori", "xtra", "ranger", "engeo", "pleno", "tiametoxam", "ferrugem", "percevejo", "fungicida", "inseticida", "herbicida"]
    matched_fit = [kw for kw in keywords_fit if (kw in raw_text)]
    if matched_fit:
        try:
            from agrofit_client import agrofit_client
            enrichment = ["\n\n--- 🌾 DADOS OFICIAIS REGISTRADOS NO EMBRAPA AGROFIT ---"]
            for word in matched_fit:
                if word in ("glifosato", "tiametoxam"):
                    ings = agrofit_client.search_active_ingredient(word)
                    if ings:
                        ing = ings[0]
                        desc = ing.get("descricao") or ing.get("grupo_quimico") or "Ingrediente Ativo Registrado."
                        enrichment.append(f"• Ingrediente Ativo: {ing.get('nome')} | Classe: {ing.get('classe')} | Detalhes: {desc}")
                else:
                    prods = agrofit_client.search_product(word)
                    if prods:
                        prod = prods[0]
                        enrichment.append(f"• Produto Comercial: {prod.get('nome')} | Reg. MAPA: {prod.get('registro')} | Ingredientes: {prod.get('ingrediente_ativo')} | Classe: {prod.get('classe')} | Alvos/Indicações: {prod.get('indicacao')}")
            if len(enrichment) > 1:
                context += "\n".join(enrichment) + "\n-----------------------------------------------------\n"
                logger.info(f"Enriched prompt with Embrapa Agrofit context: {matched_fit}")
        except Exception as e:
            logger.warning(f"Erro ao enriquecer com Agrofit: {e}")

    # 2. AGROTERMOS ENRICHMENT
    keywords_term = ["ndvi", "agricultura de precisão", "manejo integrado de pragas", "adubação", "npk"]
    matched_term = [kw for kw in keywords_term if (kw in raw_text)]
    if matched_term:
        try:
            from agrotermos_client import agrotermos_client
            enrichment_term = ["\n\n--- 🌾 GLOSSÁRIO CIENTÍFICO EMBRAPA AGROTERMOS ---"]
            for word in matched_term:
                term_data = agrotermos_client.query_term(word)
                if term_data:
                    enrichment_term.append(f"• Termo: {term_data.get('termo')} | Definição: {term_data.get('definicao')}")
            if len(enrichment_term) > 1:
                context += "\n".join(enrichment_term) + "\n-----------------------------------------------------\n"
                logger.info(f"Enriched prompt with Embrapa Agrotermos context: {matched_term}")
        except Exception as e:
            logger.warning(f"Erro ao enriquecer com Agrotermos: {e}")

    # 3. SMARTSOLOS ENRICHMENT
    keywords_soil = ["latossolo", "argissolo", "neossolo", "solo", "terra", "textura"]
    matched_soil = [kw for kw in keywords_soil if (kw in raw_text)]
    if matched_soil:
        try:
            from smartsolos_client import smartsolos_client
            enrichment_soil = ["\n\n--- 🌾 CLASSIFICAÇÃO DE SOLOS EMBRAPA SMARTSOLOS ---"]
            # Detect most probable soil order
            for word in matched_soil:
                if word in ("latossolo", "argissolo", "neossolo"):
                    soil_data = smartsolos_client.classify_soil_profile("Point_01", [{"TEXTURA": word.capitalize()}])
                    if soil_data:
                        enrichment_soil.append(f"• Ordem de Solo SiBCS: {soil_data.get('ordem')} | Descrição: {soil_data.get('descricao')} | Manejo DaaS: {soil_data.get('recomendacoes_daas')} | Nutrição: {soil_data.get('manejo_nutricional')}")
            if len(enrichment_soil) > 1:
                context += "\n".join(enrichment_soil) + "\n-----------------------------------------------------\n"
                logger.info(f"Enriched prompt with Embrapa SmartSolos context: {matched_soil}")
        except Exception as e:
            logger.warning(f"Erro ao enriquecer com SmartSolos: {e}")

    return context


def sales_learnings_context() -> str:
    """🧠 MECANISMO DE AUTO-APRENDIZADO DINÂMICO (Reinforcement Learning Feedback)
    Injeta estatísticas reais de fechamento/perda dos planos recentes no contexto da Task."""
    try:
        import deal_memory
        stats_block = deal_memory.learnings_block(["essencial", "ndvi", "pacote", "profissional", "enterprise", "pulverizacao"])
        if stats_block:
            return (
                "\n\n--- 🧠 AUTO-APRENDIZADO RECENTE (FEEDBACK REAL DO MERCADO) ---\n"
                "O sistema registrou as seguintes respostas e comportamentos reais de clientes recentemente:\n"
                f"{stats_block}\n"
                "Use esses aprendizados para guiar sua conversação e estratégia de vendas. "
                "Se houver perda frequente por preço em um plano, dê mais ênfase na agregação de valor "
                "e no retorno sobre investimento (ROI) de forma consultiva e empática, antes de revelar valores."
            )
    except Exception as e:
        logger.warning(f"Erro ao injetar auto-aprendizado no contexto de vendas: {e}")
    return ""


# ── Mercurius (Agent 4 — Pitch Writer do Motor de Prospecção Geomart) ────────

def write_pitch(lead: dict, enrichment: dict) -> str:
    """Gera o pitch de outbound (Agent 4) para um lead do Motor de Prospecção Geomart.

    lead: dict do geomart_client.py (nome_area, municipio, uf, area_ha, sigef_link, status,
          e opcionalmente cultura_provavel/cultura_area_pct do mapbiomas_client.py).
    enrichment: dict do mercurius_client.py (empresa, cnpj, cnae_descricao, confianca, fontes).
    """
    import asyncio

    fontes_txt = ", ".join(enrichment.get("fontes", [])[:3]) or "nenhuma fonte adicional"

    cultura = lead.get("cultura_provavel")
    cultura_pct = lead.get("cultura_area_pct")
    if cultura and cultura != "Indefinido":
        cultura_txt = f"{cultura} (classificado via MapBiomas em {cultura_pct}% da área real do imóvel — dado concreto, não é suposição regional)"
    else:
        cultura_txt = "não identificada com confiança — não afirme uma cultura específica"

    prompt = (
        "Lead do Motor de Prospecção Geomart:\n"
        f"- Nome do imóvel: {lead.get('nome_area')}\n"
        f"- Município/UF: {lead.get('municipio')}/{lead.get('uf')}\n"
        f"- Área certificada: {lead.get('area_ha')} ha\n"
        f"- Status SIGEF: {lead.get('status')}\n"
        f"- Link público de certificação SIGEF: {lead.get('sigef_link')}\n"
        f"- Cultura provável (MapBiomas): {cultura_txt}\n"
        f"- Empresa identificada (OSINT): {enrichment.get('empresa') or 'não identificada'}\n"
        f"- Confiança da identificação: {enrichment.get('confianca')}\n"
        f"- CNAE/atividade: {enrichment.get('cnae_descricao') or 'desconhecida'}\n"
        f"- Fontes da identificação: {fontes_txt}\n\n"
        "Escreva o pitch de abertura (cold outbound) pronto para WhatsApp, seguindo estritamente "
        "sua persona e as regras de confiança e de cultura provável."
    )
    return asyncio.run(run_department("prospector", prompt))


# ── Runner de departamento ────────────────────────────────────────────────────

async def run_department(agent_name: str, user_msg: str, extra_context: str = "") -> str:
    """Executa um departamento como Crew de agente único (1 Task) e retorna texto puro.

    kickoff_async roda o kickoff síncrono em worker thread — seguro sob o event
    loop do python-telegram-bot / FastAPI.
    """
    task = Task(
        description=f"{user_msg}{extra_context}",
        expected_output=EXPECTED_OUTPUT,
        agent=AGENTS[agent_name],
    )
    crew = Crew(
        agents=[AGENTS[agent_name]],
        tasks=[task],
        process=Process.sequential,
        memory=False,
        cache=False,
        verbose=False,
    )
    result = await crew.kickoff_async()
    return str(result)
