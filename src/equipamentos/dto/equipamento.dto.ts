import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsIP, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PaginacaoDto } from '../../common/dto/paginacao.dto';

export const TIPOS_EQUIPAMENTO = [
  'CAMERA',
  'CONTROLADOR_ACESSO',
  'SENSOR',
  'SWITCH',
  'ROTEADOR',
  'GATEWAY',
  'OUTRO',
] as const;

export class CriarEquipamentoDto {
  @ApiProperty({ example: 'Controlador da portaria' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  nome: string;

  @ApiProperty({ enum: TIPOS_EQUIPAMENTO })
  @IsIn(TIPOS_EQUIPAMENTO)
  tipo: (typeof TIPOS_EQUIPAMENTO)[number];

  @ApiPropertyOptional({ example: 'Fabricante X' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fabricante?: string;

  @ApiPropertyOptional({ example: '192.168.0.50' })
  @IsOptional()
  @IsIP()
  enderecoIp?: string;

  @ApiPropertyOptional({ example: 'Sala de TI' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  localizacao?: string;

  @ApiPropertyOptional({ example: 'C', description: 'Unidade da grandeza lida' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unidade?: string;

  @ApiPropertyOptional({ description: 'Abaixo disso gera alerta' })
  @IsOptional()
  @IsNumber()
  limiteMin?: number;

  @ApiPropertyOptional({ description: 'Acima disso gera alerta' })
  @IsOptional()
  @IsNumber()
  limiteMax?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class AtualizarEquipamentoDto extends PartialType(CriarEquipamentoDto) {}

export class ConsultaEquipamentosDto extends PaginacaoDto {
  @ApiPropertyOptional({ enum: TIPOS_EQUIPAMENTO })
  @IsOptional()
  @IsIn(TIPOS_EQUIPAMENTO)
  tipo?: string;

  @ApiPropertyOptional({ description: 'true ou false' })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({ description: 'Busca por parte do nome' })
  @IsOptional()
  @IsString()
  @Type(() => String)
  busca?: string;
}
