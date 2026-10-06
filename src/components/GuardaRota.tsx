import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';

import { MODO_SEM_BACKEND } from '@/lib/config';
import { useAuth } from '@/store/auth';
import { cores } from '@/theme';

/** Rotas que qualquer pessoa pode ver, mesmo sem sessão. */
const SEM_LOGIN = ['onboarding', 'auth'] as const;

/**
 * Rotas liberadas sem sessão.
 *
 * Com o Supabase ainda fora do ar (`MODO_SEM_BACKEND`), a home e o fluxo de
 * diagnóstico ficam liberados: é o modo de desenvolvimento, em que tudo roda
 * só com estado local. Ao ligar o backend, esta lista volta a ser apenas
 * onboarding e auth, e o resto passa a exigir login.
 */
const AREA_PUBLICA: readonly string[] = MODO_SEM_BACKEND
  ? [...SEM_LOGIN, 'questionario', 'resultado', 'plano', 'pagamento', 'como-funciona', 'consultoria', 'conta', '(tabs)', 'index']
  : SEM_LOGIN;

/**
 * Rota de destino depois do login.
 *
 * A home (/) é o índice do Expo Router: `useSegments` devolve uma lista
 * vazia quando ela está no ar, então ela nunca aparece em `segments[0]`.
 */
const DESTINO = '/';

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

    // A rota índice (a home) não tem nome: `segments[0]` vem indefinido.
    const atual = segments[0];
    const naHome = atual === undefined;
    const liberada = naHome || AREA_PUBLICA.includes(atual);

    if (!session) {
      // Sem sessão: só as rotas liberadas são acessíveis.
      if (!liberada) router.replace('/onboarding');
      return;
    }

    // Com sessão: não faz sentido ver onboarding nem login de novo.
    if (SEM_LOGIN.includes(atual as (typeof SEM_LOGIN)[number])) {
      router.replace(DESTINO);
    }
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