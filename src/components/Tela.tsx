import type { ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cores } from '@/theme';

/**
 * Casca de todas as telas.
 *
 * O app é Android primeiro, e no celular este componente não faz nada: a
 * coluna já tem menos de 520px, então o limite nunca morde.
 *
 * Ele existe para o navegador. Sem ele, a coluna de conteúdo gruda na
 * esquerda e os botões esticam pela tela inteira — foi o que apareceu na
 * primeira revisão do visual no desktop. Aqui a coluna é limitada e
 * centralizada, como se fosse um aparelho no meio da tela.
 *
 * A borda lateral é só na web: no aparelho ela viraria um filete de 1px
 * sem função nenhuma.
 */
export function Tela({ children }: { children: ReactNode }) {
  const web = Platform.OS === 'web';

  return (
    <View className="flex-1 items-center" style={{ backgroundColor: cores.fundo2 }}>
      <View
        className="h-full w-full"
        style={{
          maxWidth: 520,
          backgroundColor: cores.fundo,
          borderLeftWidth: web ? 1 : 0,
          borderRightWidth: web ? 1 : 0,
          borderColor: cores.borda,
        }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left', 'right']}>
          {children}
        </SafeAreaView>
      </View>
    </View>
  );
}