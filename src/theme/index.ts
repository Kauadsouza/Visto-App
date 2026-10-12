/**
 * Tokens do Visto.
 *
 * As classes do Tailwind estão em tailwind.config.js. Este arquivo é para os
 * lugares em que a cor precisa ser um valor JS e não uma classe: animação,
 * StatusBar, cores de navegação, e os mapas semânticos.
 *
 * Direção: editorial, sobre papel. Azul-marinho carrega a marca, dourado é
 * reservado para valor e para o selo de consultoria humana. Erro/atenção/info
 * são semânticos e não mudam de significado.
 *
 * A hierarquia de profundidade vem de três coisas: cor de fundo, cor de
 * borda e respiro. Sombra existe, mas é sutil — em papel claro ela trabalha;
 * em papel escuro vira sujeira.
 *
 * Há dois modos, dark e light. As classes Tailwind em tailwind.config.js usam
 * o prefixo `-escuro` / `-claro` e o app aplica `dark`/`light` na raiz do
 * HTML para alternar. As cores JS abaixo ficam disponíveis para código que
 * não pode ser classe (animações, StyleSheet nativo, etc).
 */

/**
 * Paleta light — a base. Papel quente, tinta quente, hairlines quentes.
 * Tudo aqui é pensado para ler em tela de celular com brilho de sol.
 */
export const cores = {
  // brand
  marinho: '#1B3A6B',
  marinhoClaro: '#2F5A9E',
  marinhoProfundo: '#12294D',
  dourado: '#C9A227',
  douradoClaro: '#E3C767',

  // camadas claras
  fundo: '#FBFAF8',
  fundo2: '#F5F2EC',
  superficie: '#FFFFFF',
  superficie2: '#F2EFE9',
  superficie3: '#E8E3D9',

  // bordas
  borda: '#E5E0D6',
  bordaForte: '#CFC7B8',
  bordaMarca: '#B9C6DC',

  // texto
  texto: '#16130F',
  texto2: '#4A453D',
  texto3: '#7A746A',
  texto4: '#A8A196',

  // semânticos — escolhidos para contraste AA sobre papel quente
  atencao: '#B45309',
  erro: '#B3261E',
  info: '#1D4ED8',
  sucesso: '#15803D',
} as const;

export type Tema = 'dark' | 'light';

/** Tipo de cada paleta: as cores batem em nome, não em hex. */
export type Paleta = Record<keyof typeof cores, string>;

export const paletas: Record<Tema, Paleta> = {
  light: cores,
  dark: {
    marinho: '#8FB0E0',
    marinhoClaro: '#A8C2E8',
    marinhoProfundo: '#5B87C4',
    dourado: '#E3C767',
    douradoClaro: '#F0D98F',
    fundo: '#141210',
    fundo2: '#1C1A16',
    superficie: '#232019',
    superficie2: '#2C2822',
    superficie3: '#38332B',
    borda: '#35302A',
    bordaForte: '#4C463C',
    bordaMarca: '#3E5578',
    texto: '#F7F4EE',
    texto2: '#D3CCC0',
    texto3: '#9C9488',
    texto4: '#6E675E',
    atencao: '#E0A458',
    erro: '#E57373',
    info: '#7EA6E8',
    sucesso: '#5DBE8A',
  },
};

export const corTema = {
  marinho: '#1B3A6B',
  marinhoClaro: '#2F5A9E',
  marinhoProfundo: '#12294D',
  dourado: '#C9A227',
  atencao: '#B45309',
  erro: '#B3261E',
  info: '#1D4ED8',
} as const;

export type Viabilidade = 'alta' | 'media' | 'baixa';

/**
 * Viabilidade é uma escala, não um semáforo. Três tons da mesma família:
 * quem lê "baixa" não lê uma luz vermelha de alerta, lê um tom mais apagado
 * da mesma tinta — e entende que é o mesmo sistema, só menos intenso.
 */
export const corViabilidade: Record<Viabilidade, string> = {
  alta: corTema.marinho,
  media: '#6E88B0',
  baixa: '#9AA7BC',
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
 * nativo, sem tema do sistema forçado, usa `light` — a paleta base.
 */
export function temaAtual(): Tema {
  if (typeof document !== 'undefined' && document.documentElement) {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }
  return 'light';
}

/**
 * Pega o tema atual e devolve a paleta correspondente. Componente que já
 * usa `cores` direto pode migrar pra isso com mudança mínima.
 */
export function paletaAtual(): Paleta {
  return paletas[temaAtual()];
}