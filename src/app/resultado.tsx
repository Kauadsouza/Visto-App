import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Info, TriangleAlert } from 'lucide-react-native';

import { Cabecalho } from '@/components/Cabecalho';
import { avisoComplementares, diagnosticar, type Rota } from '@/lib/diagnostico';
import { AVISO_CUSTOS } from '@/lib/planos';
import { corViabilidade, cores, rotuloViabilidade } from '@/theme';
import { useQuestionario } from '@/store/questionario';

const moeda = (v: number) => `R$ ${v.toLocaleString('pt-BR')}`;

export default function Resultado() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { respostas, indice, irPara, reiniciar } = useQuestionario();

  const resultado = useMemo(() => diagnosticar(respostas), [respostas]);

  // Perfil incompleto não tem diagnóstico para mostrar: o caminho certo é
  // voltar a perguntar, não inventar um resultado.
  if (!resultado.completo) {
    return (
      <View className="flex-1 bg-fundo">
        <Cabecalho titulo="Seu diagnóstico" />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-base leading-7 text-texto-2">
            Faltam algumas respostas para montar seu diagnóstico. Volte e
            complete o questionário.
          </Text>
          <Pressable
            onPress={() => {
              reiniciar();
              irPara(0);
            }}
            className="mt-8 rounded-xl border border-borda bg-superficie px-6 py-4 active:opacity-80"
          >
            <Text className="text-base font-semibold text-verde">
              Refazer questionário
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-fundo">
      <View style={{ paddingTop: insets.top }}>
        <Cabecalho titulo="Seu diagnóstico" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
      >
        <View className="mb-5 flex-row rounded-xl border border-borda bg-superficie p-4">
          <Info size={18} color={cores.texto3} className="mt-0.5" />
          <Text className="ml-3 flex-1 text-xs leading-5 text-texto-2">
            Este resultado é uma estimativa baseada no seu perfil. Não é
            assessoria jurídica. Consulte um advogado imigracionista para
            decisão final.
          </Text>
        </View>

        {avisoComplementares(resultado.avisos).map((aviso) => (
          <View
            key={aviso}
            className="mb-3 rounded-xl border border-atencao/40 bg-atencao/10 p-4"
          >
            <Text className="text-sm leading-5 text-texto">{aviso}</Text>
          </View>
        ))}

        <Text className="mt-2 text-xs uppercase tracking-widest text-texto-3">
          {`${resultado.rotas.length} caminhos para o seu perfil`}
        </Text>

        <View className="mt-3 flex-row rounded-xl border border-atencao/40 bg-atencao/10 p-4">
          <TriangleAlert size={16} color={cores.atencao} className="mt-0.5" />
          <Text className="ml-3 flex-1 text-xs leading-5 text-texto-2">
            {AVISO_CUSTOS}
          </Text>
        </View>

        {resultado.rotas.map((rota) => (
          <CardRota key={rota.slug} rota={rota} />
        ))}

        <Pressable
          onPress={() => {
            reiniciar();
            irPara(0);
          }}
          className="mt-4 items-center py-4"
        >
          <Text className="text-sm text-texto-3">
            Refazer o questionário
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function CardRota({ rota }: { rota: Rota }) {
  const router = useRouter();
  const cor = corViabilidade[rota.viabilidade];

  return (
    <View className="mt-4 rounded-2xl border border-borda bg-superficie p-5">
      <View className="flex-row items-start justify-between">
        <Text className="flex-1 pr-3 text-lg font-bold text-texto">
          {rota.nome}
        </Text>
        <View
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: `${cor}22` }}
        >
          <Text className="text-xs font-semibold" style={{ color: cor }}>
            {rotuloViabilidade[rota.viabilidade]}
          </Text>
        </View>
      </View>

      <Text className="mt-3 text-sm leading-6 text-texto-2">{rota.resumo}</Text>

      <View className="mt-4 flex-row gap-6">
        <View>
          <Text className="text-xs uppercase tracking-widest text-texto-3">
            Custo estimado
          </Text>
          <Text className="mt-1 text-sm font-semibold text-texto">
            {`${moeda(rota.custoMin)} – ${moeda(rota.custoMax)}`}
          </Text>
        </View>
        <View>
          <Text className="text-xs uppercase tracking-widest text-texto-3">
            Tempo estimado
          </Text>
          <Text className="mt-1 text-sm font-semibold text-texto">
            {`${rota.tempoMeses[0]} a ${rota.tempoMeses[1]} meses`}
          </Text>
        </View>
      </View>

      <Text className="mt-5 text-xs uppercase tracking-widest text-texto-3">
        O que você vai precisar fazer
      </Text>
      {rota.passos.map((passo, i) => (
        <View key={passo} className="mt-2 flex-row">
          <Text className="mr-2 text-sm font-semibold text-verde">{`${i + 1}.`}</Text>
          <Text className="flex-1 text-sm leading-5 text-texto-2">{passo}</Text>
        </View>
      ))}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/plano', params: { rota: rota.slug } })}
        className="mt-5 flex-row items-center justify-center rounded-xl border border-verde bg-verde/10 py-4 active:opacity-80"
      >
        <Text className="font-semibold text-verde">Ver meu plano completo</Text>
        <ChevronRight size={18} color={cores.verde} className="ml-1" />
      </Pressable>
    </View>
  );
}