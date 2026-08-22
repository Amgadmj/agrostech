# Registro: Entrega Fabio + AvAg 2026 + Modelo de Parceria "Ecossistema de Carbono"

```yaml
data: "22/08/2026"
owner: "CEO / Head of Sales"
status: "aberto — aguardando follow-ups"
relacionado_a: ["playbooks/PLANO_CONGRESSO_AVAG_2026.md", "knowledge-base/CARBON_CREDITS.md", "okrs/COMPANY_OKRS.md (KR4.1, KR4.3)"]
```

---

## 1. Contexto

Registro consolidado de dois eventos encadeados: (1) entrega e pagamento de um projeto para o cliente **Fabio**, e (2) participação no **Congresso AvAg 2026** (18–20/08, ver playbook dedicado), onde surgiu uma nova frente de negócio em créditos de carbono via conversa com **Tales** (sócio do Fabio) e uma aula sobre um modelo de "ecossistema" de créditos de carbono.

Imagens do evento/aula foram anunciadas pelo usuário para análise complementar — a seção 5 (Observações) deve ser atualizada quando chegarem.

---

## 2. Fatos registrados

- **Projeto Fabio:** entregue e **pago**. Cliente encerrado com sucesso (não consta ainda em `data/clientes_cana.csv` — cadastrar).
- **AvAg 2026:** presença confirmada conforme `playbooks/PLANO_CONGRESSO_AVAG_2026.md`.
- **Tales** (sócio do Fabio): conversa sobre o **evento da Câmara Árabe em 26/08/2026**. Tales foi **convidado** para o evento.
- **Ação pendente:** falar com o **embaixador do Sudão** sobre a participação de Tales / o convite para o evento da Câmara Árabe.
- **Aula de créditos de carbono no AvAg** — modelo de negócio apresentado pelo "ecossistema" formado por **Tropical Carbon** (certificação e registro) + **SafeCarbon** ("safe neutral carbon"):
  - Pega uma terra improdutiva ("do zero") e a transforma em vendedora de créditos de carbono (florestal e agrícola), **sem custo para o proprietário da terra**.
  - **Split oficial (slide "Modelo de Negócio"):** a "Regularização do t(CO₂)e" = **20% no total**, dividida em Assessoria Adm e Operacional 5,0% + Tropical Carbon 5,0% + SafeCarbon 5,0% + Projeto 3,0% + Governança 2,0%.
  - **Fora desses 20%** (linhas separadas na "Previsão de Ganhos"): **Projeto 1,5%** (papel técnico/engenheiro — onde a Agrostech encaixaria) e **Indicação 4,0%** (referral padrão de cliente).
  - Ver detalhamento completo, tabela de "Previsão de Ganhos" (preço-base R$ 5,00/tCO₂e) e exemplo de metodologia MRV (linha de base + estimativa de remoções em 20 anos) em `knowledge-base/CARBON_CREDITS.md` §8.
  - **Nota:** a matemática exata entre o split de 20% e as linhas de Projeto/Indicação não fechou 100% a partir das fotos (coluna final de R$ na Previsão de Ganhos bate com 27,5%, não com a soma simples de 25,5%) — confirmar direto com Tropical Carbon/SafeCarbon antes de levar números a proposta.
- **Fabio concordou em testar** esse modelo (piloto a estruturar).
- **Fotos-fonte do evento** (5 imagens, anexadas em 22/08/2026) salvas em `knowledge-base/decisions/assets/2026-08-22_avag-carbon-class/`:
  1. `01_ecossistemas-parceiros.jpg` — logos Tropical Carbon + SafeCarbon
  2. `02_modelo-de-negocio-split.jpg` — split dos 20% (Regularização do t(CO₂)e)
  3. `03_previsao-de-ganhos.jpg` — tabela de ganhos por escala (ha → tCO₂e → R$)
  4. `04_linha-de-base-mrv.jpg` — exemplo de linha de base de carbono (grid 100×100m)
  5. `05_estimativa-remocoes.jpg` — exemplo de estimativa de remoções em 20 anos, 8 estratos

---

## 3. Leitura estratégica

- Isso é exatamente a oportunidade **"4. Carbono / MRV + regulatório"** do plano do AvAg (§5) e alimenta diretamente **KR4.1** (2 projetos-piloto de MRV de carbono) e **KR4.3** (parceria com certificadora/trader) das OKRs da empresa — hoje ambas em 0%.
- O papel natural da Agrostech nesse ecossistema é o de **"Projeto"** (1,5% — o fornecedor técnico de MRV: drone + NDVI + biomassa + laudo), não o dono da relação comercial com o proprietário da terra nem o vendedor do crédito. Vale validar se dá pra também capturar o **4% de "Indicação"** quando a Agrostech traz o cliente (ex.: o próprio Fabio), acumulando os dois papéis — o que, na escala de exemplo do slide (10 mil ha), já representaria centenas de milhares de reais por projeto.
- Fabio como piloto de teste é uma boa primeira validação de baixo risco: cliente já pago e satisfeito, relação de confiança estabelecida. Falta apenas dimensionar a área/hectares dele para rodar os mesmos números da "Previsão de Ganhos" (§2) em cima do caso real.
- O exemplo de metodologia MRV mostrado na aula (linha de base 100×100m + estimativa de remoções por estrato, buffer de risco de 20%) é compatível com a equação de biomassa que a Agrostech já usa (`CARBON_CREDITS.md` §4) — dá pra usar como checklist/benchmark ao montar o laudo técnico do piloto Fabio.
- A ponta institucional (Tales → Câmara Árabe → embaixador do Sudão) é uma frente separada, de relacionamento/networking internacional — vale não deixar cair a bola no dia 26/08.

---

## 4. Ações / Próximos passos

- [ ] Falar com o embaixador do Sudão sobre Tales antes de 26/08/2026 (dono: a definir)
- [ ] Confirmar presença/logística de Tales no evento da Câmara Árabe (26/08/2026)
- [ ] Confirmar direto com Tropical Carbon/SafeCarbon a reconciliação exata dos percentuais (20% split vs. 27,5% da coluna final de ganhos) antes de usar os números em proposta
- [ ] Levantar a área (ha) da terra do Fabio para rodar os números da "Previsão de Ganhos" (§2) no caso real
- [ ] Desenhar escopo e cronograma do piloto de teste com Fabio (o que a Agrostech entrega no papel de "Projeto"/MRV)
- [ ] Validar se a Agrostech pode acumular o papel de "Indicação" (4%) além do técnico "Projeto" (1,5%) quando ela mesma traz o cliente
- [ ] Cadastrar Fabio em `data/clientes_cana.csv` ou base de clientes equivalente (projeto entregue + pago)
- [ ] Ao fechar o piloto, contar como progresso em **KR4.1** (piloto MRV) e avaliar se Tropical Carbon/SafeCarbon conta como o parceiro de **KR4.3**
- [x] Capturar nome, contato (parcial) e termos formais do "ecossistema" — Tropical Carbon + SafeCarbon, split detalhado (feito nesta atualização com as imagens)
- [x] Atualizar `knowledge-base/CARBON_CREDITS.md` com o modelo de split do ecossistema (feito nesta mesma atualização)
- [x] Atualizar `playbooks/PLANO_CONGRESSO_AVAG_2026.md` com os resultados reais do evento (feito nesta mesma atualização)

---

## 5. Observações

- Nomes confirmados via fotos do evento (22/08/2026): **Tropical Carbon** (certificação/registro) e **SafeCarbon** (safe neutral carbon). Contato comercial direto ainda não capturado.
- A reconciliação matemática entre o split de 20% (§2) e a coluna final de R$ na "Previsão de Ganhos" (27,5% observado vs. 25,5% esperado pela soma simples) não fechou nas fotos — tratar como pendência, não como erro confirmado.
- O exemplo de metodologia MRV (linha de base + estimativa de remoções) mostrado na aula **não é a terra do Fabio** — é um caso de exemplo/genérico usado para ilustrar o método.
- Este é o primeiro registro em `knowledge-base/decisions/` — segue o padrão `[data]_[decisão].md` descrito em `agents/support/knowledge.md`.

---

*Registrado por: Knowledge Agent | Fonte: relato direto do usuário + fotos do evento AvAg 2026 (22/08/2026) | Próxima revisão: quando o piloto Fabio for escopado ou a reconciliação de % for confirmada*
