import { avaliarLimites } from './avaliar-limites';

describe('avaliarLimites', () => {
  it('nao alerta quando nao ha limites configurados', () => {
    expect(avaliarLimites(999, null, null)).toBeNull();
    expect(avaliarLimites(999, undefined, undefined)).toBeNull();
  });

  it('alerta acima do maximo', () => {
    expect(avaliarLimites(80, 10, 70)).toEqual({ tipo: 'ACIMA_DO_LIMITE', limite: 70 });
  });

  it('alerta abaixo do minimo', () => {
    expect(avaliarLimites(5, 10, 70)).toEqual({ tipo: 'ABAIXO_DO_LIMITE', limite: 10 });
  });

  it('nao alerta exatamente sobre o limite nem dentro da faixa', () => {
    expect(avaliarLimites(70, 10, 70)).toBeNull();
    expect(avaliarLimites(10, 10, 70)).toBeNull();
    expect(avaliarLimites(40, 10, 70)).toBeNull();
  });

  it('trata limite zero como limite valido', () => {
    expect(avaliarLimites(-1, 0, null)).toEqual({ tipo: 'ABAIXO_DO_LIMITE', limite: 0 });
  });
});
