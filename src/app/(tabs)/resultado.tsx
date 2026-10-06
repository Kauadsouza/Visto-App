import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Info, TriangleAlert } from 'lucide-react-native';

import { Tela } from '@/components/Tela';
import { Aviso, Card, Etiqueta, Numero, Rotulo } from '@/components/ui';
import { avisoComplementares, diagnosticar, type Rota } from '@/lib/diagnostico';
import { AVISO_CUSTOS } from '@/lib/planos';
import { corViabilidade, cores, rotuloViabilidade } from '@/theme';
import { useQuestionario } from '@/store/questionario';

const moeda = (v: number) => `R$ ${v.toLocaleString('pt-BR')}`;

/** Preenchimento da barra de viabilidade. Alto = 100, médio = 60, baixo = 25. */
const LARGURA_VIABILIDADE = { alta: 100, media: 60, baixa: 25 } as const;

export default function Resultado() {
  const router = useRouter();
  const { respostas, reiniciar, irPara } = useQuestionario();

  const resultado = useMemo(() => diagnosticar(respostas), [respostas]);

  if (!resultado.completo) {
    const temRespostas = Object.values(respostas).some((v) => v.trim().length > 0);

    return (
      <Tela>
      <View className="flex-1">
        <CabecalhoSimples titulo="Seu diagnóstico" />

        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-base leading-7" style={{ color: cores.texto2 }}>
            {temRespostas
              ? 'Faltam algumas respostas para montar seu diagnóstico. Complete o questionário para ver as três rotas.'
              : 'Responda 8 perguntas e você vê quais caminhos de imigração são viáveis para o seu perfil.'}
          </Text>

          <View className="mt-8 w-full">
            <Pressable
              onPress={() => router.push(temRespostas ? '/questionario' : '/')}
              className="h-14 w-full items-center justify-center rounded-xl border active:opacity-80"
              style={{ backgroundColor: cores.verde, borderColor: cores.verde }}
            >
              <Text className="text-base font-semibold" style={{ color: '#FFFFFF' }}>
                {temRespostas ? 'Continuar questionário' : 'Começar questionário'}
              </Text>
            </Pressable>

            {temRespostas ? (
              <Pressable
                onPress={() => router.replace('/')}
                className="mt-3 h-12 w-full items-center justify-center rounded-xl border active:opacity-80"
                style={{ backgroundColor: cores.superficie, borderColor: cores.borda }}
              >
                <Text className="text-sm font-semibold" style={{ color: cores.texto2 }}>
                  Voltar para a home
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
      </Tela>
    );
  }

  return (
    <Tela>
    <View className="flex-1">
      <View>
        <CabecalhoSimples
          titulo="Seu diagnóstico"
          subtitulo={`${resultado.rotas.length} caminhos para o seu perfil`}
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
      >
        <Aviso
          texto="Este resultado é uma estimativa baseada no seu perfil. Não é assessoria jurídica. Consulte um advogado imigracionista para decisão final."
          Icone={Info}
        />

        {avisoComplementares(resultado.avisos).map((aviso) => (
          <View key={aviso} className="mt-3">
            <Aviso texto={aviso} tom="atencao" />
          </View>
        ))}

        <View className="mt-5">
          <Aviso texto={AVISO_CUSTOS} tom="atencao" Icone={TriangleAlert} />
        </View>

        <View className="mt-6">
          {resultado.rotas.map((rota) => (
            <CardRota key={rota.slug} rota={rota} />
          ))}
        </View>

        <Pressable
          onPress={() => {
            reiniciar();
            irPara(0);
          }}
          className="mt-8 items-center py-4"
        >
          <Text className="text-sm" style={{ color: cores.texto3 }}>
            Refazer o questionário
          </Text>
        </Pressable>
      </ScrollView>
    </View>
    </Tela>
  );
}

/** Cabeçalho sem o botão de sair — o resultado não é tela protegida ainda. */
function CabecalhoSimples({ titulo, subtitulo }: { titulo: string; subtitulo?: string }) {
  return (
    <View className="px-6 pb-5 pt-2">
      <Text className="text-lg font-semibold" style={{ color: cores.texto }}>
        {titulo}
      </Text>
      {subtitulo ? (
        <Text className="mt-0.5 text-caption" style={{ color: cores.texto3 }}>
          {subtitulo}
        </Text>
      ) : null}
    </View>
  );
}

function CardRota({ rota }: { rota: Rota }) {
  const router = useRouter();
  const cor = corViabilidade[rota.viabilidade];

  return (
    <Card nivel={1} className="mt-4 p-5">
      <View className="flex-row items-start justify-between gap-3">
        <Text className="flex-1 text-xl font-bold" style={{ color: cores.texto }}>
          {rota.nome}
        </Text>
        <Etiqueta texto={rotuloViabilidade[rota.viabilidade]} cor={cor} />
      </View>

      {/* Barra fina na cor da viabilidade: leitura do risco antes de ler o texto */}
      <View
        className="mt-4 h-1 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: cores.superficie3 }}
      >
        <View
          className="h-full rounded-full"
          style={{ width: `${LARGURA_VIABILIDADE[rota.viabilidade]}%`, backgroundColor: cor }}
        />
      </View>

      <Text className="mt-4 text-sm leading-6" style={{ color: cores.texto2 }}>
        {rota.resumo}
      </Text>

      {/* Custo e prazo em colunas — os dois números que a pessoa mais procura */}
      <View className="mt-5 flex-row gap-6">
        <Numero rotulo="Custo estimado" valor={`${moeda(rota.custoMin)} – ${moeda(rota.custoMax)}`} tamanho={17} />
        <Numero rotulo="Tempo estimado" valor={`${rota.tempoMeses[0]}–${rota.tempoMeses[1]} meses`} tamanho={17} />
      </View>

      <View className="mt-6">
        <Rotulo>O que você vai precisar fazer</Rotulo>
        {rota.passos.map((passo, i) => (
          <View key={passo} className="mt-3 flex-row">
            <View
              className="mr-3 h-5 w-5 items-center justify-center rounded-full"
              style={{ backgroundColor: `${cores.verde}1F` }}
            >
              <Text className="text-caption font-bold" style={{ color: cores.verde }}>
                {`${i + 1}`}
              </Text>
            </View>
            <Text className="flex-1 text-sm leading-5" style={{ color: cores.texto2 }}>
              {passo}
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/plano', params: { rota: rota.slug } })}
        className="mt-6 flex-row items-center justify-center rounded-xl border py-4 active:opacity-80"
        style={{ backgroundColor: `${cores.verde}14`, borderColor: cores.bordaVerde }}
      >
        <Text className="font-semibold" style={{ color: cores.verde }}>
          Ver meu plano completo
        </Text>
        <ChevronRight size={17} color={cores.verde} className="ml-1" />
      </Pressable>
    </Card>
  );
}