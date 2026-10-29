import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { configurarApp } from '../src/setup';

describe('API de monitoramento (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let operadorToken: string;

  const http = () => request(app.getHttpServer());
  const auth = (t: string) => ({ Authorization: 'Bearer ' + t });

  async function criarUsuarioELogar(email: string, nome: string) {
    await http().post('/auth/registro').send({ nome, email, senha: 'senha-forte-123' }).expect(201);
    const r = await http().post('/auth/login').send({ email, senha: 'senha-forte-123' }).expect(200);
    return r.body.accessToken as string;
  }

  async function criarEquipamento(extra: Record<string, unknown> = {}) {
    const r = await http()
      .post('/equipamentos')
      .set(auth(adminToken))
      .send({ nome: 'Sensor da sala', tipo: 'SENSOR', unidade: 'C', limiteMax: 50, limiteMin: 10, ...extra })
      .expect(201);
    return r.body.id as string;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configurarApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.alerta.deleteMany();
    await prisma.leitura.deleteMany();
    await prisma.equipamento.deleteMany();
    await prisma.usuario.deleteMany();
    adminToken = await criarUsuarioELogar('admin@teste.com', 'Admin');
    operadorToken = await criarUsuarioELogar('op@teste.com', 'Operador');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('saude e docs', () => {
    it('GET /health e publico', async () => {
      const r = await http().get('/health').expect(200);
      expect(r.body.status).toBe('ok');
    });

    it('GET /docs serve o Swagger', async () => {
      await http().get('/docs').expect(200);
    });
  });

  describe('auth', () => {
    it('registro nao devolve hash e define papeis corretamente', async () => {
      const eu = await http().get('/auth/eu').set(auth(adminToken)).expect(200);
      expect(eu.body.papel).toBe('ADMIN');
      const op = await http().get('/auth/eu').set(auth(operadorToken)).expect(200);
      expect(op.body.papel).toBe('OPERADOR');
    });

    it('recusa e-mail duplicado com 409', async () => {
      await http()
        .post('/auth/registro')
        .send({ nome: 'Outro', email: 'op@teste.com', senha: 'senha-forte-123' })
        .expect(409);
    });

    it('valida o corpo do registro (400)', async () => {
      const r = await http().post('/auth/registro').send({ nome: 'A', email: 'invalido', senha: '123' }).expect(400);
      expect(Array.isArray(r.body.mensagem)).toBe(true);
    });

    it('login com senha errada devolve 401', async () => {
      await http().post('/auth/login').send({ email: 'op@teste.com', senha: 'errada-errada' }).expect(401);
    });

    it('rota protegida sem token ou com token falso devolve 401', async () => {
      await http().get('/equipamentos').expect(401);
      await http().get('/equipamentos').set(auth('token.falso.aqui')).expect(401);
    });
  });

  describe('equipamentos', () => {
    it('ADMIN cria e OPERADOR nao pode criar (403)', async () => {
      await criarEquipamento();
      await http().post('/equipamentos').set(auth(operadorToken)).send({ nome: 'Camera 1', tipo: 'CAMERA' }).expect(403);
    });

    it('valida campos (tipo invalido, IP invalido, campo desconhecido)', async () => {
      const post = (corpo: object) => http().post('/equipamentos').set(auth(adminToken)).send(corpo);
      await post({ nome: 'Camera 1', tipo: 'GELADEIRA' }).expect(400);
      await post({ nome: 'Camera 1', tipo: 'CAMERA', enderecoIp: '999.1.1.1' }).expect(400);
      await post({ nome: 'Camera 1', tipo: 'CAMERA', campoExtra: 1 }).expect(400);
      await post({ nome: 'Camera 1', tipo: 'CAMERA', limiteMin: 9, limiteMax: 1 }).expect(400);
    });

    it('IP duplicado devolve 409', async () => {
      await criarEquipamento({ enderecoIp: '10.0.0.5' });
      await http()
        .post('/equipamentos')
        .set(auth(adminToken))
        .send({ nome: 'Outro sensor', tipo: 'SENSOR', enderecoIp: '10.0.0.5' })
        .expect(409);
    });

    it('lista com paginacao e filtros', async () => {
      for (let i = 1; i <= 5; i++) await criarEquipamento({ nome: 'Sensor ' + i });
      await criarEquipamento({ nome: 'Camera da entrada', tipo: 'CAMERA', ativo: false });

      const pag = await http().get('/equipamentos?page=2&limit=4').set(auth(operadorToken)).expect(200);
      expect(pag.body.data).toHaveLength(2);
      expect(pag.body.meta).toEqual({ total: 6, page: 2, limit: 4, totalPages: 2 });

      const porTipo = await http().get('/equipamentos?tipo=CAMERA').set(auth(operadorToken)).expect(200);
      expect(porTipo.body.meta.total).toBe(1);

      const inativos = await http().get('/equipamentos?ativo=false').set(auth(operadorToken)).expect(200);
      expect(inativos.body.data[0].nome).toBe('Camera da entrada');

      const busca = await http().get('/equipamentos?busca=entrada').set(auth(operadorToken)).expect(200);
      expect(busca.body.meta.total).toBe(1);

      await http().get('/equipamentos?limit=1000').set(auth(operadorToken)).expect(400);
    });

    it('atualiza, detalha e remove; id inexistente devolve 404', async () => {
      const id = await criarEquipamento();
      const up = await http().patch('/equipamentos/' + id).set(auth(adminToken)).send({ nome: 'Renomeado' }).expect(200);
      expect(up.body.nome).toBe('Renomeado');
      await http().get('/equipamentos/' + id).set(auth(operadorToken)).expect(200);
      await http().delete('/equipamentos/' + id).set(auth(adminToken)).expect(204);
      await http().get('/equipamentos/' + id).set(auth(operadorToken)).expect(404);
    });
  });

  describe('leituras e alertas', () => {
    it('registra leitura normal sem gerar alerta', async () => {
      const id = await criarEquipamento();
      const r = await http().post('/equipamentos/' + id + '/leituras').set(auth(operadorToken)).send({ valor: 25 }).expect(201);
      expect(r.body.leitura.valor).toBe(25);
      expect(r.body.alerta).toBeNull();
    });

    it('leitura acima do limite gera alerta que pode ser listado e reconhecido', async () => {
      const id = await criarEquipamento();
      const r = await http().post('/equipamentos/' + id + '/leituras').set(auth(operadorToken)).send({ valor: 75.5 }).expect(201);
      expect(r.body.alerta).toMatchObject({ tipo: 'ACIMA_DO_LIMITE', limite: 50, valor: 75.5 });

      await http().post('/equipamentos/' + id + '/leituras').set(auth(operadorToken)).send({ valor: 2 }).expect(201);
      const lista = await http().get('/alertas?equipamentoId=' + id).set(auth(operadorToken)).expect(200);
      expect(lista.body.meta.total).toBe(2);

      const alertaId = r.body.alerta.id;
      const rec = await http().patch('/alertas/' + alertaId + '/reconhecer').set(auth(operadorToken)).expect(200);
      expect(rec.body.reconhecido).toBe(true);
      const naoRec = await http().get('/alertas?reconhecido=false').set(auth(operadorToken)).expect(200);
      expect(naoRec.body.meta.total).toBe(1);
      await http().patch('/alertas/inexistente/reconhecer').set(auth(operadorToken)).expect(404);
    });

    it('valida o corpo da leitura e o equipamento', async () => {
      const id = await criarEquipamento();
      await http().post('/equipamentos/' + id + '/leituras').set(auth(operadorToken)).send({ valor: 'abc' }).expect(400);
      await http().post('/equipamentos/' + id + '/leituras').set(auth(operadorToken)).send({}).expect(400);
      await http().post('/equipamentos/nao-existe/leituras').set(auth(operadorToken)).send({ valor: 1 }).expect(404);
    });

    it('equipamento inativo nao aceita leituras (400)', async () => {
      const id = await criarEquipamento({ ativo: false });
      await http().post('/equipamentos/' + id + '/leituras').set(auth(operadorToken)).send({ valor: 1 }).expect(400);
    });

    it('lista leituras por periodo e agrega por hora', async () => {
      const id = await criarEquipamento({ limiteMax: 1000 });
      const enviar = (valor: number, registradaEm: string) =>
        http().post('/equipamentos/' + id + '/leituras').set(auth(operadorToken)).send({ valor, registradaEm }).expect(201);
      await enviar(10, '2026-01-15T10:05:00Z');
      await enviar(20, '2026-01-15T10:45:00Z');
      await enviar(30, '2026-01-15T11:10:00Z');
      await enviar(99, '2026-01-16T09:00:00Z');

      const periodo = await http()
        .get('/equipamentos/' + id + '/leituras?de=2026-01-15T00:00:00Z&ate=2026-01-15T23:59:59Z')
        .set(auth(operadorToken))
        .expect(200);
      expect(periodo.body.meta.total).toBe(3);

      const agg = await http()
        .get('/equipamentos/' + id + '/leituras/agregacao-horaria?de=2026-01-15T00:00:00Z&ate=2026-01-15T23:59:59Z')
        .set(auth(operadorToken))
        .expect(200);
      expect(agg.body).toEqual([
        { hora: '2026-01-15T10:00:00.000Z', media: 15, min: 10, max: 20, quantidade: 2 },
        { hora: '2026-01-15T11:00:00.000Z', media: 30, min: 30, max: 30, quantidade: 1 },
      ]);
    });

    it('agregacao exige de/ate e rejeita periodo invertido', async () => {
      const id = await criarEquipamento();
      await http().get('/equipamentos/' + id + '/leituras/agregacao-horaria').set(auth(operadorToken)).expect(400);
      await http()
        .get('/equipamentos/' + id + '/leituras/agregacao-horaria?de=2026-02-01T00:00:00Z&ate=2026-01-01T00:00:00Z')
        .set(auth(operadorToken))
        .expect(400);
    });

    it('remover o equipamento apaga leituras e alertas em cascata', async () => {
      const id = await criarEquipamento();
      await http().post('/equipamentos/' + id + '/leituras').set(auth(operadorToken)).send({ valor: 500 }).expect(201);
      await http().delete('/equipamentos/' + id).set(auth(adminToken)).expect(204);
      expect(await prisma.leitura.count()).toBe(0);
      expect(await prisma.alerta.count()).toBe(0);
    });
  });
});
