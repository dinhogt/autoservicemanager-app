# Validação da hipótese arquitetural: MySQL + Mongo (auditoria)

Este documento **valida** a hipótese implícita do MVP: **estado transacional forte em MySQL** e **trilha complementar em MongoDB**, com escrita de auditoria em modo **best-effort** (não bloqueia a transação SQL quando o Mongo falha ou está indisponível).

Referência de implementação: `MongoOsAuditRepository` envolve gravações em `bestEffort()`; se não houver `db`, as operações retornam sem erro fatal.

---

## 1. Hipótese em uma frase

> A ordem de serviço e regras de negócio críticas permanecem corretas e persistidas em **MySQL**; a **história de eventos, mudanças de status e “notificações” registradas** vive em **Mongo** como **complemento observável**, aceitando perda eventual de linhas de auditoria em troca de **simplicidade** e **não bloquear** o fluxo principal.

---

## 2. Critérios objetivos de validação

| Critério | O que verificar | Avaliação no MVP atual |
|----------|-----------------|-------------------------|
| **Consistência do estado da OS** | Fonte da verdade única para status, itens e vínculos transacionais | **Adequado:** MySQL (Prisma) como autoridade. |
| **Auditoria / histórico** | Rastreabilidade para suporte e análise pós-fato | **Adequado com ressalva:** Mongo com `bestEffort()` — ver seção 4. |
| **Separação de responsabilidades** | Use cases orquestram; domínio com regras coesas | **Parcial** (fora do escopo deste doc): regras de status ainda podem estar duplicadas em alguns use cases; não invalida a hipótese SQL+Mongo. |
| **Testabilidade** | Testes nos use cases e portos substituíveis | **Adequado:** porto `OsMongoAuditPort` com implementação real e noop possível. |

**Conclusão:** A combinação **MySQL + Mongo best-effort** é **defensável** para o problema (oficina, OS, estoque): não exige trocar a stack por causa da auditoria; o que evolui com o tempo são **políticas de risco** (aceitar perda de log vs. exigir entrega garantida de eventos).

---

## 3. Decisão explícita: perda best-effort vs. evolução (ex.: outbox)

### 3.1 Quando a perda best-effort é aceitável

- Auditoria usada para **conveniência** (painel, suporte): “o que aconteceu na prática” com tolerância a falhas ocasionais.
- **Não** há obrigação legal de provar cada evento com a mesma garantia que o dado financeiro na OS.
- O custo operacional de **fila, workers e consistência forte** não se justifica ainda.

**Decisão registrada para o MVP / fase inicial:** **aceitar** que falhas de Mongo (rede, indisponibilidade, timeout) podem resultar em **buracos no histórico** sem reverter a operação de negócio já commitada no MySQL.

### 3.2 Quando exigir evolução (transactional outbox ou equivalente)

Considerar **outbox no MySQL** (ou padrão equivalente: evento persistido na mesma transação da OS, consumo assíncrono) quando **qualquer** destes for verdade:

| Gatilho | Motivo |
|--------|--------|
| **Compliance / auditoria obrigatória** | Precisa existir prova **consistente** com o estado da OS (ex.: trilha para fiscalização). |
| **Notificação crítica** | Envio que não pode “sumir” silenciosamente (ex.: comunicação legal ao cliente). |
| **Integração downstream** | Outros sistemas dependem de **todo** evento; perda parcial corrompe relatórios ou reconciliação. |
| **SLA de observabilidade** | Negócio exige métricas/auditoria com disponibilidade próxima à da aplicação principal. |

**Decisão para o futuro:** a arquitetura atual **não implementa** outbox; a porta está aberta para **introduzir** uma tabela de outbox (ou fila alimentada na mesma transação Prisma) **sem** mudar a regra de que “o estado da OS continua no MySQL”. O Mongo pode continuar como **projeção de leitura** ou ser substituído por outro store de leitura, conforme custo/benefício.

---

## 4. Riscos do modo best-effort (operacional e de produto)

| Risco | Descrição | Mitigação leve (sem outbox) |
|-------|-----------|-----------------------------|
| **Mongo indisponível** | Nenhuma linha de auditoria é gravada durante a indisponibilidade; operações de negócio seguem. | Monitorar saúde do Mongo; alertas; `NoopOsMongoAuditRepository` em testes. |
| **Falha intermitente** | Apenas parte dos `record*` de um mesmo use case pode falhar (ordem sequencial). | Facade/helper de auditoria (backlog) reduz chamadas e inconsistência entre coleções. |
| **Expectativa do usuário** | Usuário assume que “se a OS mudou, o histórico sempre mostra”. | Documentar no produto que o histórico é **melhor esforço** até evolução. |
| **Debug** | Incidentes sem trilha completa dificultam causa raiz. | Logs de aplicação no `catch` de `bestEffort` (já existentes em nível warn). |

---

## 5. Checklist rápido (revisão de código / release)

- [ ] Estado da OS e estoque **sempre** refletidos no MySQL após sucesso do use case.
- [ ] Falha de Mongo **não** altera resposta de sucesso da API para a operação principal.
- [ ] Time alinhado: **perda eventual de auditoria** é conhecida e aceita para o estágio atual, ou há issue para outbox se algum gatilho da seção 3.2 aplicar.
- [ ] (Opcional) `yarn test`, `yarn lint`, `yarn build` após mudanças que toquem portos de auditoria.

---

## 6. Referências no repositório

- Porta: `src/domain/atendimento/ports/os-mongo-audit.port.ts`
- Implementação Mongo: `src/infrastructure/database/mongo/mongo-os-audit.repository.ts`
- Implementação noop (testes / desligar efeitos): `src/infrastructure/database/mongo/noop-os-mongo-audit.repository.ts`
