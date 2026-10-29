import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Papel } from '../common/decorators/roles.decorator';
import { LoginDto, RegistrarDto } from './dto/auth.dto';
import { PasswordService } from './password.service';
import { UsuariosRepository } from './usuarios.repository';

export interface UsuarioAutenticado {
  sub: string;
  email: string;
  papel: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarios: UsuariosRepository,
    private readonly senhas: PasswordService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async registrar(dto: RegistrarDto) {
    const email = dto.email.toLowerCase();
    if (await this.usuarios.buscarPorEmail(email)) {
      throw new ConflictException('E-mail ja cadastrado');
    }
    const adminEmail = this.config.get<string>('ADMIN_EMAIL')?.toLowerCase();
    const papel = adminEmail && adminEmail === email ? Papel.ADMIN : Papel.OPERADOR;
    const criado = await this.usuarios.criar({
      email,
      nome: dto.nome,
      senhaHash: await this.senhas.hash(dto.senha),
      papel,
    });
    return { id: criado.id, nome: criado.nome, email: criado.email, papel: criado.papel };
  }

  async login(dto: LoginDto) {
    const usuario = await this.usuarios.buscarPorEmail(dto.email.toLowerCase());
    const valido = usuario ? await this.senhas.verificar(dto.senha, usuario.senhaHash) : false;
    if (!usuario || !valido) {
      throw new UnauthorizedException('Credenciais invalidas');
    }
    const payload: UsuarioAutenticado = { sub: usuario.id, email: usuario.email, papel: usuario.papel };
    return { accessToken: await this.jwt.signAsync(payload), tipo: 'Bearer' };
  }
}
