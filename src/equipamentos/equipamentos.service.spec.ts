import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EquipamentosService } from './equipamentos.service';

describe('EquipamentosService', () => {
  const repo = { criar: jest.fn(), buscarPorId: jest.fn(), listar: jest.fn(), atualizar: jest.fn(), remover: jest.fn() };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = new EquipamentosService(repo as any);

  beforeEach(() => Object.values(repo).forEach((f) => f.mockReset()));

  it('cria equipamento valido', async () => {
    repo.criar.mockResolvedValue({ id: 'e1' });
    expect(await service.criar({ nome: 'Sensor 1', tipo: 'SENSOR', limiteMin: 0, limiteMax: 10 })).toEqual({ id: 'e1' });
  });

  it('recusa limiteMin maior que limiteMax', () => {
    expect(() => service.criar({ nome: 'Sensor 1', tipo: 'SENSOR', limiteMin: 20, limiteMax: 10 })).toThrow(
      BadRequestException,
    );
  });

  it('lista com skip/take calculados e meta de paginacao', async () => {
    repo.listar.mockResolvedValue([[{ id: 'e1' }], 45]);
    const r = await service.listar({ page: 3, limit: 20, tipo: 'CAMERA' });
    expect(repo.listar).toHaveBeenCalledWith({ tipo: 'CAMERA', ativo: undefined, busca: undefined, skip: 40, take: 20 });
    expect(r.meta.totalPages).toBe(3);
  });

  it('busca por id inexistente gera 404', async () => {
    repo.buscarPorId.mockResolvedValue(null);
    await expect(service.buscarPorId('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('atualiza validando contra os limites ja salvos', async () => {
    repo.buscarPorId.mockResolvedValue({ id: 'e1', limiteMin: 50, limiteMax: 100 });
    await expect(service.atualizar('e1', { limiteMax: 10 })).rejects.toBeInstanceOf(BadRequestException);
    repo.atualizar.mockResolvedValue({ id: 'e1' });
    await expect(service.atualizar('e1', { limiteMax: 200 })).resolves.toEqual({ id: 'e1' });
  });

  it('remove somente se existir', async () => {
    repo.buscarPorId.mockResolvedValueOnce(null);
    await expect(service.remover('x')).rejects.toBeInstanceOf(NotFoundException);
    repo.buscarPorId.mockResolvedValueOnce({ id: 'e1' });
    await service.remover('e1');
    expect(repo.remover).toHaveBeenCalledWith('e1');
  });
});
