import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

import { cores } from '@/theme';

type Variante = 'primario' | 'secundario' | 'fantasma';

type Props = Omit<PressableProps, 'children'> & {
  titulo: string;
  variante?: Variante;
  carregando?: boolean;
};

const estilos: Record<Variante, { bg: string; texto: string; borda: string }> = {
  primario: { bg: cores.verde, texto: cores.texto, borda: cores.verde },
  secundario: { bg: 'transparent', texto: cores.texto, borda: cores.borda },
  fantasma: { bg: 'transparent', texto: cores.texto2, borda: 'transparent' },
};

export function Botao({
  titulo,
  variante = 'primario',
  carregando = false,
  disabled,
  className = '',
  ...resto
}: Props) {
  const estilo = estilos[variante];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || carregando}
      className={`h-14 w-full items-center justify-center rounded-xl border active:opacity-80 ${className}`}
      style={{ backgroundColor: estilo.bg, borderColor: estilo.borda }}
      {...resto}
    >
      {carregando ? (
        <ActivityIndicator color={estilo.texto} />
      ) : (
        <Text
          className="text-base font-semibold"
          style={{ color: estilo.texto }}
        >
          {titulo}
        </Text>
      )}
    </Pressable>
  );
}
