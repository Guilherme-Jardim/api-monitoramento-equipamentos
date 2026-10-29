import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConsultaAgregacaoDto, ConsultaLeiturasDto, CriarLeituraDto } from './dto/leitura.dto';
import { LeiturasService } from './leituras.service';

@ApiTags('leituras')
@ApiBearerAuth()
@Controller('equipamentos/:equipamentoId/leituras')
export class LeiturasController {
  constructor(private readonly service: LeiturasService) {}

  @Post()
  @ApiOperation({ summary: 'Registra uma leitura; gera alerta se violar os limites do equipamento' })
  registrar(@Param('equipamentoId') equipamentoId: string, @Body() dto: CriarLeituraDto) {
    return this.service.registrar(equipamentoId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista leituras por periodo (mais recentes primeiro)' })
  listar(@Param('equipamentoId') equipamentoId: string, @Query() consulta: ConsultaLeiturasDto) {
    return this.service.listar(equipamentoId, consulta);
  }

  @Get('agregacao-horaria')
  @ApiOperation({ summary: 'Media, minimo e maximo por hora (UTC) no periodo' })
  agregar(@Param('equipamentoId') equipamentoId: string, @Query() consulta: ConsultaAgregacaoDto) {
    return this.service.agregarPorHora(equipamentoId, consulta);
  }
}
