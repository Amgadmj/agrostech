# Base de Conhecimento: Créditos de Carbono
### Agrostech — Domínio ESG & MRV

---

## 1. Conceitos Fundamentais

### O que é um Crédito de Carbono?
Um crédito de carbono equivale a **1 tonelada de CO₂ equivalente (tCO₂e)** removida da atmosfera, evitada ou sequestrada. É um ativo que pode ser comprado por empresas que querem compensar suas emissões.

### Diferença: Mercado Voluntário vs. Mercado Regulado

| Característica | Voluntário | Regulado (Brasil) |
|---------------|-----------|------------------|
| Obrigatoriedade | Empresas por ESG/reputação | Obrigatório por lei |
| Padrões | Verra VCS, Gold Standard | Marco Legal do Carbono (Lei 15.042/2024) |
| Verificação | Certificadoras acreditadas | Órgão governamental |
| Preço médio | US$ 5–50/tCO₂e | A definir (mercado em formação) |
| Exemplo Brasil | REDD+ de fazenda | CBIOs (RenovaBio — biocombustível) |

---

## 2. Mercado Voluntário — Padrões Relevantes

### Verra VCS (Verified Carbon Standard)
- **Website:** https://verra.org
- **Registro:** Verra Registry
- **Metodologias relevantes para Agrostech:**
  - **VM0009** — Metodologia para evitar desmatamento em projetos de REDD+
  - **VM0015** — Metodologia para melhoria de manejo florestal
  - **VM0042** — Metodologia de práticas de manejo de terra melhoradas (IFM)
- **Processo:** Desenvolvimento do Documento de Descrição do Projeto (PDD) → Validação → Monitoramento → Verificação → Emissão de VCUs (Verified Carbon Units)

### Gold Standard
- **Website:** https://www.goldstandard.org
- Foco em co-benefícios (SDGs além do carbono)
- Mais rigoroso que Verra, preço médio maior
- Relevante para projetos com comunidades rurais

### CBIOS (RenovaBio)
- **Órgão:** ANP (Agência Nacional do Petróleo)
- Crédito de descarbonização para biocombustíveis
- Negociado na B3
- Menos diretamente aplicável ao agro, mas relevante para usinas de cana

---

## 3. REDD+ — Redução de Emissões por Desmatamento e Degradação

### O que é REDD+?
Mecanismo que remunera países e proprietários por **evitar o desmatamento** e degradação florestal. O "+" inclui conservação de estoques de carbono, manejo sustentável e aumento de estoques.

### Quem pode gerar créditos REDD+ no agronegócio?
- Fazendas com **Reserva Legal** preservada
- Propriedades com **APP** (Área de Proteção Permanente) conservada
- Fazendas em regiões com pressão de desmatamento documentada

### Requisitos básicos para projeto REDD+
1. **Additionality:** O projeto deve ir além do que a lei já exige
2. **Permanence:** O carbono deve ser mantido por ≥ 30 anos
3. **Leakage:** O desmatamento não pode ser deslocado para outra área
4. **Baseline:** Estabelecer o cenário de referência (quanto desmatamento teria ocorrido sem o projeto)

---

## 4. MRV — Monitoramento, Reporte e Verificação

### Definição
Processo técnico-científico de medir e documentar o carbono sequestrado/evitado em uma propriedade rural. É o produto principal da Agrostech no segmento ESG.

### Como o Drone entra no MRV

| Métrica de Carbono | Como o Drone Mede |
|-------------------|------------------|
| Cobertura vegetal (%) | Ortofoto + classificação de imagem |
| Mudança de uso da terra | Ortofoto multitemporal (comparação) |
| Biomassa acima do solo (AGB) | NDVI + modelos alométricos + LiDAR |
| Estoque de carbono (tCO₂e/ha) | AGB × fator de conversão IPCC (0,47) |
| Área de Reserva Legal conservada | Ortofoto + shapefile georreferenciado |

### Equação simplificada de biomassa
```
AGB (t/ha) = a × (NDVI^b)  → coeficientes variam por bioma/cultura

Carbono (tCO₂e/ha) = AGB × 0,47 × 3,67
```

### Documentos do MRV Agrostech
1. **Relatório de Baseline** — linha de base do carbono atual
2. **Mapa de cobertura vegetal** (shapefile + ortofoto)
3. **Estimativa de biomassa** (raster + tabela por talhão)
4. **Relatório de monitoramento periódico** (anual ou biannual)
5. **Laudo técnico para certificadora** (formato específico por padrão)

---

## 5. Marco Legal do Carbono no Brasil (Lei 15.042/2024)

### Principais Pontos
- Institui o **Sistema Brasileiro de Comércio de Emissões (SBCE)**
- Divide em: mercado regulado (SBCE) + mercado voluntário
- Estabelece o **Registro Público Nacional** de créditos de carbono
- Propriedade do crédito: pertence ao proprietário da terra/floresta
- Vigência: implementação gradual 2024–2027

### Impacto para a Agrostech
- Cria demanda crescente por MRV de qualidade no Brasil
- Valoriza dados geoespaciais verificáveis (drone > satélite para escala de propriedade)
- Oportunidade de posicionar Agrostech como empresa MRV certificada

---

## 6. Calendário do Mercado de Carbono no Brasil

| Marco | Data |
|-------|------|
| Publicação da Lei 15.042/2024 | Outubro 2024 |
| Decreto regulamentador esperado | 2025 |
| Início do SBCE (mercado regulado) | Previsto 2027 |
| Mercado voluntário ativo hoje | Imediato (Verra/GS) |

---

## 7. Parceiros e Stakeholders Relevantes

| Organização | Papel |
|------------|-------|
| Verra | Certificação de créditos VCS |
| Gold Standard | Certificação com co-benefícios SDG |
| Aliança da Terra | ONG que apoia produtores com crédito de carbono |
| Biofílica Ambipar | Empresa brasileira de carbono (trader/desenvolvedor) |
| South Pole | Trader internacional com presença no Brasil |
| MCTI | Ministério de Ciência: política de carbono |
| IBAMA | Licenciamento e laudos ambientais |

---

## 8. Modelo de Parceria "Ecossistema" — aprendido no AvAg 2026

**Fonte:** aula sobre créditos de carbono assistida no Congresso AvAg 2026 (18–20/08). Ver registro completo em `knowledge-base/decisions/2026-08-22_fabio-avag-ecossistema-carbono.md`.

Modelo de negócio de um "ecossistema" (nome formal da organização ainda não capturado) que converte terra improdutiva em vendedora de créditos de carbono, **sem custo para o proprietário da terra**. O ecossistema assume o desenvolvimento do projeto (PDD, registro, certificação, comercialização) e reparte a receita:

| Parte | % da receita |
|---|---|
| Ecossistema (plataforma/operador) | 20% |
| Engenheiro do projeto (papel técnico/MRV) | 1,5% |
| Indicação padrão de cliente (referral) | 4% |

**Onde a Agrostech encaixa:** no papel de **engenheiro do projeto** (MRV — drone, NDVI, biomassa, laudo técnico), com possibilidade de acumular o papel de **indicação** quando ela mesma traz o proprietário da terra como cliente (ex.: caso Fabio, piloto de teste em estruturação).

**Status:** piloto de teste acordado com um cliente (Fabio) em 22/08/2026 — escopo e cronograma ainda a desenhar. Contribui diretamente para **KR4.1** (2 projetos-piloto de MRV de carbono) e potencialmente **KR4.3** (parceria com certificadora/trader), das OKRs da empresa.

---

## 9. Glossário de Carbono

| Termo | Definição |
|-------|-----------|
| **tCO₂e** | Tonelada de CO₂ equivalente |
| **AGB** | Acima-Ground Biomass — biomassa acima do solo |
| **VCU** | Verified Carbon Unit — unidade Verra |
| **PDD** | Project Design Document — documento de projeto |
| **Additionality** | O projeto vai além do que a lei exige |
| **Permanence** | Garantia de que o carbono não será liberado |
| **Leakage** | Vazamento — desmatamento deslocado para outra área |
| **Baseline** | Cenário de referência sem o projeto |
| **Registry** | Plataforma de registro e transação de créditos |
| **REDD+** | Reducing Emissions from Deforestation and Degradation |
| **SBCE** | Sistema Brasileiro de Comércio de Emissões |

---

*Base de Conhecimento — Créditos de Carbono v1.1*
*Última atualização: 22/08/2026 | Owner: Knowledge Agent*
*Próxima revisão: quando houver atualização do decreto regulamentador do SBCE, ou quando o piloto com Fabio avançar*
