import { StatusOs } from '../value-objects/status-os.enum';

export class OrdemServico {
  constructor(
    public readonly id: string,
    public readonly clienteId: string,
    public readonly veiculoId: string,
    public readonly status: StatusOs,
    public readonly total: number | null,
    public readonly dataCriacao: Date,
    public readonly dataConclusao: Date | null,
    public readonly dataEntrega: Date | null,
  ) {}
}
