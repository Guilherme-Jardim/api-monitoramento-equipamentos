import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('gera hash diferente da senha original', async () => {
    const hash = await service.hash('senha-forte-123');
    expect(hash).not.toContain('senha-forte-123');
    expect(hash.split(':')).toHaveLength(2);
  });

  it('gera hashes distintos para a mesma senha (salt aleatorio)', async () => {
    expect(await service.hash('abc12345')).not.toEqual(await service.hash('abc12345'));
  });

  it('verifica senha correta e rejeita a errada', async () => {
    const hash = await service.hash('senha-forte-123');
    expect(await service.verificar('senha-forte-123', hash)).toBe(true);
    expect(await service.verificar('outra-senha', hash)).toBe(false);
  });

  it('rejeita hash armazenado malformado', async () => {
    expect(await service.verificar('qualquer', 'sem-separador')).toBe(false);
  });
});
