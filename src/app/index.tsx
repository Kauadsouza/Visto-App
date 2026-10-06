import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Aviso, Barra, Card, Rotulo } from '@/components/ui';
import { Tela } from '@/components/Tela';
import { diagnosticar } from '@/lib/diagnostico';
import { calcularContador, emAnos } from '@/lib/permissoes';
import { itensDaRota } from '@/lib/planos';
import { corViabilidade, cores, rotuloViabilidade } from '@/theme';
import { usePlano } from '@/store/plano';
import { useQuestionario } from '@/store/questionario';
import { Check, ChevronRight, Compass } from 'lucide-react-native';

import { Botao } from '@/components/Botao';

/** Os três motivos que fazem a pessoa começar — e o que fica depois. */
const MOTIVOS = [
  { titulo: 'Caminho real, não genérico', texto: 'Só rotas que existem para brasileiros' },
  { titulo: 'Custo e prazo', texto: 'Quanto custa e quanto tempo demora' },
  { titulo: 'Checklist e contador', texto: 'O passo a passo e os dias que restam' },
];

/**
 * Tela de início.
 *
 * É o hub depois do primeiro acesso: onde a pessoa cai ao abrir o app, e
 * responde "o que eu faço agora?". Responde com três coisas — a rota
 * recomendada, quanto dela já foi feita, e quanto tempo resta no bloco
 * Schengen.
 */
export default function Inicio() {
  const router = useRouter();
  const { respostas } = useQuestionario();
  const { concluidos, viagens } = usePlano();

  const diagnostico = useMemo(() => diagnosticar(respostas), [respostas]);
  const principal = diagnostico.completo ? diagnostico.rotas[0] : null;

  const itens = useMemo(
    () => (principal ? itensDaRota(principal.slug) : []),
    [principal]
  );
  const contador = useMemo(() => calcularContador(viagens), [viagens]);

  const feitos = itens.filter((i, idx) =>
    concluidos.includes(`${i.fase}-${idx}`)
  ).length;
  const percentual = itens.length ? (feitos / itens.length) * 100 : 0;

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  // Sem questionário respondendo, a home vira um convite — não uma tela vazia.
  if (!principal) {
    return (
      <Tela>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 28 }}
        >
          <View className="flex-row items-center gap-3">
            <View
              className="h-11 w-11 items-center justify-center rounded-xl border"
              style={{ backgroundColor: `${cores.verde}14`, borderColor: cores.bordaVerde }}
            >
              <Compass size={22} color={cores.verde} />
            </View>
            <Rotulo cor={cores.verde}>visto</Rotulo>
          </View>

          <View className="mt-10 flex-1 justify-center">
            <Text className="text-4xl font-bold" style={{ color: cores.texto }}>
              Sair do Brasil{'\n'}é um processo.
            </Text>
            <Text className="mt-4 text-base leading-7" style={{ color: cores.texto2 }}>
              A gente mostra o caminho na ordem — custo, prazo e o que fazer
              primeiro.
            </Text>

            <View className="mt-8">
              {MOTIVOS.map((m) => (
                <View key={m.titulo} className="mb-4 flex-row">
                  <View
                    className="mt-0.5 h-6 w-6 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${cores.verde}1F` }}
                  >
                    <Check size={13} color={cores.verde} />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-semibold" style={{ color: cores.texto }}>
                      {m.titulo}
                    </Text>
                    <Text className="mt-0.5 text-caption leading-5" style={{ color: cores.texto3 }}>
                      {m.texto}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View className="pb-6">
            <Botao
              titulo="Começar o questionário"
              onPress={() => router.push('/questionario')}
            />
            <Text
              className="mt-4 text-center text-caption"
              style={{ color: cores.texto4 }}
            >
              8 perguntas, cerca de 2 minutos. Sem cadastro.
            </Text>
          </View>
        </ScrollView>
      </Tela>
    );
  }

  const cor = corViabilidade[principal.viabilidade];

  return (
    <Tela>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
      >
        <View className="flex-row items-end justify-between">
          <View>
            <Rotulo cor={cores.verde}>{saudacao.toLowerCase()}</Rotulo>
            <Text className="mt-1 text-2xl font-bold" style={{ color: cores.texto }}>
              Seu caminho
            </Text>
          </View>
        </View>

        {/* Rota principal: o número mais importante do app */}
        <Card nivel={2} borda={cores.bordaVerde} className="mt-6 p-6">
          <Rotulo>rota recomendada</Rotulo>

          <Text className="mt-3 text-2xl font-bold" style={{ color: cores.texto }}>
            {principal.nome}
          </Text>

          <View className="mt-3 flex-row items-center gap-2">
            <View
              className="rounded-full px-3 py-1"
              style={{ backgroundColor: `${cor}1F` }}
            >
              <Text className="text-caption font-semibold" style={{ color: cor }}>
                {rotuloViabilidade[principal.viabilidade]}
              </Text>
            </View>
            <Text className="text-caption" style={{ color: cores.texto3 }}>
              {`${principal.tempoMeses[0]}–${principal.tempoMeses[1]} meses`}
            </Text>
          </View>

          <Text className="mt-4 text-sm leading-6" style={{ color: cores.texto2 }}>
            {principal.resumo}
          </Text>

          <View className="mt-6">
            <View className="flex-row items-baseline justify-between">
              <Text className="text-caption font-semibold" style={{ color: cores.texto2 }}>
                {`${feitos} de ${itens.length} passos`}
              </Text>
              <Text className="text-caption" style={{ color: cores.texto3 }}>
                {`${Math.round(percentual)}%`}
              </Text>
            </View>
            <View className="mt-2">
              <Barra valor={percentual} altura={6} />
            </View>
          </View>

          <Pressable
            onPress={() => router.push({ pathname: '/plano', params: { rota: principal.slug } })}
            className="mt-6 flex-row items-center justify-center rounded-xl border py-4 active:opacity-80"
            style={{ backgroundColor: `${cores.verde}1F`, borderColor: cores.bordaVerde }}
          >
            <Text className="font-semibold" style={{ color: cores.verde }}>
              Continuar meu plano
            </Text>
            <ChevronRight size={17} color={cores.verde} className="ml-1" />
          </Pressable>
        </Card>

        {/* Duas coisas que a pessoa quer saber sem abrir outra tela */}
        <View className="mt-4 flex-row gap-3">
          <Card nivel={1} className="flex-1 p-4">
            <Rotulo>no país</Rotulo>
            <Text className="mt-2 text-2xl font-bold" style={{ color: cores.texto }}>
              {String(contador.diasNoPais)}
            </Text>
            <Text className="mt-1 text-caption leading-4" style={{ color: cores.texto3 }}>
              dias desde sua entrada
            </Text>
          </Card>

          <Card nivel={1} className="flex-1 p-4">
            <Rotulo>bloco 90/180</Rotulo>
            <Text
              className="mt-2 text-2xl font-bold"
              style={{
                color: contador.noLimiteSchengen ? cores.erro : cores.texto,
              }}
            >
              {String(contador.diasRestantesSchengen)}
            </Text>
            <Text className="mt-1 text-caption leading-4" style={{ color: cores.texto3 }}>
              dias ainda disponíveis
            </Text>
          </Card>
        </View>

        <Card nivel={1} className="mt-3 flex-row items-center p-4">
          <View className="flex-1">
            <Rotulo>residência na espanha</Rotulo>
            <Text className="mt-2 text-lg font-bold" style={{ color: cores.texto }}>
              {`${emAnos(contador.diasParaResidencia)} de 5,0 anos`}
            </Text>
            <View className="mt-3">
              <Barra
                valor={(contador.diasParaResidencia / contador.diasMetaResidencia) * 100}
                altura={5}
                cor={cores.info}
              />
            </View>
          </View>
        </Card>

        <View className="mt-6">
          <Aviso
            tom="atencao"
            texto="Custos e prazos são estimativas educacionais, não tabelas oficiais de consulado. Confirme cada valor na fonte antes de decidir por ele."
          />
        </View>

        <View className="mt-6 gap-3">
          <Atalho
            titulo="Ver meu diagnóstico"
            descricao="As três rotas e por que elas ficaram assim"
            aoTocar={() => router.push('/resultado')}
          />
          <Atalho
            titulo="Refazer questionário"
            descricao="Seu perfil mudou? Recalcule em 2 minutos"
            aoTocar={() => {
              router.push('/questionario');
            }}
          />
          <Atalho
            titulo="Gerenciar acesso"
            descricao="Assinatura e cancelamento"
            aoTocar={() => router.push('/pagamento')}
          />
        </View>
      </ScrollView>
    </Tela>
  );
}

function Atalho({
  titulo,
  descricao,
  aoTocar,
}: {
  titulo: string;
  descricao: string;
  aoTocar: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={aoTocar}
      className="flex-row items-center rounded-xl border p-4 active:opacity-80"
      style={{ backgroundColor: cores.superficie, borderColor: cores.borda }}
    >
      <View className="flex-1 pr-3">
        <Text className="text-base font-semibold" style={{ color: cores.texto }}>
          {titulo}
        </Text>
        <Text className="mt-0.5 text-caption" style={{ color: cores.texto3 }}>
          {descricao}
        </Text>
      </View>
      <ChevronRight size={18} color={cores.texto4} />
    </Pressable>
  );
}