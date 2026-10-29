import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Papel, Papeis } from '../common/decorators/roles.decorator';
import { AtualizarEquipamentoDto, ConsultaEquipamentosDto, CriarEquipamentoDto } from './dto/equipamento.dto';
import { EquipamentosService } from './equipamentos.service';

@ApiTags('equipamentos')
@ApiBearerAuth()
@Controller('equipamentos')
export class EquipamentosController {
  constructor(private readonly service: EquipamentosService) {}

  @Post()
  @Papeis(Papel.ADMIN)
  @ApiOperation({ summary: 'Cadastra equipamento (ADMIN)' })
  criar(@Body() dto: CriarEquipamentoDto) {
    return this.service.criar(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista equipamentos com paginacao e filtros' })
  listar(@Query() consulta: ConsultaEquipamentosDto) {
    return this.service.listar(consulta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha um equipamento' })
  buscar(@Param('id') id: string) {
    return this.service.buscarPorId(id);
  }

  @Patch(':id')
  @Papeis(Papel.ADMIN)
  @ApiOperation({ summary: 'Atualiza equipamento (ADMIN)' })
  atualizar(@Param('id') id: string, @Body() dto: AtualizarEquipamentoDto) {
    return this.service.atualizar(id, dto);
  }

  @Delete(':id')
  @Papeis(Papel.ADMIN)
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove equipamento e seu historico (ADMIN)' })
  remover(@Param('id') id: string) {
    return this.service.remover(id);
  }
}
