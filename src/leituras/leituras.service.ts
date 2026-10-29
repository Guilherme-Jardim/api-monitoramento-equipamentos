import { BadRequestException, Injectable } from '@nestjs/common';
import { Alerta, Leitura } from '@prisma/client';
import { AlertasService } from '../alertas/alertas.service';
import { calcularSkip, montarPagina, Pagina } from '../common/dto/paginacao.dto';
import { EquipamentosService } from '../equipamentos/equipamentos.service';
import { agruparPorHora, PontoAgregado } from './agregacao';
import { ConsultaAgregacaoDto, ConsultaLeiturasDto, CriarLeituraDto } from './dto/leitura.dto';
import { LeiturasRepository } from './leituras.repository';

@Injectable()
export class LeiturasService {
  constructor(
    private readonly repo: LeiturasRepository,
    private readonly equipamentos: EquipamentosService,
    private readonly alertas: AlertasService,
  ) {}

  async registrar(equipamentoId: string, dto: CriarLeituraDto): Promise<{ leitura: Leitura; alerta: Alerta | null }> {
    const equipamento = await this.equipamentos.buscarPorId(equipamentoId);
    if (!equipamento.ativo) {
      throw new BadRequestException('Equipamento inativo nao aceita leituras');
    }
    const quando = dto.registradaEm ? new Date(dto.registradaEm) : undefined;
    const leitura = await this.repo.criar(equipamentoId, dto.valor, quando);
    const alerta = await this.alertas.avaliar(equipamento, leitura);
    return { leitura, alerta };
  }

  async listar(equipamentoId: string, consulta: ConsultaLeiturasDto): Promise<Pagina<Leitura>> {
    await this.equipamentos.buscarPorId(equipamentoId);
    const periodo = this.periodo(equipamentoId, consulta.de, consulta.ate);
    const [itens, total] = await this.repo.listar(periodo, calcularSkip(consulta.page, consulta.limit), consulta.limit);
    return montarPagina(itens, total, consulta.page, consulta.limit);
  }

  async agregarPorHora(equipamentoId: string, consulta: ConsultaAgregacaoDto): Promise<PontoAgregado[]> {
    await this.equipamentos.buscarPorId(equipamentoId);
    const leituras = await this.repo.listarTodasNoPeriodo(this.periodo(equipamentoId, consulta.de, consulta.ate));
    return agruparPorHora(leituras);
  }

  private periodo(equipamentoId: string, de?: string, ate?: string) {
    const inicio = de ? new Date(de) : undefined;
    const fim = ate ? new Date(ate) : undefined;
    if (inicio && fim && inicio > fim) {
      throw new BadRequestException('"de" deve ser anterior a "ate"');
    }
    return { equipamentoId, de: inicio, ate: fim };
  }
}
