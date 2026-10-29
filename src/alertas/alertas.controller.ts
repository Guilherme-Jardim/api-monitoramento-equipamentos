import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConsultaAlertasDto } from './alertas.dto';
import { AlertasService } from './alertas.service';

@ApiTags('alertas')
@ApiBearerAuth()
@Controller('alertas')
export class AlertasController {
  constructor(private readonly service: AlertasService) {}

  @Get()
  @ApiOperation({ summary: 'Lista alertas gerados por violacao de limite' })
  listar(@Query() consulta: ConsultaAlertasDto) {
    return this.service.listar(consulta);
  }

  @Patch(':id/reconhecer')
  @ApiOperation({ summary: 'Marca o alerta como reconhecido' })
  reconhecer(@Param('id') id: string) {
    return this.service.reconhecer(id);
  }
}
