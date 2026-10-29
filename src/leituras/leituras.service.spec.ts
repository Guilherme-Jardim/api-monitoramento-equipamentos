import { BadRequestException } from '@nestjs/common';
import { LeiturasService } from './leituras.service';

describe('LeiturasService', () => {
  const repo = { criar: jest.fn(), listar: jest.fn(), listarTodasNoPeriodo: jest.fn() };
  const equipamentos = { buscarPorId: jest.fn() };
  const alertas = { avaliar: jest.fn() };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = new LeiturasService(repo as any, equipamentos as any, alertas as any);

  beforeEach(() => {
    repo.criar.mockReset().mockResolvedValue({ id: 'l1', valor: 30 });
    repo.listar.mockReset();
    repo.listarTodasNoPeriodo.mockReset();
    alertas.avaliar.mockReset().mockResolvedValue(null);
    equipamentos.buscarPorId.mockReset().mockResolvedValue({ id: 'e1', ativo: true, limiteMin: null, limiteMax: 50 });
  });

  it('registra leitura e avalia alertas', async () => {
    alertas.avaliar.mockResolvedValue({ id: 'a1' });
    const r = await service.registrar('e1', { valor: 30 });
    expect(r).toEqual({ leitura: { id: 'l1', valor: 30 }, alerta: { id: 'a1' } });
    expect(alertas.avaliar).toHaveBeenCalled();
  });

  it('recusa leitura para equipamento inativo', async () => {
    equipamentos.buscarPorId.mockResolvedValue({ id: 'e1', ativo: false });
    await expect(service.registrar('e1', { valor: 1 })).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.criar).not.toHaveBeenCalled();
  });

  it('usa o horario informado na leitura', async () => {
    await service.registrar('e1', { valor: 30, registradaEm: '2026-01-15T10:00:00Z' });
    expect(repo.criar).toHaveBeenCalledWith('e1', 30, new Date('2026-01-15T10:00:00Z'));
  });

  it('rejeita periodo invertido', async () => {
    await expect(
      service.listar('e1', { page: 1, limit: 20, de: '2026-02-01T00:00:00Z', ate: '2026-01-01T00:00:00Z' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('agrega leituras do periodo por hora', async () => {
    repo.listarTodasNoPeriodo.mockResolvedValue([
      { valor: 10, registradaEm: new Date('2026-01-15T10:10:00Z') },
      { valor: 30, registradaEm: new Date('2026-01-15T10:20:00Z') },
    ]);
    const r = await service.agregarPorHora('e1', { de: '2026-01-15T00:00:00Z', ate: '2026-01-16T00:00:00Z' });
    expect(r).toEqual([{ hora: '2026-01-15T10:00:00.000Z', media: 20, min: 10, max: 30, quantidade: 2 }]);
  });
});
