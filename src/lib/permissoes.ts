/**
 * =============================================================
 * Contador de dias — regras do contador
 * =============================================================
 *
 * Funções puras, com entrada e saída explícita, para poderem ser testadas e
 * para não dependerem de nada do banco.
 *
 * -------------------------------------------------------------
 * AVISO HONESTO
 * -------------------------------------------------------------
 * As regras aqui são uma simplificação. O espaço Schengen é uma janela móvel
 * de 180 dias corridos, contada a partir da data de hoje, e o limite é de 90
 * dias dentro dela. O app calcula assim porque é o que dá para fazer sem a
 * Traveler do consulate — mas o oficial é o Historical Movement Record.
 *
 * Da mesma forma, residência na Espanha depende de tipo de autorização,
 * tempo já contado antes e de decisões do consulado. Os números aqui são
 * referência de planejamento, nunca uma previsão de resultado.
 * =============================================================
 */

import type { RegistroViagem } from '@/lib/database.types';

/** Países no espaço Schengen, para somar a janela de 180 dias. */
export const PAISES_SCHENGEN = [
  'Alemanha',
  'Áustria',
  'Bélgica',
  'Croácia',
  'Dinamarca',
  'Espanha',
  'Estônia',
  'Finlândia',
  'França',
  'Grécia',
  'Hungria',
  'Islândia',
  'Itália',
  'Luxemburgo',
  'Malta',
  'Países Baixos',
  'Polônia',
  'Portugal',
  'República Tcheca',
  'Suíça',
];

const SCHENGEN = new Set(PAISES_SCHENGEN.map((p) => p.toLowerCase()));

export const ehSchengen = (pais: string) => SCHENGEN.has(pais.trim().toLowerCase());

const DIA_MS = 86_400_000;

/** Data em `yyyy-mm-dd` como dia UTC — sem fuso, sem surpresa de horário. */
function paraDia(iso: string): Date {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}

const diasEntre = (de: Date, ate: Date) =>
  Math.max(0, Math.round((ate.getTime() - de.getTime()) / DIA_MS));

export interface Contador {
  /** Dia da entrada, ou null se nunca entrou. */
  diaEntrada: Date | null;
  /** Quantos dias está no país atual. */
  diasNoPais: number;
  /** Dias já consumidos na janela Schengen de 180 dias. */
  diasSchengenUsados: number;
  /** Dias que ainda pode ficar no bloco. Nunca negativo. */
  diasRestantesSchengen: number;
  /** Data em que o bloco de 90 dias se abre de novo. Null se não estiver no limite. */
  liberaEm: Date | null;
  /** Dias acumulados de permanência para a residência. */
  diasParaResidencia: number;
  /** Total de dias necessários para a residência (5 anos). */
  diasMetaResidencia: number;
  /** true quando o limite de 90 dias foi atingido. */
  noLimiteSchengen: boolean;
}

/** Meta: residência de longa duração na Espanha pede 5 anos de permanência. */
export const META_RESIDENCIA_DIAS = 365 * 5;

/**
 * Calcula o contador para um conjunto de registros.
 *
 * `registros` são entradas e saídas por país; um registro sem `data_saida`
 * significa que a pessoa ainda está lá.
 */
export function calcularContador(
  registros: Pick<RegistroViagem, 'pais' | 'data_entrada' | 'data_saida'>[],
  hoje = new Date()
): Contador {
  const hojeUtc = new Date(
    Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate())
  );

  // Ordena por entrada: o registro mais antigo em aberto é "o país atual".
  const ordenados = [...registros].sort((a, b) =>
    a.data_entrada.localeCompare(b.data_entrada)
  );

  const aberta = ordenados.find((r) => r.data_saida === null);

  // Duas contagens deliberadamente diferentes:
  //
  //  · diasNoPais — dias DECORRIDOS desde a entrada (contagem exclusiva).
  //    É o que a pessoa sente: "faz 30 dias que cheguei".
  //
  //  · diasSchengenUsados — dias PRESENTES no território (contagem inclusiva,
  //    dia da entrada e dia da saída contam). É o que o consulado olha.
  //
  // Contar a menos no Schengen mostraria mais dias disponíveis do que a pessoa
  // tem, e ela só descobriria o erro no balcão. Errar para menos é o lado
  // seguro.
  const diasNoPais = aberta
    ? diasEntre(
        paraDia(aberta.data_entrada),
        aberta.data_saida ? paraDia(aberta.data_saida) : hojeUtc
      )
    : 0;

  // --- janela Schengen de 180 dias ---
  const inicioJanela = new Date(hojeUtc.getTime() - 179 * DIA_MS);
  let usados = 0;

  for (const registro of ordenados) {
    if (!ehSchengen(registro.pais)) continue;

    const entrada = paraDia(registro.data_entrada);
    const saida = registro.data_saida ? paraDia(registro.data_saida) : hojeUtc;

    // Recorta o intervalo pela janela móvel.
    const inicio = entrada > inicioJanela ? entrada : inicioJanela;
    const fim = saida < hojeUtc ? saida : hojeUtc;

    if (fim >= inicio) usados += diasEntre(inicio, fim) + 1;
  }

  const restantes = Math.max(0, 90 - usados);

  // Se estourou, projeta quando um dia da janela mais antiga sai.
  let liberaEm: Date | null = null;
  if (usados >= 90) {
    const entradasSchengen = ordenados
      .filter((r) => ehSchengen(r.pais))
      .map((r) => paraDia(r.data_entrada))
      .sort((a, b) => a.getTime() - b.getTime());

    if (entradasSchengen.length > 0) {
      liberaEm = new Date(entradasSchengen[0].getTime() + 180 * DIA_MS);
    }
  }

  // --- permanência para residência ---
  // Só conta o que está dentro do espaço Schengen e ainda está válido.
  let paraResidencia = 0;
  for (const registro of ordenados) {
    if (!ehSchengen(registro.pais)) continue;

    const entrada = paraDia(registro.data_entrada);
    const saida = registro.data_saida ? paraDia(registro.data_saida) : hojeUtc;
    const fim = saida < hojeUtc ? saida : hojeUtc;

    if (fim >= entrada) paraResidencia += diasEntre(entrada, fim);
  }

  return {
    diaEntrada: aberta ? paraDia(aberta.data_entrada) : null,
    diasNoPais,
    diasSchengenUsados: usados,
    diasRestantesSchengen: restantes,
    liberaEm,
    diasParaResidencia: paraResidencia,
    diasMetaResidencia: META_RESIDENCIA_DIAS,
    noLimiteSchengen: usados >= 90,
  };
}

/** Anos em uma casa decimal: 485 dias vira "1,3 anos". */
export function emAnos(dias: number): string {
  return (dias / 365).toFixed(1).replace('.', ',');
}