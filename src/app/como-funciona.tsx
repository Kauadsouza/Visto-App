import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Check, Info } from 'lucide-react-native';

import { Botao } from '@/components/Botao';
import { Tela } from '@/components/Tela';
import { Aviso, Rotulo } from '@/components/ui';
import { cores } from '@/theme';

const ETAPAS = [
  {
    rotulo: 'passo 1',
    titulo: '3 blocos de perguntas',
    texto:
      'Você responde 8 perguntas sobre perfil, dinheiro e objetivo. Leva cerca de 2 minutos, sem cadastro.',
  },
  {
    rotulo: 'passo 2',
    titulo: 'Diagnóstico',
    texto:
      'A gente cruza seu perfil com as regras dos consulados e mostra até 3 rotas viáveis, com viabilidade alta, média ou baixa.',
  },
  {
    rotulo: 'passo 3',
    titulo: 'Plano',
    texto:
      'Para cada rota, você vê custo, prazo e a lista de passos — na ordem certa — sem promessa mágica.',
  },
  {
    rotulo: 'passo 4',
    titulo: 'Checklist e contador',
    texto:
      'Você marca o que já fez, conta os dias no bloco 90/180 e acompanha o tempo de residência para a cidadania.',
  },
];

export default function ComoFunciona() {
  return (
    <Tela>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 }}
      >
        <Rotulo cor={cores.verde}>como funciona</Rotulo>
        <Text className="mt-2 text-3xl font-bold" style={{ color: cores.texto }}>
          O que o app faz por você
        </Text>
        <Text
          className="mt-3 text-base leading-7"
          style={{ color: cores.texto2 }}
        >
          Quatro passos para entender seu caminho de imigração antes de gastar
          dinheiro com quem promete demais.
        </Text>

        <View className="mt-8">
          {ETAPAS.map((etapa) => (
            <View
              key={etapa.titulo}
              className="mb-3 flex-row rounded-2xl border p-5"
              style={{ backgroundColor: cores.superficie, borderColor: cores.borda }}
            >
              <View
                className="mr-4 h-6 w-6 items-center justify-center rounded-full"
                style={{ backgroundColor: `${cores.verde}1F` }}
              >
                <Check size={13} color={cores.verde} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-label font-semibold uppercase"
                  style={{ color: cores.texto3 }}
                >
                  {etapa.rotulo}
                </Text>
                <Text
                  className="mt-1 text-lg font-semibold"
                  style={{ color: cores.texto }}
                >
                  {etapa.titulo}
                </Text>
                <Text
                  className="mt-2 text-sm leading-6"
                  style={{ color: cores.texto2 }}
                >
                  {etapa.texto}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View className="mt-4">
          <Aviso
            texto="Não é assessoria jurídica. Custos e prazos são estimativas educacionais, não tabelas oficiais de consulado."
            Icone={Info}
          />
        </View>

        <View className="mt-8">
          <Botao titulo="Começar" onPress={() => router.push('/questionario')} />
        </View>
      </ScrollView>
    </Tela>
  );
}