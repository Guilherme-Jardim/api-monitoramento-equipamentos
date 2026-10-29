export type TipoAlerta = 'ACIMA_DO_LIMITE' | 'ABAIXO_DO_LIMITE';

export interface ResultadoAvaliacao {
  tipo: TipoAlerta;
  limite: number;
}

/** Retorna o alerta que o valor dispara, ou null se estiver dentro dos limites. */
export function avaliarLimites(
  valor: number,
  limiteMin: number | null | undefined,
  limiteMax: number | null | undefined,
): ResultadoAvaliacao | null {
  if (limiteMax !== null && limiteMax !== undefined && valor > limiteMax) {
    return { tipo: 'ACIMA_DO_LIMITE', limite: limiteMax };
  }
  if (limiteMin !== null && limiteMin !== undefined && valor < limiteMin) {
    return { tipo: 'ABAIXO_DO_LIMITE', limite: limiteMin };
  }
  return null;
}
