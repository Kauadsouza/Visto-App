import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarDays, Lock, TriangleAlert } from 'lucide-react-native';

import { Botao } from '@/components/Botao';
import { Tela } from '@/components/Tela';
import { Trilha } from '@/components/Trilha';
import { Aviso, Barra, Card, Numero, Rotulo } from '@/components/ui';
import { diagnosticar } from '@/lib/diagnostico';
import type { ItemPlano } from '@/lib/database.types';
import { calcularContador, emAnos, PAISES_SCHENGEN } from '@/lib/permissoes';
import {
  agruparPorFase,
  AVISO_CUSTOS,
  FASES,
  idDoItem,
  itensDaRota,
  moeda,
} from '@/lib/planos';
import { ITENS_FREE, temAcesso, usePlano } from '@/store/plano';
import { useQuestionario } from '@/store/questionario';
import { cores } from '@/theme';

const hojeISO = () => new Date().toISOString().slice(0, 10);

export default function Plano() {
  const router = useRouter();
  const { rota } = useLocalSearchParams<{ rota?: string }>();

  const { respostas } = useQuestionario();
  const { assinatura, concluidos, viagens, alternarItem } = usePlano();

  const slug = useMemo(() => {
    if (rota) return rota;
    return diagnosticar(respostas).rotas[0]?.slug ?? 'espanha-estudo';
  }, [rota, respostas]);

  const itens = useMemo(() => itensDaRota(slug), [slug]);
  const contador = useMemo(() => calcularContador(viagens), [viagens]);
  const assinado = temAcesso(assinatura);

  const grupos = useMemo(() => agruparPorFase(itens), [itens]);
  const percentual = itens.length ? (concluidos.length / itens.length) * 100 : 0;

  // O id do item é calculado uma vez e repassado à trilha, para que o toque
  // aqui e a contagem no topo nunca discordem do que a tela marca.
  const idDe = useCallback(
    (fase: (typeof FASES)[number]['id'], indiceNoGrupo: number) =>
      idDoItem(itens, fase, indiceNoGrupo, grupos),
    [itens, grupos]
  );

  const quantoGasto = useMemo(
    () =>
      itens.reduce(
        (soma, item, i) => (concluidos.includes(idDe(item.fase, i)) ? soma + item.custo : soma),
        0
      ),
    [itens, concluidos, idDe]
  );

  return (
    <Tela>
    <View className="flex-1">
      <View>
        <ContadorDias contador={contador} />

        <View className="px-7 pb-5 pt-6">
          <Rotulo cor={cores.marinho}>sua trilha</Rotulo>
          <Text className="mt-2 font-serif text-3xl font-bold" style={{ color: cores.texto }}>
            {rotuloRota(itens, slug)}
          </Text>

          <View className="mt-5 flex-row items-end justify-between">
            <View>
              <Text className="text-caption" style={{ color: cores.texto3 }}>
                {`${concluidos.length} de ${itens.length} passos feitos`}
              </Text>
              <Text className="mt-1 text-2xl font-bold" style={{ color: cores.marinho }}>
                {`${Math.round(percentual)}%`}
              </Text>
            </View>
            {quantoGasto > 0 ? (
              <View className="items-end">
                <Text className="text-caption" style={{ color: cores.texto3 }}>
                  já investido
                </Text>
                <Text className="mt-1 text-2xl font-bold" style={{ color: cores.texto }}>
                  {moeda(quantoGasto)}
                </Text>
              </View>
            ) : null}
          </View>

          <View className="mt-4">
            <Barra valor={percentual} altura={6} />
          </View>

          <Pressable onPress={() => router.replace('/resultado')} className="mt-4 py-1">
            <Text className="text-caption font-semibold" style={{ color: cores.marinho }}>
              Trocar de rota
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 40 }}
      >
        <Aviso texto={AVISO_CUSTOS} tom="atencao" Icone={TriangleAlert} />

        <View className="mt-6">
          <Trilha
            grupos={grupos}
            idDe={idDe}
            concluidos={concluidos}
            aoAlternar={alternarItem}
            assinado={assinado}
          />
        </View>

        {assinado ? (
          <Botao
            titulo="Gerenciar assinatura"
            variante="secundario"
            onPress={() => router.push('/pagamento')}
            className="mt-6"
          />
        ) : (
          <Paywall total={itens.length} visiveis={ITENS_FREE} />
        )}
      </ScrollView>
    </View>
    </Tela>
  );
}

/** Nome da rota pelo slug, sem trazer a tabela de diagnóstico para a tela. */
function rotuloRota(itens: ItemPlano[], slug: string): string {
  const nomes: Record<string, string> = {
    'reino-unidos-estudo': 'Inglaterra',
    'espanha-estudo': 'Espanha',
    'espanha-digital-nomad': 'Espanha',
  };
  return nomes[slug] ?? 'Seu caminho';
}

function Paywall({ total, visiveis }: { total: number; visiveis: number }) {
  const router = useRouter();

  return (
    <Card
      nivel={2}
      borda={cores.bordaMarca}
      className="mt-10 p-6"
    >
      <View
        className="h-11 w-11 items-center justify-center rounded-xl border"
        style={{ backgroundColor: `${cores.marinho}14`, borderColor: cores.bordaMarca }}
      >
        <Lock size={19} color={cores.marinho} />
      </View>

      <Text className="mt-4 text-xl font-bold" style={{ color: cores.texto }}>
        {`Faltam ${total - visiveis} passos do seu plano`}
      </Text>
      <Text className="mt-2 text-sm leading-6" style={{ color: cores.texto2 }}>
        Os itens completos — com prazos e custos de cada etapa — ficam liberados
        com o acesso completo. Você já viu os primeiros {visiveis}.
      </Text>

      <Botao
        titulo="Assinar acesso completo"
        onPress={() => router.push('/pagamento')}
        className="mt-6"
      />
    </Card>
  );
}

/** Contador fixo no topo, com entrada de data. */
function ContadorDias({ contador }: { contador: ReturnType<typeof calcularContador> }) {
  const { viagens, registrarEntrada, registrarSaida } = usePlano();
  const [pais, setPais] = useState('Portugal');
  const [data, setData] = useState(hojeISO());
  const [editando, setEditando] = useState(false);

  const atual = viagens.find((v) => v.data_saida === null);

  return (
    <View className="px-6 pt-4">
      <Card nivel={1} className="p-5">
        <View className="flex-row items-center gap-2">
          <CalendarDays size={15} color={cores.marinho} />
          <Rotulo cor={cores.texto2}>seu contador</Rotulo>
        </View>

        <View className="mt-4 flex-row">
          <Numero
            rotulo="Dias no país atual"
            valor={String(contador.diasNoPais)}
          />
          <Numero
            rotulo="Restantes no bloco 90/180"
            valor={String(contador.diasRestantesSchengen)}
            cor={contador.noLimiteSchengen ? cores.erro : cores.texto}
          />
          <Numero
            rotulo="Para residência na Espanha"
            valor={`${emAnos(contador.diasParaResidencia)} anos`}
          />
        </View>

        {contador.noLimiteSchengen && contador.liberaEm ? (
          <View className="mt-4">
            <Aviso
              tom="erro"
              texto={`Você atingiu os 90 dias no bloco Schengen. O contador reabre em ${contador.liberaEm.toLocaleDateString('pt-BR')}.`}
            />
          </View>
        ) : null}

        <Pressable onPress={() => setEditando(!editando)} className="mt-4 py-1">
          <Text className="text-caption font-semibold" style={{ color: cores.marinho }}>
            {editando
              ? 'Fechar'
              : atual
                ? 'Corrigir data de entrada'
                : 'Registrar entrada'}
          </Text>
        </Pressable>

        {editando ? (
          <View className="mt-4">
            <TextInput
              value={pais}
              onChangeText={setPais}
              placeholder="País onde você está"
              placeholderTextColor={cores.texto4}
              className="h-11 rounded-lg border bg-fundo px-3 text-sm"
              style={{ borderColor: cores.borda, color: cores.texto }}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-3"
              contentContainerStyle={{ gap: 6 }}
            >
              {PAISES_SCHENGEN.slice(0, 8).map((p) => {
                const escolhido = p === pais;
                return (
                  <Pressable
                    key={p}
                    onPress={() => setPais(p)}
                    className="rounded-full border px-3 py-1"
                    style={{
                      borderColor: escolhido ? cores.bordaMarca : cores.borda,
                      backgroundColor: escolhido ? `${cores.marinho}14` : 'transparent',
                    }}
                  >
                    <Text
                      className="text-caption"
                      style={{ color: escolhido ? cores.marinho : cores.texto3 }}
                    >
                      {p}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <TextInput
              value={data}
              onChangeText={setData}
              placeholder="aaaa-mm-dd"
              placeholderTextColor={cores.texto4}
              className="mt-3 h-11 rounded-lg border bg-fundo px-3 text-sm"
              style={{ borderColor: cores.borda, color: cores.texto }}
            />

            <Botao
              titulo={atual ? 'Salvar saída' : 'Registrar entrada'}
              variante="secundario"
              tamanho="md"
              onPress={() => (atual ? registrarSaida(data) : registrarEntrada(pais, data))}
              className="mt-4"
            />

            <Text className="mt-3 text-caption leading-4" style={{ color: cores.texto4 }}>
              Regras simplificadas do espaço Schengen. O oficial é o registro de
              movimentos do consulado.
            </Text>
          </View>
        ) : null}
      </Card>
    </View>
  );
}