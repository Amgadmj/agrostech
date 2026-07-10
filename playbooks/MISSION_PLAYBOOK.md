# Playbook de Missão de Campo — Agrostech

> **Audiência:** Chief Pilot + Field Pilot + COO
> **Atualizado:** Junho 2026

---

## Visão Geral da Missão

```
BRIEFING → AUTORIZAÇÃO → SETUP DE CAMPO → VOO → COLETA → DADOS → PROCESSAMENTO
    1            2              3           4       5         6          7
```

**Tempo médio de missão (500 ha):** 4–6 horas de campo
**Tempo de entrega após missão:** ≤ 24h processamento + ≤ 24h QA = ≤ 48h total

---

## D-7: Planejamento da Missão (Chief Pilot)

### 1. Recebimento do Briefing do COO
- [ ] Dados do cliente: nome, fazenda, coordenadas GPS da propriedade
- [ ] Tipo de missão: ortofoto/NDVI/MDE/MRV carbono
- [ ] Área estimada (ha) e formato da propriedade
- [ ] Data solicitada pelo cliente (confirmar viabilidade)
- [ ] Cultura e fase de crescimento (impacta parâmetros de voo)

### 2. Planejamento de Rota (DroneDeploy / Pix4D)
- [ ] Importar shapefile ou traçar área no software
- [ ] Definir altitude de voo (padrão: 80m AGL para 3cm GSD com Matrice 300)
- [ ] Configurar sobreposição: 80% frontal / 70% lateral (mínimo)
- [ ] Estimar tempo de voo e número de baterias necessárias
- [ ] Identificar ponto de decolagem seguro e zona de pouso

### 3. Definição de GCPs
- [ ] Calcular número de GCPs: mínimo 5 para até 500 ha, +1 a cada 200 ha
- [ ] Planejar distribuição: bordas + centro da área
- [ ] Verificar se o cliente tem GNSS RTK ou se levaremos o nosso

### 4. Solicitação DECEA (D-5 no mínimo)
- [ ] Acessar SARPAS: https://sarpas.decea.mil.br
- [ ] Preencher dados: localização, altitude, data/hora, tipo de aeronave
- [ ] Aguardar autorização (prazo: 3–5 dias úteis)
- [ ] Salvar comprovante de autorização

---

## D-1: Preparação de Equipamento (Chief Pilot + Field Pilot)

### Checklist de Drone (Matrice 300 RTK)
- [ ] Baterias carregadas (100%) — quantidade calculada para a missão
- [ ] Hélices verificadas (sem trincas, presas corretamente)
- [ ] Câmera limpa e calibrada
- [ ] Firmware atualizado (DJI Pilot 2)
- [ ] Smart Controller carregado
- [ ] Cartão SD formatado e com espaço suficiente

### Checklist de Sensor (Micasense RedEdge — para NDVI)
- [ ] Calibração radiométrica verificada (com painel de calibração)
- [ ] Sincronização com GPS confirmada

### Equipamentos de Campo
- [ ] GCPs (alvos de lona) — quantidade calculada
- [ ] GNSS RTK (para coordenar os GCPs)
- [ ] HD externo para backup de dados no campo
- [ ] Tablet com plano de missão carregado offline
- [ ] Colete de segurança, chapéu, protetor solar
- [ ] Extintor portátil de incêndio

---

## Dia D: Execução da Missão (Field Pilot)

### Check-in no Campo (30min antes)
- [ ] Verificar condições meteorológicas in loco (vento, chuva, visibilidade)
- [ ] Cancelar se: vento > 8 m/s, chuva, trovoada, visibilidade < 3 km
- [ ] Confirmar com o proprietário a área a ser voada
- [ ] Ligar para o Chief Pilot: confirmação de início de missão

### Setup dos GCPs
- [ ] Posicionar alvos nos pontos planejados
- [ ] Coletar coordenadas de cada GCP com GNSS RTK
- [ ] Fotografar cada GCP em posição com câmera do celular (para referência)
- [ ] Registrar coordenadas em planilha de campo

### Pré-Voo (PCAS — Pilot Checklist After Setup)
- [ ] Drone ligado e IMU calibrado
- [ ] GPS fix ≥ 15 satélites
- [ ] RTK ativo e conectado (quando disponível)
- [ ] Plano de missão carregado no DJI Pilot 2
- [ ] Altitude confirmada (120m AGL máximo, salvo autorização especial)
- [ ] Área limpa de pessoas e obstáculos no raio de voo

### Durante o Voo
- [ ] Monitorar telemetria (bateria, altitude, velocidade, sinal)
- [ ] Manter linha de visada visual (VLOS) com o drone a todo momento
- [ ] Trocar bateria quando atingir 30% (não esperar o alarme)
- [ ] Registrar hora de início/fim de cada bateria no log

### Pós-Voo Imediato
- [ ] Verificar count de imagens: comparar com estimado pelo software
- [ ] Verificar cobertura: spot check de lacunas no DroneDeploy/Pix4D
- [ ] Transferir todas as imagens para HD externo IMEDIATAMENTE
- [ ] Fazer backup em segundo HD ou nuvem (quando disponível)
- [ ] Preencher log de voo (hora, baterias, condições, anomalias, observações)
- [ ] Fotografar condições do campo, sombras, obstáculos relevantes

---

## Pós-Missão: Entrega de Dados

### Field Pilot → Data Processing
```
[WhatsApp/Mensagem interna]

✅ MISSÃO CONCLUÍDA — [Nome da Fazenda]
Data/hora: [DATA] [HORA INÍCIO]–[HORA FIM]
Área voada: [X] ha
Imagens coletadas: [N] imagens ([RGB] + [multiespectral se houver])
GCPs: [N] pontos, coordenadas em: [arquivo]
Anomalias: [descrever ou "nenhuma"]
Dados disponíveis em: [caminho do HD / link de upload]
```

---

## Protocolos de Segurança

### Cancelamento de Missão
**Cancele imediatamente se:**
- Vento sustentado > 8 m/s
- Chuva ou ameaça de trovoada no radar de 30 min
- Visibilidade < 3 km
- Drone com comportamento anômalo (vibração, GPS fraco)
- Pessoa ou animal não autorizado na área de voo

### Incidente de Voo (perda, colisão, anomalia)
1. Garantir segurança das pessoas primeiro
2. Ligar imediatamente para o Chief Pilot
3. Não mover destroços (preservar evidências)
4. Fotografar a cena
5. Preencher relatório de incidente (ver `INCIDENT_RESPONSE.md`)
6. COO notifica o cliente do atraso

---

*Playbook de Missão Agrostech v1.0 | Chief Pilot Owner | Aprovado: COO*
