import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PapelUsuario, ROLES_KEY } from '../common/decorators/roles.decorator';
import { RequisicaoAutenticada } from './jwt-auth.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const exigidos = this.reflector.getAllAndOverride<PapelUsuario[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!exigidos || exigidos.length === 0) return true;

    const req = context.switchToHttp().getRequest<RequisicaoAutenticada>();
    if (!req.user || !exigidos.includes(req.user.papel as PapelUsuario)) {
      throw new ForbiddenException('Papel sem permissao para esta operacao');
    }
    return true;
  }
}
