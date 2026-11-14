# Roteiro de vídeo — Fase 4 (Opção B · AWS ao vivo)

Duração máxima: **15 minutos**. Upload: YouTube ou Vimeo (público ou não listado).  
Público-alvo: avaliador FIAP. Objetivo: provar microsserviços, Saga com falha/compensação, CI/CD → Kubernetes e observabilidade distribuída.

> Gravação e edição ficam com o time. Este documento é só o roteiro + checklist de pré/pós-gravação.

---

## O que o enunciado exige no vídeo

| Bloco obrigatório | Onde no roteiro |
|---|---|
| Fluxo completo de uma OS pelos microsserviços | Bloco 3 |
| Saga Pattern + tratamento de falhas | Bloco 4 |
| Deploy automatizado de ≥1 microsserviço com validação de testes | Bloco 2 |
| Monitoramento e rastreamento dos fluxos distribuídos | Bloco 5 |

---

## Pré-gravação (faça antes de apertar REC)

### Ambiente AWS (Opção B)

- [ ] `infra-db` e `infra-k8s` aplicados (RDS, DynamoDB Billing/Execution, SQS/SNS/DLQ, IRSA, obs).
- [ ] OS, Billing e Execution no EKS; pods Ready; HPA/PDB ok.
- [ ] API Gateway + auth CPF funcionando com JWT sandbox.
- [ ] Mercado Pago **sandbox** configurado (sem credenciais na tela).
- [ ] Duas OSs de demo prontas (ou script para criar rápido): uma para caminho feliz, outra para compensação.
- [ ] Filas e DLQs limpas / profundidade conhecida.
- [ ] Dashboard CloudWatch Fase 4 e X-Ray abertos em abas.
- [ ] Anotar um `correlationId` / `sagaId` de ensaio bem-sucedido.

### Qualidade / CI

- [ ] Pipeline verde recente de pelo menos um serviço (preferência: Billing ou Execution — prova microsserviço novo).
- [ ] Run com lint, testes, cobertura ≥80% (ideal ≥90%), Sonar (se configurado), build, deploy EKS e `rollout status`.
- [ ] Aba do Actions com o job de CD expandido (sem secrets visíveis).
- [ ] Evidência local opcional em segundo plano: `yarn test:phase4` (6 cenários) — útil no encerramento.
- [ ] Abrir `docs/qa/coverage-evidence-fase4.md` ou HTML em `coverage-artifacts/*/lcov-report/` se for mostrar cobertura no vídeo.
- [ ] Collection Fase 4 importada no Postman (`docs/postman/autoservicemanager-fase4.postman_collection.json`).
- [ ] Diagrama Geral aberto (`docs/architecture/diagrams-fase4.md`).

### Segurança na tela

- [ ] Sem `.env`, tokens, access keys, CPF real, cartão ou e-mail pessoal.
- [ ] Usar CPF/e-mail fictícios; mascarar headers `Authorization` se aparecerem.
- [ ] Zoom 110–125%; terminal com fonte legível; IDE sem painéis sensíveis.

### Abas sugeridas (ordem de gravação)

1. Diagrama / PDF / `diagrams-fase4.md`
2. GitHub — lista dos 6 repos
3. Actions — pipeline do serviço escolhido para CD
4. `kubectl get pods -n autoservice` (ou console EKS)
5. Postman / Swagger / terminal (fluxo feliz)
6. Postman / terminal (fluxo de falha)
7. CloudWatch Logs Insights + X-Ray + dashboard
8. Feature BDD / coverage summary (encerramento)

---

## Estrutura temporal (cronômetro)

| Tempo | Bloco | Foco |
|---|---|---|
| 0:00–1:30 | 1 · Contexto | Repos + arquitetura + Saga orquestrada |
| 1:30–3:30 | 2 · CI/CD | Testes + deploy automatizado EKS |
| 3:30–8:00 | 3 · Fluxo feliz | OS → Billing → Execution → ENTREGUE |
| 8:00–11:30 | 4 · Falha / Saga | Compensação + refund + idempotência |
| 11:30–13:45 | 5 · Observabilidade | Logs, X-Ray, dashboard, alarme |
| 13:45–15:00 | 6 · Encerramento | BDD, cobertura, links, fecho |

Se atrasar: encurte Bloco 3 (pule “entrega do veículo” se já mostrou `FINALIZADA`) e Bloco 6 (só 30s). **Não corte** Bloco 2 nem Bloco 4 — são os mais cobrados.

---

## Bloco 1 — Contexto e arquitetura (0:00–1:30)

### Falar (≈45s)

> “Somos o time [nomes]. Nesta Fase 4 refatoramos o Auto Service Manager em microsserviços. Temos três serviços de domínio: OS, Billing e Execution, cada um com repositório, pipeline, imagem e banco próprios. O OS usa MySQL; Billing e Execution usam DynamoDB. A comunicação crítica é assíncrona: comandos via SQS e eventos via SNS. A Saga é **orquestrada** no OS Service, com compensação em caso de falha — por exemplo, reembolso no Mercado Pago se a execução falhar após o pagamento.”

### Mostrar

1. Organização GitHub com os **6 repositórios** (app, billing, execution, auth-lambda, infra-db, infra-k8s).
2. Diagrama de componentes (`diagrams-fase4.md` ou PDF do portal).
3. Em 10s: sequence do caminho feliz (opcional).

### Checklist visual

- [ ] Fica claro: 3+ serviços, SQL+NoSQL, SQS/SNS, orquestração (não coreografia).

---

## Bloco 2 — Qualidade e deploy automatizado (1:30–3:30)

### Falar (≈40s)

> “Cada microsserviço tem CI/CD independente. Neste pipeline vemos lint, testes com cobertura acima de 90%, quality gate Sonar, security gate e build da imagem. Em seguida o CD autentica via OIDC, publica no ECR com tag imutável do commit e aplica o manifesto no EKS. O rollout ficou saudável.”

### Mostrar

1. GitHub Actions do serviço escolhido (Billing ou Execution recomendado).
2. Expandir jobs: `quality` (test:cov), Sonar (se houver), `security`, `cd`.
3. Evidência de deploy:
   - log `kubectl apply` / `rollout status` **verde**, **ou**
   - `kubectl get deploy,pods -n autoservice` com Billing/Execution Ready.
4. (Opcional, 10s) Coverage summary ou badge/print no README.

### Frases de ouro

- “Deploy só após testes.”
- “Tag imutável `github.sha`.”
- “Rollback via `kubectl rollout undo` se o rollout falhar.”

### Evitar

- Abrir secrets do repositório.
- Afirmar Sonar se o step foi skipped (`SONAR_TOKEN` vazio) — diga “configurado no workflow; execução com token no ambiente”.

---

## Bloco 3 — Fluxo completo da OS (3:30–8:00)

### Narrativa guiada

| Passo | Ação na tela | O que dizer |
|---|---|---|
| 1 | Auth CPF → JWT | “Cliente autentica na Lambda; API Gateway injeta o escopo.” |
| 2 | Criar OS | “OS Service persiste no MySQL e inicia a Saga; anoto o `correlationId`.” |
| 3 | Diagnóstico | “Comando SQS para Execution; evento de diagnóstico concluído volta por SNS.” |
| 4 | Orçamento | “Billing gera orçamento no DynamoDB e publica evento.” |
| 5 | Aprovação + pagamento sandbox | “Após aprovação, Billing cria cobrança no Mercado Pago sandbox; webhook confirma.” |
| 6 | Execução / conclusão | “OS dispara execução; Execution conclui; Saga finaliza; status ENTREGUE/FINALIZADA.” |
| 7 | Prova de isolamento | “Consulta rápida: MySQL só na OS; itens Billing/Execution no DynamoDB — sem share de banco.” |

### Dicas de ritmo

- Pré-carregar requests no Postman com variáveis `baseUrl`, `token`, `orderId`, `correlationId`.
- Se algum passo assíncrono demorar >15s, corte para logs filtrados pelo `correlationId` e volte quando o status mudar.
- Mostre **uma** fila SQS ou um atributo SNS só para provar mensageria (não explique toda a infra).

### Evidência mínima obrigatória neste bloco

- [ ] OS criada e status avançando.
- [ ] Pelo menos um salto OS ↔ Billing ↔ Execution visível (API, log ou fila).
- [ ] Pagamento sandbox (ou webhook) associado à OS.
- [ ] Estado final consistente da OS.

---

## Bloco 4 — Saga, falha e compensação (8:00–11:30)

### Falar (abertura)

> “Agora o caminho de falha. A Saga orquestrada precisa compensar: se a execução falha depois do pagamento, o OS emite reembolso; o Billing chama o Mercado Pago; a Saga termina compensada, sem finalizar a OS como sucesso.”

### Sequência na tela

1. Segunda OS já paga (ou avança rápido até pós-pagamento).
2. Injetar falha de execução (`execution.failed` / comando de falha / cenário preparado).
3. Mostrar transição da Saga → pedido de `payment.refund` (log OS ou evento).
4. Mostrar Billing executando refund e evento `refund.completed` / equivalente.
5. Confirmar estado **COMPENSATED** (ou nomenclatura do domínio) — OS **não** vai para FINALIZADA/ENTREGUE de sucesso.
6. **Idempotência:** reenviar o mesmo evento/`messageId` e mostrar que não duplica refund nem muda estado indevidamente.

### Frases de ouro

- “Compensação é ação de negócio, não rollback ACID global.”
- “Idempotência por `messageId` evita cobrança/estorno duplicado.”
- “Timeout de pagamento não inicia execução.” (mencionar se houver tempo)

---

## Bloco 5 — Observabilidade distribuída (11:30–13:45)

### Falar

> “Todo o fluxo propaga `correlationId`. Com ele correlacionamos OS, Billing e Execution nos logs, no X-Ray e no dashboard operacional.”

### Mostrar (nessa ordem)

1. **CloudWatch Logs Insights** — query pelo `correlationId` do fluxo feliz **ou** do de falha; logs dos 3 serviços.
2. **X-Ray** — service map / trace: API Gateway → OS → (SQS) → Billing/Execution → (HTTP Mercado Pago, se aparecer).
3. **Dashboard** — RPS/latência/5xx, duração da Saga, profundidade de filas, DLQ, erros MP/refund (o que estiver instrumentado).
4. **Alarme** (ex.: DLQ > 0) + menção rápida ao runbook (`runbook-fase4.md`).

### Se algo da obs não estiver populado

Mostre o que existir de verdade e diga: “Métricas/traces provisionados na infra Fase 4; aqui o correlationId nos logs dos três serviços.” Não invente painéis vazios como se estivessem ‘verdes’.

---

## Bloco 6 — Encerramento (13:45–15:00)

### Mostrar rápido

1. Swagger de um serviço **ou** collection Postman.
2. Feature BDD `ciclo-os-saga.feature` + resultado `6 scenarios passed` (local ou CI).
3. Índice de entrega / PDF com links dos repos (mesmo que o vídeo ainda vá ser colado depois).

### Falar (fecho)

> “Entrega Fase 4: três microsserviços com banco próprio, Saga orquestrada com compensação, integração Mercado Pago sandbox, pipelines com deploy no EKS e rastreio por correlationId. Documentação, ADRs e evidências de cobertura estão nos repositórios e no PDF do portal. Obrigado.”

---

## Plano B se o ambiente AWS falhar na hora

| Falha | Contingência (ainda alinhada ao enunciado) |
|---|---|
| CD OIDC / EKS indisponível | Mostrar pipeline CI completo + run anterior verde de deploy (Actions history) + `kubectl` de ensaio gravado em take separado |
| Mercado Pago sandbox fora | Usar mock documentado + explicar contrato webhook; não fingir produção |
| X-Ray sem spans | Priorizar Logs Insights por `correlationId` nos 3 serviços |
| Fluxo E2E lento | Usar OS pré-aquecida; pular passos já evidenciados em log |

Grave takes curtos por bloco; edite na ordem do cronômetro. Prefira 14 min limpos a 15 min corridos.

---

## Checklist pós-gravação

- [ ] Duração ≤ 15:00.
- [ ] Os 4 blocos obrigatórios do enunciado aparecem com clareza.
- [ ] Nenhum segredo/PII na imagem ou áudio.
- [ ] Upload YouTube/Vimeo; link **não listado** ou público.
- [ ] Colar o link no PDF do portal (`portal-entrega-fase4.md`).
- [ ] Conferir se os 6 repos do vídeo estão públicos (ou acessíveis ao avaliador).

---

## Texto-cola (teleprompter — versão curta)

Use se preferir ler; ajuste nomes/RM.

1. *Abertura:* time + 3 microsserviços + MySQL/DynamoDB + SQS/SNS + Saga orquestrada no OS.  
2. *CI/CD:* pipeline → testes/cobertura/Sonar → ECR → EKS → rollout ok.  
3. *Feliz:* auth → OS → diagnóstico → orçamento → pagamento sandbox → execução → finalizada; bancos isolados.  
4. *Falha:* execução falha pós-pagamento → refund → Saga compensada → replay idempotente.  
5. *Obs:* correlationId em logs, X-Ray, dashboard, alarme DLQ.  
6. *Fecha:* BDD, cobertura, repos + PDF; obrigado.
