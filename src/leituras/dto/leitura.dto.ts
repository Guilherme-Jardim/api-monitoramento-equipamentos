import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional } from 'class-validator';
import { PaginacaoDto } from '../../common/dto/paginacao.dto';

export class CriarLeituraDto {
  @ApiProperty({ example: 27.5 })
  @IsNumber({ allowNaN: false, allowInfinity: false })
  valor: number;

  @ApiPropertyOptional({ example: '2026-01-15T10:30:00Z', description: 'Padrao: agora' })
  @IsOptional()
  @IsDateString()
  registradaEm?: string;
}

export class ConsultaLeiturasDto extends PaginacaoDto {
  @ApiPropertyOptional({ example: '2026-01-15T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  de?: string;

  @ApiPropertyOptional({ example: '2026-01-16T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  ate?: string;
}

export class ConsultaAgregacaoDto {
  @ApiProperty({ example: '2026-01-15T00:00:00Z' })
  @IsDateString()
  de: string;

  @ApiProperty({ example: '2026-01-16T00:00:00Z' })
  @IsDateString()
  ate: string;
}
