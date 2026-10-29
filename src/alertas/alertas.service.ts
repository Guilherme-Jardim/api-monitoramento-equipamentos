import { Injectable, NotFoundException } from '@nestjs/common';
import { Alerta, Equipamento, Leitura } from '@prisma/client';
import { calcularSkip, montarPagina, Pagina } from '../common/dto/paginacao.dto';
import { avaliarLimites } from './avaliar-limites';
import { AlertasRepository } from './alertas.repository';
import { ConsultaAlertasDto } from './alertas.dto';

@Injectable()
export class AlertasService {
  constructor(private readonly repo: AlertasRepository) {}

  /** Gera um alerta se a leitura violar os limites do equipamento. */
  async avaliar(
    equipamento: Pick<Equipamento, 'id' | 'limiteMin' | 'limiteMax'>,
    leitura: Pick<Leitura, 'id' | 'valor'>,
  ): Promise<Alerta | null> {
    const violacao = avaliarLimites(leitura.valor, equipamento.limiteMin, equipamento.limiteMax);
    if (!violacao) return null;
    return this.repo.criar({
      equipamentoId: equipamento.id,
      leituraId: leitura.id,
      tipo: violacao.tipo,
      valor: leitura.valor,
      limite: violacao.limite,
    });
  }

  async listar(consulta: ConsultaAlertasDto): Promise<Pagina<Alerta>> {
    const { page, limit, equipamentoId, reconhecido } = consulta;
    const where = {
      ...(equipamentoId ? { equipamentoId } : {}),
      ...(reconhecido !== undefined ? { reconhecido } : {}),
    };
    const [itens, total] = await this.repo.listar(where, calcularSkip(page, limit), limit);
    return montarPagina(itens, total, page, limit);
  }

  async reconhecer(id: string): Promise<Alerta> {
    if (!(await this.repo.buscarPorId(id))) throw new NotFoundException('Alerta nao encontrado');
    return this.repo.reconhecer(id);
  }
}
