import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { paletas, temaAtual, type Tema } from '@/theme';

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
 *
 * Também aplica a classe `light`/`dark` no `<html>` do navegador, que é
 * como o NativeWind decide o esquema de cor. Trocar o tema recarrega a
 * paleta em todas as telas.
 */
export function Tela({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>('dark');
  const web = Platform.OS === 'web';

  useEffect(() => {
    if (typeof document === 'undefined') return;
    setTema(temaAtual());
    const html = document.documentElement;
    // Garante a classe coerente no boot — pode estar faltando no SSR.
    if (!html.classList.contains('light') && !html.classList.contains('dark')) {
      html.classList.add('dark');
    }
  }, []);

  const cores = paletas[tema];
  const webFora = tema === 'dark' ? '#050807' : '#E8E1D2';

  return (
    <View
      className="flex-1 items-center"
      style={{ backgroundColor: webFora }}
    >
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

/** Hook para ler e alternar o tema ativo. */
export function useTema(): [Tema, (t: Tema) => void] {
  const [tema, setTema] = useState<Tema>(temaAtual());

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    html.classList.remove('light', 'dark');
    html.classList.add(tema);
  }, [tema]);

  return [tema, setTema];
}