import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const usuarios = { buscarPorEmail: jest.fn(), criar: jest.fn() };
  const senhas = { hash: jest.fn().mockResolvedValue('hash'), verificar: jest.fn() };
  const jwt = { signAsync: jest.fn().mockResolvedValue('token-jwt') };
  const config = { get: jest.fn().mockReturnValue('admin@exemplo.com') };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = new AuthService(usuarios as any, senhas as any, jwt as any, config as any);

  beforeEach(() => {
    usuarios.buscarPorEmail.mockReset();
    usuarios.criar.mockReset().mockImplementation(async (d) => ({ id: 'u1', ...d }));
    senhas.verificar.mockReset();
  });

  it('cadastra usuario comum como OPERADOR e nao devolve o hash', async () => {
    usuarios.buscarPorEmail.mockResolvedValue(null);
    const r = await service.registrar({ nome: 'Ana', email: 'Ana@Exemplo.com', senha: '12345678' });
    expect(r.papel).toBe('OPERADOR');
    expect(r.email).toBe('ana@exemplo.com');
    expect(r).not.toHaveProperty('senhaHash');
  });

  it('promove a ADMIN quando o e-mail e o ADMIN_EMAIL', async () => {
    usuarios.buscarPorEmail.mockResolvedValue(null);
    const r = await service.registrar({ nome: 'Chefe', email: 'admin@exemplo.com', senha: '12345678' });
    expect(r.papel).toBe('ADMIN');
  });

  it('recusa e-mail ja cadastrado', async () => {
    usuarios.buscarPorEmail.mockResolvedValue({ id: 'x' });
    await expect(service.registrar({ nome: 'Ana', email: 'a@b.com', senha: '12345678' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('faz login e devolve token', async () => {
    usuarios.buscarPorEmail.mockResolvedValue({ id: 'u1', email: 'a@b.com', papel: 'OPERADOR', senhaHash: 'h' });
    senhas.verificar.mockResolvedValue(true);
    expect(await service.login({ email: 'a@b.com', senha: 'x' })).toEqual({ accessToken: 'token-jwt', tipo: 'Bearer' });
  });

  it('recusa senha errada e usuario inexistente com a mesma mensagem', async () => {
    usuarios.buscarPorEmail.mockResolvedValue({ id: 'u1', senhaHash: 'h' });
    senhas.verificar.mockResolvedValue(false);
    await expect(service.login({ email: 'a@b.com', senha: 'x' })).rejects.toBeInstanceOf(UnauthorizedException);
    usuarios.buscarPorEmail.mockResolvedValue(null);
    await expect(service.login({ email: 'a@b.com', senha: 'x' })).rejects.toThrow('Credenciais invalidas');
  });
});
