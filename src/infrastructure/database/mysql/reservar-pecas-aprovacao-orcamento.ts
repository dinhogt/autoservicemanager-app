import { UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OsDomainEventType } from '../../../domain/atendimento/events/os-domain-events';

export type PecaReservadaNaTransacao = {
  pecaEstoqueId: string;
  quantidade: number;
};

/**
 * Dentro de uma transação Prisma: debita estoque e marca itens como reservados.
 */
export async function reservarPecasNaoReservadasDaOs(
  tx: Prisma.TransactionClient,
  ordemServicoId: string,
  log: (message: string) => void,
): Promise<PecaReservadaNaTransacao[]> {
  const pecasReservadasNestaTransacao: PecaReservadaNaTransacao[] = [];
  const itensPeca = await tx.itemPecaOs.findMany({
    where: { ordemServicoId },
    include: { pecaEstoque: true },
  });

  for (const item of itensPeca) {
    if (item.reservado) {
      continue;
    }
    const peca = item.pecaEstoque;
    if (peca.quantidadeEmEstoque < item.quantidade) {
      throw new UnprocessableEntityException(
        `Estoque insuficiente para a peça informada. Não é possível reservar a quantidade solicitada.`,
      );
    }
    await tx.pecaEstoque.update({
      where: { id: peca.id },
      data: {
        quantidadeEmEstoque: peca.quantidadeEmEstoque - item.quantidade,
      },
    });
    await tx.itemPecaOs.update({
      where: { id: item.id },
      data: { reservado: true },
    });
    pecasReservadasNestaTransacao.push({
      pecaEstoqueId: peca.id,
      quantidade: item.quantidade,
    });
    log(
      `${OsDomainEventType.PecaReservadaNoEstoque} osId=${ordemServicoId} pecaId=${peca.id} qtd=${item.quantidade}`,
    );
  }

  return pecasReservadasNestaTransacao;
}
