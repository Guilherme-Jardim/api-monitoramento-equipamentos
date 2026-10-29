import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginacaoDto } from '../common/dto/paginacao.dto';

export class ConsultaAlertasDto extends PaginacaoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  equipamentoId?: string;

  @ApiPropertyOptional({ description: 'true ou false' })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  reconhecido?: boolean;
}
