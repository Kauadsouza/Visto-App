import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Botao } from '@/components/Botao';
import { cores } from '@/theme';

/**
 * Shell da tela de auth. A lógica real (Supabase email/senha + Google) entra na
 * Etapa 3 — o que existe aqui garante que o fluxo do app é navegável já.
 */
export default function Auth() {
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    router.replace('/onboarding');
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-fundo px-8">
      <Text className="text-lg text-texto-2">Preparando o acesso…</Text>
      <View className="mt-6 h-12 w-12 rounded-full border border-borda bg-superficie" />
      <Botao
        titulo="Voltar"
        variante="fantasma"
        carregando={carregando}
        onPress={() => router.replace('/onboarding')}
        className="mt-8"
      />
      <Text style={{ color: cores.texto3 }} className="mt-4 text-xs">
        Tela de login entra na próxima etapa.
      </Text>
    </View>
  );
}