/**
 * Paleta do Visto.
 *
 * As classes do NativeWind vêm do `tailwind.config.js`. Este arquivo existe para
 * os lugares onde a cor precisa ser um valor JS e não uma classe: animação,
 * StatusBar, cores de navegação e ícones Lucide.
 */

export const cores = {
  fundo: '#0A0A0A',
  fundo2: '#0F1115',
  superficie: '#161A1D',
  superficie2: '#1F2429',
  borda: '#2A2F34',

  verde: '#16A34A',
  verdeClaro: '#4ADE80',
  verdeEscuro: '#15803D',

  texto: '#FFFFFF',
  texto2: '#A1A1AA',
  texto3: '#71717A',

  atencao: '#F59E0B',
  erro: '#DC2626',
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
