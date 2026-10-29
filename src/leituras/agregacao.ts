export interface PontoAgregado {
  hora: string;
  media: number;
  min: number;
  max: number;
  quantidade: number;
}

/** Agrupa leituras por hora cheia (UTC) e calcula media, minimo e maximo. */
export function agruparPorHora(leituras: { valor: number; registradaEm: Date }[]): PontoAgregado[] {
  const grupos = new Map<string, number[]>();
  for (const l of leituras) {
    const d = new Date(l.registradaEm);
    d.setUTCMinutes(0, 0, 0);
    const chave = d.toISOString();
    const lista = grupos.get(chave);
    if (lista) lista.push(l.valor);
    else grupos.set(chave, [l.valor]);
  }
  return [...grupos.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hora, valores]) => ({
      hora,
      media: Number((valores.reduce((s, v) => s + v, 0) / valores.length).toFixed(4)),
      min: Math.min(...valores),
      max: Math.max(...valores),
      quantidade: valores.length,
    }));
}
