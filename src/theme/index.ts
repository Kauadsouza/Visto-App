/**
 * Tokens do Visto.
 *
 * As classes do Tailwind estão em tailwind.config.js. Este arquivo é para os
 * lugares em que a cor precisa ser um valor JS e não uma classe: animação,
 * StatusBar, cores de navegação, e os mapas semânticos.
 *
 * A hierarquia de profundidade NÃO usa sombra — em fundo escuro, sombra não
 * aparece. Ela vem de três coisas: cor de fundo, cor de borda e respiro.
 *
 * Há dois modos, dark e light. As classes Tailwind em tailwind.config.js
 * usam o prefixo `-escuro` / `-claro` e o app aplica `dark`/`light` na raiz
 * do HTML para alternar. As cores JS abaixo ficam disponíveis para código
 * que não pode ser classe (animações, StyleSheet nativo, etc).
 */

/**
 * Paleta dark, com tudo o que a UI atual consome. As classes Tailwind em
 * tailwind.config.js cuidam do resto; este objeto é para código que não
 * pode ser classe.
 */
export const cores = {
  // brand
  verde: '#22C55E',
  verdeClaro: '#4ADE80',
  verdeEscuro: '#15803D',

  // camadas escuras
  fundo: '#0B0F0C',
  fundo2: '#101511',
  superficie: '#161B17',
  superficie2: '#1E2420',
  superficie3: '#272E29',

  // bordas
  borda: '#252A26',
  bordaForte: '#3A4039',
  bordaVerde: '#1F7A3C',

  // texto
  texto: '#FFFFFF',
  texto2: '#D6DAD3',
  texto3: '#9CA39D',
  texto4: '#6F7671',

  // semânticos
  atencao: '#F5A524',
  erro: '#EF4444',
  info: '#3B82F6',
  sucesso: '#16A34A',
} as const;

export type Tema = 'dark' | 'light';

/** Tipo de cada paleta: as cores batem em nome, não em hex. */
export type Paleta = Record<keyof typeof cores, string>;

export const paletas: Record<Tema, Paleta> = {
  dark: cores,
  light: {
    verde: '#22C55E',
    verdeClaro: '#4ADE80',
    verdeEscuro: '#166534',
    fundo: '#FAF8F4',
    fundo2: '#F4F0E8',
    superficie: '#FFFFFF',
    superficie2: '#F2EDE3',
    superficie3: '#E8E1D2',
    borda: '#E2DAC7',
    bordaForte: '#C9C0A8',
    bordaVerde: '#A8D4B0',
    texto: '#0F1311',
    texto2: '#3F4541',
    texto3: '#6A706B',
    texto4: '#909999',
    atencao: '#B45309',
    erro: '#B91C1C',
    info: '#1D4ED8',
    sucesso: '#15803D',
  },
};

export const corTema = {
  verde: '#22C55E',
  verdeClaro: '#4ADE80',
  verdeEscuro: '#15803D',
  atencao: '#F5A524',
  erro: '#EF4444',
  info: '#3B82F6',
} as const;

export type Viabilidade = 'alta' | 'media' | 'baixa';

export const corViabilidade: Record<Viabilidade, string> = {
  alta: corTema.verde,
  media: corTema.atencao,
  baixa: corTema.erro,
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
export function elevacao(tema: Tema, nivel: 0 | 1 | 2 | 3 = 1) {
  const p = paletas[tema];
  const fundos = [p.fundo, p.superficie, p.superficie2, p.superficie3] as const;
  const bordas = [p.borda, p.borda, p.bordaForte, p.bordaForte] as const;
  return { fundo: fundos[nivel], borda: bordas[nivel] };
}

/**
 * Pega o tema ativo lendo a classe na raiz do app. Web lê o `<html class>`;
 * nativo, com tema fixo escuro, devolve `dark`.
 */
export function temaAtual(): Tema {
  if (typeof document !== 'undefined' && document.documentElement) {
    return document.documentElement.classList.contains('light') ? 'light' : 'dark';
  }
  return 'dark';
}

/**
 * Pega o tema atual e devolve a paleta correspondente. Componente que já
 * usa `cores` direto pode migrar pra isso com mudança mínima.
 */
export function paletaAtual(): Paleta {
  return paletas[temaAtual()];
}