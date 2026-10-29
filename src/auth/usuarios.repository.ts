import { Injectable } from '@nestjs/common';
import { Usuario } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface NovoUsuario {
  email: string;
  nome: string;
  senhaHash: string;
  papel: string;
}

@Injectable()
export class UsuariosRepository {
  constructor(private readonly prisma: PrismaService) {}

  buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({ where: { email } });
  }

  criar(dados: NovoUsuario): Promise<Usuario> {
    return this.prisma.usuario.create({ data: dados });
  }
}
