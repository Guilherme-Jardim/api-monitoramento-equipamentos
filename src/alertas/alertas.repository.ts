import { Injectable } from '@nestjs/common';
import { Alerta, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertasRepository {
  constructor(private readonly prisma: PrismaService) {}

  criar(data: Prisma.AlertaUncheckedCreateInput): Promise<Alerta> {
    return this.prisma.alerta.create({ data });
  }

  buscarPorId(id: string): Promise<Alerta | null> {
    return this.prisma.alerta.findUnique({ where: { id } });
  }

  listar(where: Prisma.AlertaWhereInput, skip: number, take: number): Promise<[Alerta[], number]> {
    return this.prisma.$transaction([
      this.prisma.alerta.findMany({ where, skip, take, orderBy: { criadoEm: 'desc' } }),
      this.prisma.alerta.count({ where }),
    ]);
  }

  reconhecer(id: string): Promise<Alerta> {
    return this.prisma.alerta.update({ where: { id }, data: { reconhecido: true } });
  }
}
