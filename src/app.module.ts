import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AlertasModule } from './alertas/alertas.module';
import { AuthModule } from './auth/auth.module';
import { EquipamentosModule } from './equipamentos/equipamentos.module';
import { HealthController } from './health.controller';
import { LeiturasModule } from './leituras/leituras.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    EquipamentosModule,
    AlertasModule,
    LeiturasModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
