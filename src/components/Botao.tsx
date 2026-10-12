import { ActivityIndicator, Pressable, Text, View, type PressableProps } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { cores } from '@/theme';

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo';
type Tamanho = 'md' | 'lg';

type Props = Omit<PressableProps, 'children'> & {
  titulo: string;
  variante?: Variante;
  tamanho?: Tamanho;
  carregando?: boolean;
  cheio?: boolean;
  /** Ícone opcional à esquerda do rótulo. */
  icone?: LucideIcon;
  /** Ícone opcional à direita — usado no CTA principal, que aponta adiante. */
  iconeFim?: LucideIcon;
};

const FUNDO: Record<Variante, { bg: string; borda: string; texto: string }> = {
  primario: { bg: cores.marinho, borda: cores.marinhoProfundo, texto: '#FFFFFF' },
  secundario: { bg: cores.superficie, borda: cores.bordaForte, texto: cores.texto },
  fantasma: { bg: 'transparent', borda: 'transparent', texto: cores.marinho },
  perigo: { bg: 'transparent', borda: `${cores.erro}47`, texto: cores.erro },
};

const ALTURA: Record<Tamanho, string> = { md: 'h-12', lg: 'h-14' };

export function Botao({
  titulo,
  variante = 'primario',
  tamanho = 'lg',
  carregando = false,
  cheio = true,
  disabled,
  icone: Icone,
  iconeFim: IconeFim,
  className = '',
  ...resto
}: Props) {
  const estilo = FUNDO[variante];
  const tamanhoIcone = tamanho === 'lg' ? 18 : 16;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled || carregando) }}
      disabled={disabled || carregando}
      className={[
        'flex-row items-center justify-center rounded-xl border active:opacity-80',
        ALTURA[tamanho],
        cheio ? 'w-full' : '',
        disabled && !carregando ? 'opacity-40' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={[
        { backgroundColor: estilo.bg, borderColor: estilo.borda },
        // Sombra só no primário: é o único que precisa parecer clicável em
        // profundidade. Nos demais, a borda já separa.
        variante === 'primario'
          ? {
              shadowColor: cores.marinho,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.24,
              shadowRadius: 8,
              elevation: 3,
            }
          : null,
      ]}
      {...resto}
    >
      {carregando ? (
        <ActivityIndicator color={estilo.texto} />
      ) : (
        <>
          {Icone ? (
            <View className="mr-2">
              <Icone size={tamanhoIcone} color={estilo.texto} />
            </View>
          ) : null}
          <Text className="text-base font-semibold" style={{ color: estilo.texto }}>
            {titulo}
          </Text>
          {IconeFim ? (
            <View className="ml-1">
              <IconeFim size={tamanhoIcone} color={estilo.texto} />
            </View>
          ) : null}
        </>
      )}
    </Pressable>
  );
}