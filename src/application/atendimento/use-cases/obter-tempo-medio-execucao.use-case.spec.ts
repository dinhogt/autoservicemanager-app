import type { OrdemServicoReadPort } from '../../../domain/atendimento/ports/ordem-servico-read.port';
import { ObterTempoMedioExecucaoUseCase } from './obter-tempo-medio-execucao.use-case';

describe('ObterTempoMedioExecucaoUseCase', () => {
  function makeUc(obterTempoMedioExecucao: jest.Mock) {
    const ordensRead = {
      obterTempoMedioExecucao,
    } as unknown as OrdemServicoReadPort;
    return new ObterTempoMedioExecucaoUseCase(ordensRead);
  }

  it('retorna resultado vazio quando não há OS terminadas', async () => {
    const uc = makeUc(
      jest.fn().mockResolvedValue({
        totalOs: 0,
        globalMinutos: null,
        porServico: [],
        porFase: [],
      }),
    );
    const result = await uc.execute();
    expect(result.totalOs).toBe(0);
    expect(result.globalMinutos).toBeNull();
    expect(result.porServico).toEqual([]);
    expect(result.porFase).toEqual([]);
    expect(typeof result.geradoEm).toBe('string');
  });

  it('calcula média global e por serviço com arredondamento', async () => {
    const uc = makeUc(
      jest.fn().mockResolvedValue({
        totalOs: 2,
        globalMinutos: 60,
        porServico: [
          {
            servicoId: 'sc2',
            descricao: 'Alinhamento',
            totalOs: 1,
            mediaMinutos: 90,
          },
          {
            servicoId: 'sc1',
            descricao: 'Troca de óleo',
            totalOs: 2,
            mediaMinutos: 60,
          },
        ],
        porFase: [
          {
            fase: 'Diagnostico',
            status: 'EM_DIAGNOSTICO',
            totalTransicoes: 2,
            mediaMinutos: 30,
          },
        ],
      }),
    );
    const result = await uc.execute();
    expect(result.totalOs).toBe(2);
    expect(result.globalMinutos).toBe(60);
    expect(result.porFase[0].mediaMinutos).toBe(30);
    expect(result.porServico).toEqual([
      {
        servicoId: 'sc2',
        descricao: 'Alinhamento',
        totalOs: 1,
        mediaMinutos: 90,
      },
      {
        servicoId: 'sc1',
        descricao: 'Troca de óleo',
        totalOs: 2,
        mediaMinutos: 60,
      },
    ]);
  });
});
