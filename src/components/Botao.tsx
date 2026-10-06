import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

import { cores } from '@/theme';

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo';
type Tamanho = 'md' | 'lg';

type Props = Omit<PressableProps, 'children'> & {
  titulo: string;
  variante?: Variante;
  tamanho?: Tamanho;
  carregando?: boolean;
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
  const ehPrimario = variante === 'primario';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled || carregando) }}
      disabled={disabled || carregando}
      className={[
        'items-center justify-center rounded-xl border active:opacity-80',
        ALTURA[tamanho],
        cheio ? 'w-full' : '',
        disabled && !carregando ? 'opacity-40' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        ehPrimario
          ? {
              // Gradiente de marca. Em modo escuro, ganha sombra sutil de
              // brilho para parecer vivo; em claro, fica chapado.
              backgroundColor: cores.verde,
              borderColor: cores.verdeEscuro,
              shadowColor: cores.verde,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
              elevation: 6,
            }
          : { backgroundColor: estilo.bg, borderColor: estilo.borda }
      }
      {...resto}
    >
      {carregando ? (
        <ActivityIndicator color={estilo.texto} />
      ) : (
        <Text
          className="text-base font-semibold tracking-wide"
          style={{ color: estilo.texto }}
        >
          {titulo}
        </Text>
      )}
    </Pressable>
  );
}