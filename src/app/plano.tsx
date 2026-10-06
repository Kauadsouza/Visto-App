import { Text, View } from 'react-native';

import { Cabecalho } from '@/components/Cabecalho';

/**
 * Placeholder do plano.
 *
 * O checklist, o contador de dias e o paywall chegam na Etapa 6. A rota existe
 * para o CTA "Ver meu plano completo" não quebrar.
 */
export default function Plano() {
  return (
    <View className="flex-1 bg-fundo">
      <Cabecalho titulo="Seu plano" />
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-center text-base leading-7 text-texto-2">
          O checklist personalizado e o contador de dias entram na Etapa 6.
        </Text>
      </View>
    </View>
  );
}