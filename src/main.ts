import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarApp } from './setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configurarApp(app);
  const porta = Number(process.env.PORT ?? 3000);
  await app.listen(porta);
  console.log('API no ar em http://localhost:' + porta + ' (docs em /docs)');
}

bootstrap();
