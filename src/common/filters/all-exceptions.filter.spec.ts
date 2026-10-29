import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AllExceptionsFilter } from './all-exceptions.filter';

function executar(erro: unknown) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }), getRequest: () => ({ url: '/teste' }) }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  new AllExceptionsFilter().catch(erro, host);
  return { status: status.mock.calls[0][0], corpo: json.mock.calls[0][0] };
}

describe('AllExceptionsFilter', () => {
  it('formata HttpException com mensagem e caminho', () => {
    const { status, corpo } = executar(new NotFoundException('Equipamento nao encontrado'));
    expect(status).toBe(404);
    expect(corpo).toMatchObject({ statusCode: 404, mensagem: 'Equipamento nao encontrado', caminho: '/teste' });
  });

  it('preserva a lista de erros de validacao', () => {
    const { corpo } = executar(new BadRequestException(['nome muito curto', 'tipo invalido']));
    expect(corpo.mensagem).toEqual(['nome muito curto', 'tipo invalido']);
  });

  it('traduz violacao de unicidade do Prisma para 409', () => {
    const erro = new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x' });
    expect(executar(erro).status).toBe(409);
  });

  it('esconde detalhes de erros inesperados (500)', () => {
    const { status, corpo } = executar(new Error('senha do banco: segredo'));
    expect(status).toBe(500);
    expect(JSON.stringify(corpo)).not.toContain('segredo');
  });
});
