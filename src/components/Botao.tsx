import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

import { cores } from '@/theme';

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo';
type Tamanho = 'md' | 'lg';

type Props = Omit<PressableProps, 'children'> & {
  titulo: string;
  variante?: Variante;
  tamanho?: Tamanho;
  carregando?: boolean;
  /** Largura total do pai. Desligue quando o botão divide espaço com outro. */
  cheio?: boolean;
};

const FUNDO: Record<Variante, { bg: string; borda: string; texto: string }> = {
  primario: { bg: cores.verde, borda: cores.verde, texto: '#FFFFFF' },
  secundario: { bg: cores.superficie2, borda: cores.bordaForte, texto: cores.texto },
  fantasma: { bg: 'transparent', borda: 'transparent', texto: cores.texto2 },
  perigo: { bg: 'transparent', borda: '#4A2222', texto: '#F87171' },
};

const ALTURA: Record<Tamanho, string> = { md: 'h-12', lg: 'h-14' };

export function Botao({
  titulo,
  variante = 'primario',
  tamanho = 'lg',
  carregando = false,
  cheio = true,
  disabled,
  className = '',
  ...resto
}: Props) {
  const estilo = FUNDO[variante];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled || carregando) }}
      disabled={disabled || carregando}
      className={[
        'items-center justify-center rounded-xl border active:opacity-75',
        ALTURA[tamanho],
        cheio ? 'w-full' : '',
        disabled && !carregando ? 'opacity-40' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ backgroundColor: estilo.bg, borderColor: estilo.borda }}
      {...resto}
    >
      {carregando ? (
        <ActivityIndicator color={estilo.texto} />
      ) : (
        <Text className="text-base font-semibold" style={{ color: estilo.texto }}>
          {titulo}
        </Text>
      )}
    </Pressable>
  );
}