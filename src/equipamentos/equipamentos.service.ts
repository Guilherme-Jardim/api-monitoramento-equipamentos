import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Equipamento } from '@prisma/client';
import { calcularSkip, montarPagina, Pagina } from '../common/dto/paginacao.dto';
import { AtualizarEquipamentoDto, ConsultaEquipamentosDto, CriarEquipamentoDto } from './dto/equipamento.dto';
import { EquipamentosRepository } from './equipamentos.repository';

@Injectable()
export class EquipamentosService {
  constructor(private readonly repo: EquipamentosRepository) {}

  criar(dto: CriarEquipamentoDto): Promise<Equipamento> {
    this.validarLimites(dto.limiteMin, dto.limiteMax);
    return this.repo.criar(dto);
  }

  async listar(consulta: ConsultaEquipamentosDto): Promise<Pagina<Equipamento>> {
    const { page, limit, tipo, ativo, busca } = consulta;
    const [itens, total] = await this.repo.listar({ tipo, ativo, busca, skip: calcularSkip(page, limit), take: limit });
    return montarPagina(itens, total, page, limit);
  }

  async buscarPorId(id: string): Promise<Equipamento> {
    const equipamento = await this.repo.buscarPorId(id);
    if (!equipamento) throw new NotFoundException('Equipamento nao encontrado');
    return equipamento;
  }

  async atualizar(id: string, dto: AtualizarEquipamentoDto): Promise<Equipamento> {
    const atual = await this.buscarPorId(id);
    this.validarLimites(dto.limiteMin ?? atual.limiteMin ?? undefined, dto.limiteMax ?? atual.limiteMax ?? undefined);
    return this.repo.atualizar(id, dto);
  }

  async remover(id: string): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.remover(id);
  }

  private validarLimites(min?: number, max?: number): void {
    if (min !== undefined && max !== undefined && min > max) {
      throw new BadRequestException('limiteMin nao pode ser maior que limiteMax');
    }
  }
}
