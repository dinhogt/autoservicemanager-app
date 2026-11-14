# language: pt
@fase4 @saga @e2e
Funcionalidade: Ciclo distribuído de uma ordem de serviço
  Como cliente da oficina
  Quero acompanhar diagnóstico, orçamento, pagamento e execução
  Para receber meu veículo com consistência mesmo quando uma etapa falhar

  Contexto:
    Dado que os serviços OS, Billing e Execution estão disponíveis
    E que a mensageria está vazia
    E que o Mercado Pago sandbox está configurado

  Cenário: Concluir o ciclo completo com pagamento aprovado
    Quando uma saga for iniciada para a ordem "00000000-0000-4000-a000-000000000001"
    Então a saga deve alcançar "AWAITING_BUDGET_APPROVAL"
    Quando o evento "budget.approved" ocorrer com pagamento aprovado
    Então a saga deve alcançar "COMPLETED"

  Cenário: Compensar falha de diagnóstico
    Quando uma saga for iniciada para a ordem "00000000-0000-4000-a000-000000000002"
    Então a saga deve alcançar "FAILED"

  Cenário: Rejeitar orçamento e cancelar execução
    Quando uma saga for iniciada para a ordem "00000000-0000-4000-a000-000000000003"
    Então a saga deve alcançar "AWAITING_BUDGET_APPROVAL"
    Quando o evento "budget.rejected" for injetado
    Então a saga deve alcançar "CANCELLED"

  Cenário: Manter ordem aguardando após timeout de pagamento
    Quando uma saga for iniciada para a ordem "00000000-0000-4000-a000-000000000004"
    Então a saga deve alcançar "AWAITING_BUDGET_APPROVAL"
    Quando o evento "budget.approved" for injetado
    Então a saga deve alcançar "AWAITING_PAYMENT"
    Quando o evento "payment.timed-out" for injetado
    Então a saga deve alcançar "AWAITING_PAYMENT"

  Cenário: Compensar falha de execução após pagamento
    Quando uma saga for iniciada para a ordem "00000000-0000-4000-a000-000000000005"
    Então a saga deve alcançar "AWAITING_BUDGET_APPROVAL"
    Quando o evento "budget.approved" ocorrer com pagamento aprovado
    Então a saga deve alcançar "COMPENSATED"

  Cenário: Processar evento duplicado de forma idempotente
    Quando uma saga for iniciada para a ordem "00000000-0000-4000-a000-000000000006"
    Então a saga deve alcançar "AWAITING_BUDGET_APPROVAL"
    Quando o mesmo evento "budget.rejected" for injetado duas vezes
    Então a saga deve alcançar "CANCELLED"
