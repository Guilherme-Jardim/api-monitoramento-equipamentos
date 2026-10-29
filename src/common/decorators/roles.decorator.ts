import { SetMetadata } from '@nestjs/common';

export const Papel = { ADMIN: 'ADMIN', OPERADOR: 'OPERADOR' } as const;
export type PapelUsuario = (typeof Papel)[keyof typeof Papel];

export const ROLES_KEY = 'papeis';
export const Papeis = (...papeis: PapelUsuario[]) => SetMetadata(ROLES_KEY, papeis);
