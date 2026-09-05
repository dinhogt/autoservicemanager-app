import { StatusOs } from '../value-objects/status-os.enum';
import { ItemPecaOs } from './item-peca-os.entity';
import { ItemServicoOs } from './item-servico-os.entity';
import { OrdemServico } from './ordem-servico.entity';

describe('Atendimento entities', () => {
  describe('ItemPecaOs', () => {
    it('stores all constructor parameters as readonly properties', () => {
      const item = new ItemPecaOs('id1', 'os1', 'peca1', 3, 25.5, true, false);

      expect(item.id).toBe('id1');
      expect(item.ordemServicoId).toBe('os1');
      expect(item.pecaEstoqueId).toBe('peca1');
      expect(item.quantidade).toBe(3);
      expect(item.precoUnitario).toBe(25.5);
      expect(item.reservado).toBe(true);
      expect(item.baixado).toBe(false);
    });
  });

  describe('ItemServicoOs', () => {
    it('stores all constructor parameters as readonly properties', () => {
      const item = new ItemServicoOs('id2', 'os2', 'svc1', 2, 150.0);

      expect(item.id).toBe('id2');
      expect(item.ordemServicoId).toBe('os2');
      expect(item.servicoCatalogoId).toBe('svc1');
      expect(item.quantidade).toBe(2);
      expect(item.precoAplicado).toBe(150.0);
    });
  });

  describe('OrdemServico', () => {
    it('stores all constructor parameters as readonly properties', () => {
      const now = new Date();
      const os = new OrdemServico(
        'os1',
        'cli1',
        'vei1',
        StatusOs.RECEBIDA,
        null,
        now,
        null,
        null,
      );

      expect(os.id).toBe('os1');
      expect(os.clienteId).toBe('cli1');
      expect(os.veiculoId).toBe('vei1');
      expect(os.status).toBe(StatusOs.RECEBIDA);
      expect(os.total).toBeNull();
      expect(os.dataCriacao).toBe(now);
      expect(os.dataConclusao).toBeNull();
      expect(os.dataEntrega).toBeNull();
    });

    it('stores non-null total and dates', () => {
      const criacao = new Date('2026-01-01');
      const conclusao = new Date('2026-01-02');
      const entrega = new Date('2026-01-03');
      const os = new OrdemServico(
        'os2',
        'cli2',
        'vei2',
        StatusOs.ENTREGUE,
        1500.5,
        criacao,
        conclusao,
        entrega,
      );

      expect(os.total).toBe(1500.5);
      expect(os.dataConclusao).toBe(conclusao);
      expect(os.dataEntrega).toBe(entrega);
    });
  });
});
