import { agruparPorHora } from './agregacao';

const d = (iso: string) => new Date(iso);

describe('agruparPorHora', () => {
  it('retorna lista vazia sem leituras', () => {
    expect(agruparPorHora([])).toEqual([]);
  });

  it('calcula media, minimo, maximo e quantidade por hora', () => {
    const r = agruparPorHora([
      { valor: 10, registradaEm: d('2026-01-15T10:05:00Z') },
      { valor: 20, registradaEm: d('2026-01-15T10:55:00Z') },
      { valor: 40, registradaEm: d('2026-01-15T10:30:00Z') },
    ]);
    expect(r).toEqual([
      { hora: '2026-01-15T10:00:00.000Z', media: 23.3333, min: 10, max: 40, quantidade: 3 },
    ]);
  });

  it('separa horas diferentes e ordena cronologicamente', () => {
    const r = agruparPorHora([
      { valor: 5, registradaEm: d('2026-01-15T12:00:00Z') },
      { valor: 1, registradaEm: d('2026-01-15T09:59:59Z') },
    ]);
    expect(r.map((p) => p.hora)).toEqual(['2026-01-15T09:00:00.000Z', '2026-01-15T12:00:00.000Z']);
  });
});
