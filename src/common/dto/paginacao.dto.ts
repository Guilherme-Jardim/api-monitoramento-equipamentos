import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginacaoDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}

export interface Pagina<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function montarPagina<T>(data: T[], total: number, page: number, limit: number): Pagina<T> {
  return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export function calcularSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}
