# Mapeamento: validações de `StatusOs` nos use cases (AutoServiceManager)

**Objetivo:** inventariar onde o fluxo da OS valida estado antes de mutar e documentar o uso centralizado do `OrderStatusService`.

**Enum fonte (`prisma/schema.prisma`):** `RECEBIDA`, `EM_DIAGNOSTICO`, `AGUARDANDO_APROVACAO`, `EM_EXECUCAO`, `FINALIZADA`, `ENTREGUE`, `REJEITADA`.

---

## 1. Inventário por use case

| Use case | Arquivo | Valida status? | Regra (estado atual) | Exceção HTTP | Estado alvo da mutação |
|----------|---------|----------------|----------------------|--------------|-------------------------|
| Criar OS | `criar-ordem-servico.use-case.ts` | Não (criação) | — | — | Sempre `RECEBIDA` |
| Iniciar diagnóstico | `iniciar-diagnostico.use-case.ts` | Sim | `OrderStatusService.assertStatusAtual({ allowedFrom: [RECEBIDA] })` | `409 Conflict` | `EM_DIAGNOSTICO` |
| Gerar orçamento | `gerar-orcamento.use-case.ts` | Sim | `OrderStatusService.assertPodeGerarOrcamento(status)` — `[RECEBIDA, EM_DIAGNOSTICO, AGUARDANDO_APROVACAO]` | `409 Conflict` | `AGUARDANDO_APROVACAO` (idempotente se já estava) |
| Aprovar / rejeitar orçamento | `aprovar-orcamento.use-case.ts` | Sim | `OrderStatusService.assertPodeAprovarOuRejeitarOrcamento(status)` — `AGUARDANDO_APROVACAO` | `409 Conflict` | `REJEITADA` ou `EM_EXECUCAO` |
| Finalizar OS | `finalizar-os.use-case.ts` | Sim | `OrderStatusService.assertStatusAtual({ allowedFrom: [EM_EXECUCAO] })` | `409 Conflict` | `FINALIZADA` |
| Entregar veículo | `entregar-veiculo.use-case.ts` | Sim | `OrderStatusService.assertStatusAtual({ allowedFrom: [FINALIZADA] })` | `409 Conflict` | `ENTREGUE` |
| Consultar status (público) | `consultar-status-os.use-case.ts` | Não | Apenas `carregarOrdemServicoComValidacaoPublica` (CPF/placa) | — | Leitura |
| Obter OS (interno) | `obter-ordem-servico.use-case.ts` | Não | — | — | Leitura |
| Listar OS | `listar-ordens-servico.use-case.ts` | Não | — | — | Leitura |
| Listar histórico | `listar-historico-os.use-case.ts` | Não | Só existência da OS | — | Leitura |

**Helper:** `ordem-servico-public-access.ts` valida **identidade** (CPF/CNPJ ou placa), não transição de status.

---

## 2. Grafo de transições implementadas

Transições **implementadas** no código de aplicação:

```text
RECEBIDA ──(criar)──► (entrada)
RECEBIDA ──(iniciar diagnóstico)──► EM_DIAGNOSTICO
RECEBIDA / EM_DIAGNOSTICO / AGUARDANDO_APROVACAO ──(gerar orçamento)──► AGUARDANDO_APROVACAO
AGUARDANDO_APROVACAO ──(rejeitar)──► REJEITADA
AGUARDANDO_APROVACAO ──(aprovar)──► EM_EXECUCAO
EM_EXECUCAO ──(finalizar)──► FINALIZADA
FINALIZADA ──(entregar)──► ENTREGUE
```

---

## 3. `OrderStatusService`

Arquivo: `src/domain/atendimento/services/order-status.service.ts`

API centralizada com métodos nomeados para cada tipo de transição:

- `assertStatusAtual({ statusAtual, allowedFrom, acao })` — método genérico usado por `iniciar-diagnostico`, `finalizar-os` e `entregar-veiculo`.
- `assertPodeGerarOrcamento(statusAtual)` — verifica `[RECEBIDA, EM_DIAGNOSTICO, AGUARDANDO_APROVACAO]`.
- `assertPodeAprovarOuRejeitarOrcamento(statusAtual)` — verifica `AGUARDANDO_APROVACAO`.

Em caso de falha: `ConflictException` com mensagem descritiva incluindo a ação e os estados esperados.

**Todas** as validações de transição de status estão centralizadas no `OrderStatusService` — os use cases delegam para ele, sem duplicação de lógica.

---

## 4. Critérios de aceite

- Nenhuma regra de "de qual status posso partir" duplicada em mais de um use case (exceto testes que montam fixtures).
- Testes unitários de `OrderStatusService` cobrem **todas** as ações que mutam status.
- Mensagens de erro continuam compreensíveis para o usuário/API (incluir ação + estados esperados, como hoje).
