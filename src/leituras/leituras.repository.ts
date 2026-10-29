import { Injectable } from '@nestjs/common';
import { Leitura } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface FiltroPeriodo {
  equipamentoId: string;
  de?: Date;
  ate?: Date;
}

@Injectable()
export class LeiturasRepository {
  constructor(private readonly prisma: PrismaService) {}

  criar(equipamentoId: string, valor: number, registradaEm?: Date): Promise<Leitura> {
    return this.prisma.leitura.create({ data: { equipamentoId, valor, registradaEm } });
  }

  private where(f: FiltroPeriodo) {
    const periodo = f.de || f.ate ? { registradaEm: { ...(f.de ? { gte: f.de } : {}), ...(f.ate ? { lte: f.ate } : {}) } } : {};
    return { equipamentoId: f.equipamentoId, ...periodo };
  }

  listar(f: FiltroPeriodo, skip: number, take: number): Promise<[Leitura[], number]> {
    const where = this.where(f);
    return this.prisma.$transaction([
      this.prisma.leitura.findMany({ where, skip, take, orderBy: { registradaEm: 'desc' } }),
      this.prisma.leitura.count({ where }),
    ]);
  }

  listarTodasNoPeriodo(f: FiltroPeriodo): Promise<Pick<Leitura, 'valor' | 'registradaEm'>[]> {
    return this.prisma.leitura.findMany({
      where: this.where(f),
      select: { valor: true, registradaEm: true },
      orderBy: { registradaEm: 'asc' },
    });
  }
}
