import { Injectable } from '@nestjs/common';
import { Equipamento, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface FiltroEquipamentos {
  tipo?: string;
  ativo?: boolean;
  busca?: string;
  skip: number;
  take: number;
}

@Injectable()
export class EquipamentosRepository {
  constructor(private readonly prisma: PrismaService) {}

  criar(data: Prisma.EquipamentoCreateInput): Promise<Equipamento> {
    return this.prisma.equipamento.create({ data });
  }

  buscarPorId(id: string): Promise<Equipamento | null> {
    return this.prisma.equipamento.findUnique({ where: { id } });
  }

  async listar(filtro: FiltroEquipamentos): Promise<[Equipamento[], number]> {
    const where: Prisma.EquipamentoWhereInput = {
      ...(filtro.tipo ? { tipo: filtro.tipo } : {}),
      ...(filtro.ativo !== undefined ? { ativo: filtro.ativo } : {}),
      ...(filtro.busca ? { nome: { contains: filtro.busca } } : {}),
    };
    return this.prisma.$transaction([
      this.prisma.equipamento.findMany({
        where,
        skip: filtro.skip,
        take: filtro.take,
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.equipamento.count({ where }),
    ]);
  }

  atualizar(id: string, data: Prisma.EquipamentoUpdateInput): Promise<Equipamento> {
    return this.prisma.equipamento.update({ where: { id }, data });
  }

  remover(id: string): Promise<Equipamento> {
    return this.prisma.equipamento.delete({ where: { id } });
  }
}
