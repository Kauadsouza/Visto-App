import { Text, View } from 'react-native';

import { Cabecalho } from '@/components/Cabecalho';

/**
 * Tela protegida que abre depois do login.
 *
 * As 8 perguntas entram aqui na Etapa 4. Por enquanto existe para que o fluxo
 * de auth seja testável de ponta a ponta: login -> tela protegida -> logout.
 */
export default function Questionario() {
  return (
    <View className="flex-1 bg-fundo">
      <Cabecalho titulo="Seu perfil" />
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-center text-base leading-7 text-texto-2">
          As 8 perguntas do questionário entram na próxima etapa.
        </Text>
        <Text className="mt-3 text-center text-sm text-texto-3">
          Se você chegou até aqui, o login e a sessão persistente estão
          funcionando.
        </Text>
      </View>
    </View>
  );
}