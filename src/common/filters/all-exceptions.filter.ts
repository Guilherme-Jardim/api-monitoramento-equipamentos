import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

interface ErroTraduzido {
  status: number;
  mensagem: string | string[];
  erro: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const { status, mensagem, erro } = this.traduzir(exception);
    if (status >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    res.status(status).json({
      statusCode: status,
      erro,
      mensagem,
      caminho: req.url,
      timestamp: new Date().toISOString(),
    });
  }

  private traduzir(exception: unknown): ErroTraduzido {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const resp = exception.getResponse();
      const mensagem =
        typeof resp === 'string' ? resp : ((resp as { message?: string | string[] }).message ?? exception.message);
      return { status, mensagem, erro: HttpStatus[status] ?? 'ERRO' };
    }
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return { status: 409, mensagem: 'Registro duplicado para um campo unico', erro: 'CONFLICT' };
      }
      if (exception.code === 'P2025') {
        return { status: 404, mensagem: 'Registro nao encontrado', erro: 'NOT_FOUND' };
      }
    }
    return { status: 500, mensagem: 'Erro interno do servidor', erro: 'INTERNAL_SERVER_ERROR' };
  }
}
