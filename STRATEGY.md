# Vance Expert — Estratégia (beachhead-first)

> Recuamos da tese "flexível a tudo". Princípio: **motor flexível (já temos) + lança estreita**.
> Entra-se estreito, vira referência, gera receita, e só então expande. Sequência é tudo.

## 1. Beachhead (a aposta)
- **ICP (cliente ideal):** PME de **serviços B2B** (agências, consultorias, clínicas, escritórios) com **volume relevante de contas a pagar/receber** (boletos e NFs), 1–5 CNPJs, 3–15 pessoas, hoje vivendo de **planilha + contador**.
- **Workflow matador:** *"Importou, conciliou, previu o caixa — sem digitar."*
  IA lê boleto/NF → cria o lançamento → concilia com o extrato → atualiza o fluxo de caixa.
- **Posicionamento (1 linha):** "Pare de digitar lançamento e conciliar na unha. O Vance lê seus boletos e notas, concilia o extrato e mostra seu caixa — automático."
- **Canal (Fase 0):** self-service direto (já construído), mantendo `1 usuário = 1 tenant`. Sem refactor agora.
- **Integração (Fase 0):** **OFX/CNAB upload** (já existe na Conciliação) para validar conciliação sem depender de agregador. Pluggy fica para a Fase 1.

## 2. Sequência (land-and-expand)
- **Fase 0 — Validar (0–30 dias):** 5–10 design partners do ICP usando semanalmente. **Zero feature nova grande.** Provar workflow + disposição a pagar.
- **Fase 1 — Escalar canal (30–90 dias):** *se validado* → **Pluggy** (extrato automático) + **canal de contador** + **tenancy multi-tenant-por-usuário** + preço firme.
- **Fase 2 — Ampliar (90 dias+):** mais bancos/ERPs e workflows. A "flexibilidade a tudo" entra **aqui**, como recompensa do foco.

## 3. Plano de validação de 30 dias
- **Meta:** 5–10 PMEs do ICP ativando e voltando; sinal claro de WTP.
- **Recrutar:** rede pessoal, 1–2 contadores parceiros, comunidades de PME, outreach LinkedIn. Oferecer trial estendido + onboarding 1:1.
- **Medir:**
  - **Ativação:** importou + conciliou ≥10 lançamentos na 1ª semana.
  - **Retenção:** voltou na semana 2.
  - **WTP:** "pagaria R$X/mês?" (testar âncoras 99/299).
  - **Acurácia IA percebida** (erros corroem confiança rápido).
- **Sucesso (segue):** ≥40% ativam e voltam na semana 2; ≥30% topam o preço-alvo; acurácia aceitável.
- **Pivot/kill:** se quase ninguém ativa/volta → o wedge está errado; repensar **antes** de gastar mais build.

## 4. Métricas a instrumentar agora
Funil: signup → ativação → retenção(s2) → trial→pago → churn, **por canal**, + acurácia IA.
- Já temos `usage_events` (ai_import, transaction) e MRR no backoffice.
- **Adicionar:** evento `reconciled` (conciliação concluída) e um painel de **ativação/conversão** no backoffice.

## 5. Produto: o que muda AGORA (barato, focado)
- **Onboarding** que leva direto ao workflow matador: "importe seu 1º boleto/NF".
- **Endurecer** o fluxo OFX/CNAB → conciliação (já existe; garantir que é sólido e óbvio).
- **Evento de ativação** (`reconciled`) + painel de funil.
- Mensagem do site/app focada **no wedge** (não em "gestão completa").

## 6. O que NÃO construir agora (recuo do "tudo")
- Integrações REST banco-a-banco bespoke (vai por Pluggy na Fase 1).
- Multi-tenant-por-usuário / canal contador (Fase 1, só após validar).
- Billing avançado, relatórios extras, features fora do wedge.
- Qualquer banco/ERP que o ICP não usa de fato.

## 7. Preço durante a validação
Manter 99/299/799 como **âncora de conversa**, não como verdade. O objetivo da Fase 0 é **descobrir** o preço, não cravá-lo. Travar preço só na Fase 1.

## 8. Decisões travadas (CEO, 2026-06-28)
1. **ICP:** Serviços B2B ✅
2. **Canal Fase 1:** sem parceiros ainda; **prospectar contadores** na Fase 1.
3. **Extrato Fase 1:** **Pluggy** (CEO abre conta + passa credenciais quando chegarmos lá).
