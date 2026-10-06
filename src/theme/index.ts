/**
 * Tokens do Visto.
 *
 * As classes do Tailwind estão em tailwind.config.js. Este arquivo é para os
 * lugares em que a cor precisa ser um valor JS e não uma classe: animação,
 * StatusBar, cores de navegação, e os mapas semânticos.
 *
 * A hierarquia de profundidade NÃO usa sombra — em fundo escuro, sombra não
 * aparece. Ela vem de três coisas: cor de fundo, cor de borda e respiro.
 */

export const cores = {
  fundo: '#0A0A0A',
  fundo2: '#0E1116',
  superficie: '#14181D',
  superficie2: '#1B2026',
  superficie3: '#232930',

  borda: '#22282F',
  bordaForte: '#323A43',
  bordaVerde: '#1F7A3C',

  verde: '#16A34A',
  verdeClaro: '#4ADE80',
  verdeEscuro: '#15803D',

  texto: '#FFFFFF',
  texto2: '#C2C9D1',
  texto3: '#8A929C',
  texto4: '#5F6873',

  atencao: '#F5A524',
  erro: '#EF4444',
  info: '#3B82F6',
} as const;

export type Viabilidade = 'alta' | 'media' | 'baixa';

export const corViabilidade: Record<Viabilidade, string> = {
  alta: cores.verde,
  media: cores.atencao,
  baixa: cores.erro,
};

export const rotuloViabilidade: Record<Viabilidade, string> = {
  alta: 'Viabilidade alta',
  media: 'Viabilidade média',
  baixa: 'Viabilidade baixa',
};

/**
 * Nível de elevação = cor de fundo + cor de borda.
 * Usar em qualquer card que "flutua" sobre a tela.
 */
export const elevacao = {
  0: { fundo: cores.fundo, borda: cores.borda },
  1: { fundo: cores.superficie, borda: cores.borda },
  2: { fundo: cores.superficie2, borda: cores.bordaForte },
  3: { fundo: cores.superficie3, borda: cores.bordaForte },
} as const;