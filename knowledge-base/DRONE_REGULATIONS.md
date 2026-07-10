# Base de Conhecimento: Regulamentação de Drones no Brasil
### Agrostech — Domínio Legal & Compliance

---

## 1. Órgãos Reguladores

| Órgão | Papel | Site |
|-------|-------|------|
| **ANAC** | Habilitação de pilotos, registro de aeronaves RPAS | www.gov.br/anac |
| **DECEA** | Autorização de espaço aéreo, gestão de tráfego | www.decea.mil.br |
| **IBAMA** | Operações em Unidades de Conservação | www.gov.br/ibama |
| **MAPA** | Aplicação aérea de defensivos | www.gov.br/agricultura |

---

## 2. Regulamentação ANAC

### RBAC-E nº 94 / Instrução Normativa nº 86/2021
Principal regulamentação de RPAS (Remotely Piloted Aircraft Systems) no Brasil.

### Classes de Aeronaves RPAS

| Classe | Peso máximo de decolagem | Requisitos |
|--------|--------------------------|-----------|
| **Classe 3** | ≤ 250g | Apenas cadastro no SISANT |
| **Classe 2** | 250g a 25kg | Cadastro SISANT + habilitação de piloto |
| **Classe 1** | > 25kg | Certificação aeronáutica completa |

**Drones Agrostech:**
- DJI Matrice 300 RTK (≈ 6,3 kg com payload) → **Classe 2**
- DJI Phantom 4 Multispectral (≈ 1,5 kg) → **Classe 2**

### Habilitação de Piloto (Classe 2 — Categoria Específica)
- Aprovação em exame teórico na ANAC (online)
- Treinamento prático documentado
- Validade: 5 anos (renovação por reciclagem)
- Habilitação deve cobrir o tipo de operação: **BVLOS não autorizado** → apenas VLOS

### SISANT — Sistema de Aeronaves Não Tripuladas
- Cadastro obrigatório para drones Classe 2 e 3
- URL: https://sistemas.anac.gov.br/sisant
- Renovação anual

---

## 3. Regulamentação DECEA

### ICA 100-40 — Sistemas de Aeronaves Remotamente Pilotadas
Define como solicitar autorização para operar no espaço aéreo brasileiro.

### SARPAS — Sistema de Autorização para RPAS
- **URL:** https://sarpas.decea.mil.br
- Solicitação mínima: **5 dias úteis antes** da operação
- Gratuito para operações padrão
- Necessário para toda operação comercial

### Tipos de Espaço Aéreo e Restrições

| Classe | Descrição | Necessita autorização? |
|--------|-----------|----------------------|
| G | Espaço aéreo não controlado (< 120m AGL, zona rural) | Apenas SARPAS |
| D/E | Próximo a aeroportos (CTR) | DECEA + controle de área |
| Área de Exclusão | Bases militares, palácio, eventos | Proibido ou muito restrito |

### Altitude Máxima
- **120 metros AGL** (Above Ground Level) sem autorização especial
- Para acima de 120m: solicitação específica no SARPAS com justificativa

### Condições Operacionais (sem aprovação adicional)
- Voo apenas durante o **dia** (entre o nascer e o pôr do sol)
- VLOS obrigatório (linha de visada visual)
- Distância mínima de pessoas não envolvidas: 30m

---

## 4. Zonas de Restrição Relevantes ao Agronegócio

### Restrições Comuns no Campo
- **Próximo a cidades:** verificar raio de CTR de aeroportos municipais
- **Linhas de transmissão:** manter distância ≥ 30m
- **Rodovias federais:** voo sobre rodovias requer autorização específica
- **Reservatórios e usinas hidrelétricas:** restrição de segurança nacional

### Como Verificar Antes de uma Missão
1. Mapa do DECEA: https://www.decea.mil.br/?i=espaco-aereo
2. App AISWEB para NOTAMs
3. DJI Fly Safe Map (referência, não substitui autorização oficial)

---

## 5. Seguros Obrigatórios e Recomendados

| Seguro | Obrigatoriedade | Cobertura típica |
|--------|----------------|-----------------|
| Responsabilidade Civil RPAS | Recomendado (não obrigatório por lei, mas exigido por contratos corporativos) | Danos a terceiros |
| Casco RPAS | Opcional | Dano/perda do drone |
| Responsabilidade Civil Geral | Recomendado para empresa | Operação comercial |

**Seguradora referência:** Tokio Marine, HDI, Allianz (oferecem produto específico para RPAS)

---

## 6. Operação em Propriedades Rurais — Aspectos Práticos

### Autorização do Proprietário
- Voar em propriedade privada **requer autorização** do dono/arrendatário
- Incluir no contrato de serviço: cláusula de autorização de uso do espaço aéreo
- Para APP/RL: verificar se há restrição de Ibama ou órgão ambiental estadual

### Dados e LGPD
- Imagens aéreas de propriedades rurais contêm dados de localização (dados pessoais/sensíveis)
- Base legal para coleta: **contrato de prestação de serviços**
- Retenção: definida em política de dados (recomendado: 5 anos)
- Não compartilhar imagens de terceiros sem autorização expressa

---

## 7. Checklist de Conformidade por Missão

```
☐ Autorização SARPAS obtida e salva
☐ NOTAM verificado para área e data
☐ Piloto com habilitação ANAC válida
☐ Drone com cadastro SISANT ativo
☐ Autorização escrita do proprietário da área
☐ Seguro RPAS vigente
☐ Condições meteorológicas dentro dos limites
☐ Operação VLOS (linha de visada visual)
☐ Altitude ≤ 120m AGL (ou autorização especial)
☐ Distância ≥ 30m de pessoas não envolvidas
```

---

## 8. Penalidades e Infrações

| Infração | Penalidade |
|---------|-----------|
| Voo sem autorização DECEA | Multa até R$ 50.000 + interdição |
| Piloto sem habilitação | Multa + apreensão do drone |
| Voo próximo a aeroporto sem autorização | Crime aeronáutico + multa |
| Invasão de espaço aéreo controlado | Responsabilidade civil e criminal |

---

*Base de Conhecimento — Regulamentação de Drones BR v1.0*
*Última atualização: Junho 2026 | Owner: Knowledge Agent + Legal*
*Próxima revisão: verificar atualizações ANAC/DECEA a cada 6 meses*
