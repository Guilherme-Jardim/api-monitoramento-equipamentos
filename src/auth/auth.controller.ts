import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto, RegistrarDto } from './dto/auth.dto';
import { RequisicaoAutenticada } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('registro')
  @ApiOperation({ summary: 'Cadastra um usuario (OPERADOR, ou ADMIN se o e-mail for o ADMIN_EMAIL)' })
  registrar(@Body() dto: RegistrarDto) {
    return this.auth.registrar(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Autentica e devolve o token JWT' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @ApiBearerAuth()
  @Get('eu')
  @ApiOperation({ summary: 'Dados do usuario autenticado' })
  eu(@Req() req: RequisicaoAutenticada) {
    return req.user;
  }
}
