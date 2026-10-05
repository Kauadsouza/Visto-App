import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';

import { useAuth } from '@/store/auth';
import { cores } from '@/theme';

/** Rotas que alguém sem sessão pode ver. */
const AREA_PUBLICA = ['onboarding', 'auth'] as const;

/**
 * Portão de sessão.
 *
 * Sem isso, o app abriria direto na tela protegida para quem não está logado
 * (e a RLS rejeitaria as queries depois). Fica no layout raiz, acima do Stack,
 * para que a decisão aconteça uma vez só.
 */
export function GuardaRota({ children }: { children: React.ReactNode }) {
  const { session, carregando } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (carregando) return;

    const atual = segments[0];
    const naAreaPublica = AREA_PUBLICA.includes(atual as (typeof AREA_PUBLICA)[number]);

    if (!session) {
      // Sem sessão: só o onboarding e o auth são acessíveis.
      if (!naAreaPublica) router.replace('/onboarding');
      return;
    }

    // Com sessão: não faz sentido ver onboarding nem login de novo.
    if (naAreaPublica) router.replace('/questionario');
  }, [session, carregando, segments, router]);

  // Enquanto o token do disco não foi lido, não decidimos nada — senão a tela
  // protegida apareceria por um frame antes de redirecionar.
  if (carregando) {
    return (
      <View className="flex-1 items-center justify-center bg-fundo">
        <ActivityIndicator color={cores.verde} />
      </View>
    );
  }

  return <>{children}</>;
}