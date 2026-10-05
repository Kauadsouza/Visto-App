import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Botao } from '@/components/Botao';
import { mensagemDe } from '@/lib/erros';
import { exigirSupabase } from '@/lib/supabase';
import { cores } from '@/theme';

/**
 * Destino do OAuth.
 *
 * Na web o Google volta para cá na URL. Como o cliente Supabase já foi criado
 * no boot do app, ele não processa essa URL sozinho — o intercâmbio do código
 * (PKCE) precisa ser feito aqui.
 *
 * No Android não é este o caminho: o login nativo usa `openAuthSessionAsync`,
 * que devolve a URL direto no código. A rota fica registrada como reserva para
 * quem abrir o link do Google manualmente.
 */
export default function Callback() {
  const { code, error: erroParam } = useLocalSearchParams<{
    code?: string;
    error?: string;
  }>();
  const [erro, setErro] = useState<string | null>(
    erroParam ? 'O login com Google foi recusado.' : null
  );
  const resolvido = useRef(false);

  useEffect(() => {
    // O StrictMode monta o efeito duas vezes em dev; sem esta trava a troca
    // de código seria executada duas vezes e a segunda falharia.
    if (resolvido.current) return;
    resolvido.current = true;

    async function concluir() {
      if (code) {
        const { error } = await exigirSupabase().auth.exchangeCodeForSession(code);
        if (error) {
          setErro(mensagemDe(error));
          return;
        }
      }

      router.replace('/questionario');
    }

    void concluir();
  }, [code]);

  if (erro) {
    return (
      <View className="flex-1 items-center justify-center bg-fundo px-8">
        <Text className="text-center text-base text-texto">{erro}</Text>
        <Botao
          titulo="Voltar para o login"
          variante="secundario"
          onPress={() => router.replace('/auth')}
          className="mt-8"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-fundo">
      <ActivityIndicator color={cores.verde} />
      <Text className="mt-4 text-sm text-texto-2">Concluindo seu login…</Text>
    </View>
  );
}