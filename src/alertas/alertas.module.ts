import { Module } from '@nestjs/common';
import { AlertasController } from './alertas.controller';
import { AlertasRepository } from './alertas.repository';
import { AlertasService } from './alertas.service';

@Module({
  controllers: [AlertasController],
  providers: [AlertasService, AlertasRepository],
  exports: [AlertasService],
})
export class AlertasModule {}
