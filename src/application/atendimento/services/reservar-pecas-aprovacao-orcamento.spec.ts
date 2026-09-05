import { UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { reservarPecasNaoReservadasDaOs } from '../../../infrastructure/database/mysql/reservar-pecas-aprovacao-orcamento';

type Tx = Prisma.TransactionClient;

function makeTx(itens: Array<unknown>) {
  const findMany = jest.fn().mockResolvedValue(itens);
  const updatePeca = jest.fn().mockResolvedValue(undefined);
  const updateItem = jest.fn().mockResolvedValue(undefined);
  const tx = {
    itemPecaOs: { findMany, update: updateItem },
    pecaEstoque: { update: updatePeca },
  } as unknown as Tx;
  return { tx, findMany, updatePeca, updateItem };
}

describe('reservarPecasNaoReservadasDaOs', () => {
  it('reserva itens não reservados e debita estoque', async () => {
    const itens = [
      {
        id: 'i1',
        quantidade: 2,
        reservado: false,
        pecaEstoque: { id: 'p1', quantidadeEmEstoque: 5 },
      },
      {
        id: 'i2',
        quantidade: 1,
        reservado: true,
        pecaEstoque: { id: 'p2', quantidadeEmEstoque: 0 },
      },
    ];
    const { tx, updatePeca, updateItem } = makeTx(itens);
    const log = jest.fn();
    const result = await reservarPecasNaoReservadasDaOs(tx, 'os1', log);
    expect(updatePeca).toHaveBeenCalledTimes(1);
    expect(updatePeca).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { quantidadeEmEstoque: 3 },
    });
    expect(updateItem).toHaveBeenCalledWith({
      where: { id: 'i1' },
      data: { reservado: true },
    });
    expect(result).toEqual([{ pecaEstoqueId: 'p1', quantidade: 2 }]);
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('osId=os1 pecaId=p1 qtd=2'),
    );
  });

  it('lança UnprocessableEntity quando estoque insuficiente', async () => {
    const itens = [
      {
        id: 'i1',
        quantidade: 10,
        reservado: false,
        pecaEstoque: { id: 'p1', quantidadeEmEstoque: 1 },
      },
    ];
    const { tx, updatePeca } = makeTx(itens);
    await expect(
      reservarPecasNaoReservadasDaOs(tx, 'os1', jest.fn()),
    ).rejects.toThrow(UnprocessableEntityException);
    expect(updatePeca).not.toHaveBeenCalled();
  });

  it('retorna lista vazia se todos itens já estão reservados', async () => {
    const itens = [
      {
        id: 'i1',
        quantidade: 1,
        reservado: true,
        pecaEstoque: { id: 'p1', quantidadeEmEstoque: 1 },
      },
    ];
    const { tx, updatePeca } = makeTx(itens);
    const result = await reservarPecasNaoReservadasDaOs(tx, 'os1', jest.fn());
    expect(result).toEqual([]);
    expect(updatePeca).not.toHaveBeenCalled();
  });
});
