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
| **Tropical Carbon** | Certificação e registro de créditos de carbono — parceiro do "ecossistema" apresentado no AvAg 2026 (ver §8) |
| **SafeCarbon** ("safe neutral carbon") | Parceiro de neutralização/comercialização de carbono — junto à Tropical Carbon, forma o "ecossistema" do AvAg 2026 (ver §8) |

---

## 8. Modelo de Parceria "Ecossistema" — Tropical Carbon + SafeCarbon (AvAg 2026)

**Fonte:** aula sobre créditos de carbono assistida no Congresso AvAg 2026 (18–20/08), com prints das telas de apresentação. Ver registro completo (incluindo as fotos-fonte) em `knowledge-base/decisions/2026-08-22_fabio-avag-ecossistema-carbono.md`.

**Parceiros do "ecossistema":** **Tropical Carbon** (certificação e registro) + **SafeCarbon** ("safe neutral carbon"). Modelo de negócio: converte terra improdutiva em vendedora de créditos de carbono (florestal e agrícola), **sem custo para o proprietário da terra** — o ecossistema assume PDD, registro, certificação e comercialização.

### 8.1 Split do "Modelo de Negócio" (slide oficial)

A "Regularização do t(CO₂)e" — o corte total do ecossistema — é **20%**, dividido internamente assim:

| Componente (dentro dos 20%) | % da receita |
|---|---|
| Assessoria Adm e Operacional | 5,0% |
| Tropical Carbon | 5,0% |
| SafeCarbon | 5,0% |
| Projeto | 3,0% |
| Governança | 2,0% |
| **Total (Regularização do t(CO₂)e)** | **20,0%** |

**Fora desses 20%**, a apresentação também traz duas linhas de remuneração adicionais (é aqui que a Agrostech entra):

| Parte | % da receita |
|---|---|
| **Projeto** (papel técnico/engenheiro do projeto — onde a Agrostech encaixaria, MRV) | 1,5% |
| **Indicação** (referral padrão de cliente) | 4,0% |

> ⚠️ Nota de precisão: a foto da tabela "Previsão de Ganhos" (§8.2) mostra uma coluna final de R$ que equivale a **27,5%** do valor bruto do projeto — não bate com uma soma simples de 20% + 1,5% + 4% (25,5%). A reconciliação exata dos percentuais não ficou 100% legível/clara nas fotos do evento. **Confirmar diretamente com Tropical Carbon/SafeCarbon antes de usar esses números em qualquer proposta comercial.**

### 8.2 Exemplo de "Previsão de Ganhos" (slide oficial, preço-base R$ 5,00/tCO₂e)

| Ha | tCO₂e | Valor bruto (R$ 5,00/tCO₂e) | Projeto (1,5%) | Indicação (4,0%) | Total comissão (R$) |
|---|---|---|---|---|---|
| 284,80 | 32.517,61 | R$ 162.588,05 | R$ 2.438,82 | R$ 6.503,52 | R$ 44.711,71 |
| 1.009,58 | 189.269,72 | R$ 946.348,60 | R$ 14.195,23 | R$ 37.853,94 | R$ 260.245,87 |
| 3.021,82 | 547.895,54 | R$ 2.739.477,70 | R$ 41.092,17 | R$ 109.579,11 | R$ 753.356,37 |
| 10.068,20 | 2.127.462,52 | R$ 10.637.312,60 | R$ 159.559,69 | R$ 425.492,50 | R$ 2.925.260,97 |
| 160.442,49 | 34.633.309,49 | R$ 173.166.547,45 | R$ 2.597.498,21 | R$ 6.926.661,90 | R$ 47.620.800,55 |

### 8.3 Exemplo de metodologia MRV usado na aula (referência, não é o caso Fabio)

Slide de exemplo (não identificado como sendo a terra do Fabio) mostrando a linha de base de carbono de uma propriedade de **9.735,07 ha**, com grid de amostragem de 100×100 m (9.738 células), estoque médio de 11,31 tonC/ha (mín. 1,02, máx. 79,86 tonC/ha). Projeção de remoções em 20 anos por 8 estratos (área 181 a 6.780 ha por estrato), somando **584.435 tonC** de potencial → **2.144.879 tCO₂e** (fator 3,67) → **1.715.903 tCO₂e** após buffer de risco de −20% → **85.795,15 tCO₂e/ano** de remoção média ao longo de 20 anos. Essa é uma boa referência de metodologia (bate com a equação de biomassa já documentada em §4) — pode servir de benchmark para o dimensionamento do piloto com o Fabio assim que a área dele for definida.

**Onde a Agrostech encaixa:** no papel de **"Projeto"** (engenheiro/técnico de MRV — drone, NDVI, biomassa, laudo técnico), com possibilidade de acumular o papel de **"Indicação"** quando ela mesma traz o proprietário da terra como cliente (ex.: caso Fabio, piloto de teste em estruturação).

**Status:** piloto de teste acordado com um cliente (Fabio) em 22/08/2026 — escopo, área e cronograma ainda a desenhar. Contribui diretamente para **KR4.1** (2 projetos-piloto de MRV de carbono) e potencialmente **KR4.3** (parceria com certificadora/trader), das OKRs da empresa.

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
