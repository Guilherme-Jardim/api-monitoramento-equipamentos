import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('saude')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  verificar() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
