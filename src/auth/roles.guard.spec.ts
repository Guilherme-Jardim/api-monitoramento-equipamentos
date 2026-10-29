import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function contexto(user: { papel: string } | undefined) {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  it('libera quando a rota nao exige papel', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(contexto({ papel: 'OPERADOR' }))).toBe(true);
  });

  it('libera quando o papel confere', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    expect(guard.canActivate(contexto({ papel: 'ADMIN' }))).toBe(true);
  });

  it('bloqueia papel insuficiente', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    expect(() => guard.canActivate(contexto({ papel: 'OPERADOR' }))).toThrow(ForbiddenException);
  });
});
