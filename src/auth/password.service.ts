import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCb) as (senha: string, salt: Buffer, tamanho: number) => Promise<Buffer>;
const TAMANHO_CHAVE = 64;

@Injectable()
export class PasswordService {
  async hash(senha: string): Promise<string> {
    const salt = randomBytes(16);
    const derivada = await scrypt(senha, salt, TAMANHO_CHAVE);
    return salt.toString('hex') + ':' + derivada.toString('hex');
  }

  async verificar(senha: string, armazenado: string): Promise<boolean> {
    const [saltHex, hashHex] = armazenado.split(':');
    if (!saltHex || !hashHex) return false;
    const esperado = Buffer.from(hashHex, 'hex');
    const derivada = await scrypt(senha, Buffer.from(saltHex, 'hex'), esperado.length);
    return derivada.length === esperado.length && timingSafeEqual(derivada, esperado);
  }
}
