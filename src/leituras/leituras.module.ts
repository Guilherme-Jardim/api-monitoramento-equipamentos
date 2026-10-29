import { Module } from '@nestjs/common';
import { AlertasModule } from '../alertas/alertas.module';
import { EquipamentosModule } from '../equipamentos/equipamentos.module';
import { LeiturasController } from './leituras.controller';
import { LeiturasRepository } from './leituras.repository';
import { LeiturasService } from './leituras.service';

@Module({
  imports: [EquipamentosModule, AlertasModule],
  controllers: [LeiturasController],
  providers: [LeiturasService, LeiturasRepository],
})
export class LeiturasModule {}
