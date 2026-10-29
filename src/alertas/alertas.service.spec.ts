import { NotFoundException } from '@nestjs/common';
import { AlertasService } from './alertas.service';

describe('AlertasService', () => {
  const repo = { criar: jest.fn(), buscarPorId: jest.fn(), listar: jest.fn(), reconhecer: jest.fn() };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = new AlertasService(repo as any);

  beforeEach(() => Object.values(repo).forEach((f) => f.mockReset()));

  it('cria alerta quando a leitura passa do limite maximo', async () => {
    repo.criar.mockResolvedValue({ id: 'a1' });
    const r = await service.avaliar({ id: 'e1', limiteMin: null, limiteMax: 50 }, { id: 'l1', valor: 60 });
    expect(r).toEqual({ id: 'a1' });
    expect(repo.criar).toHaveBeenCalledWith({
      equipamentoId: 'e1',
      leituraId: 'l1',
      tipo: 'ACIMA_DO_LIMITE',
      valor: 60,
      limite: 50,
    });
  });

  it('nao cria alerta para leitura normal', async () => {
    const r = await service.avaliar({ id: 'e1', limiteMin: 0, limiteMax: 50 }, { id: 'l1', valor: 20 });
    expect(r).toBeNull();
    expect(repo.criar).not.toHaveBeenCalled();
  });

  it('lista com paginacao e filtros', async () => {
    repo.listar.mockResolvedValue([[{ id: 'a1' }], 21]);
    const r = await service.listar({ page: 2, limit: 10, equipamentoId: 'e1', reconhecido: false });
    expect(repo.listar).toHaveBeenCalledWith({ equipamentoId: 'e1', reconhecido: false }, 10, 10);
    expect(r.meta).toEqual({ total: 21, page: 2, limit: 10, totalPages: 3 });
  });

  it('reconhece alerta existente e falha com 404 se nao existir', async () => {
    repo.buscarPorId.mockResolvedValueOnce({ id: 'a1' });
    repo.reconhecer.mockResolvedValue({ id: 'a1', reconhecido: true });
    expect((await service.reconhecer('a1')).reconhecido).toBe(true);
    repo.buscarPorId.mockResolvedValueOnce(null);
    await expect(service.reconhecer('nao-existe')).rejects.toBeInstanceOf(NotFoundException);
  });
});
