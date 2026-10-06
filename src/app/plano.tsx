import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarDays, Check, Lock, TriangleAlert } from 'lucide-react-native';

import { Botao } from '@/components/Botao';
import { Aviso, Barra, Card, Numero, Rotulo, TituloSecao } from '@/components/ui';
import { diagnosticar } from '@/lib/diagnostico';
import type { ItemPlano } from '@/lib/database.types';
import { calcularContador, emAnos, PAISES_SCHENGEN } from '@/lib/permissoes';
import { agruparPorFase, AVISO_CUSTOS, itensDaRota, moeda } from '@/lib/planos';
import { ITENS_FREE, temAcesso, usePlano } from '@/store/plano';
import { useQuestionario } from '@/store/questionario';
import { cores } from '@/theme';

const hojeISO = () => new Date().toISOString().slice(0, 10);

export default function Plano() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { rota } = useLocalSearchParams<{ rota?: string }>();

  const { respostas } = useQuestionario();
  const { assinatura, concluidos, viagens } = usePlano();

  const slug = useMemo(() => {
    if (rota) return rota;
    return diagnosticar(respostas).rotas[0]?.slug ?? 'espanha-estudo';
  }, [rota, respostas]);

  const itens = useMemo(() => itensDaRota(slug), [slug]);
  const contador = useMemo(() => calcularContador(viagens), [viagens]);
  const assinado = temAcesso(assinatura);

  const grupos = useMemo(() => agruparPorFase(itens), [itens]);
  const percentual = itens.length ? (concluidos.length / itens.length) * 100 : 0;

  return (
    <View className="flex-1 bg-fundo">
      <View style={{ paddingTop: insets.top }}>
        <ContadorDias contador={contador} />

        <View className="px-6 pb-5 pt-4">
          <View className="flex-row items-baseline justify-between">
            <Text className="text-lg font-semibold" style={{ color: cores.texto }}>
              Seu plano
            </Text>
            <Text className="text-sm" style={{ color: cores.texto3 }}>
              {`${concluidos.length} de ${itens.length}`}
            </Text>
          </View>

          <View className="mt-3">
            <Barra valor={percentual} />
          </View>

          <Pressable onPress={() => router.replace('/resultado')} className="mt-3 py-1">
            <Text className="text-caption" style={{ color: cores.verde }}>
              Trocar de rota
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
      >
        <Aviso texto={AVISO_CUSTOS} tom="atencao" Icone={TriangleAlert} />

        {/* Índice global do item, para o paywall valer sobre a lista inteira —
            e não fase por fase, senão daria para ver tudo só pulando de fase. */}
        <ChecklistAgrupado grupos={grupos} assinado={assinado} concluidos={concluidos} />

        {assinado ? (
          <Botao
            titulo="Gerenciar assinatura"
            variante="secundario"
            onPress={() => router.push('/pagamento')}
            className="mt-10"
          />
        ) : (
          <Paywall total={itens.length} visiveis={ITENS_FREE} />
        )}
      </ScrollView>
    </View>
  );
}

function ChecklistAgrupado({
  grupos,
  assinado,
  concluidos,
}: {
  grupos: ReturnType<typeof agruparPorFase>;
  assinado: boolean;
  concluidos: string[];
}) {
  const { alternarItem } = usePlano();
  let indiceGlobal = -1;

  return (
    <>
      {grupos.map((grupo) => {
        if (grupo.itens.length === 0) return null;

        return (
          <View key={grupo.fase}>
            <TituloSecao>{grupo.nome}</TituloSecao>

            {grupo.itens.map((item) => {
              indiceGlobal += 1;
              const id = `${grupo.fase}-${indiceGlobal}`;
              const bloqueado = !assinado && indiceGlobal >= ITENS_FREE;

              return bloqueado ? (
                <ItemBloqueado key={id} item={item} />
              ) : (
                <ItemChecklist
                  key={id}
                  id={id}
                  item={item}
                  concluido={concluidos.includes(id)}
                  aoAlternar={alternarItem}
                />
              );
            })}
          </View>
        );
      })}
    </>
  );
}

function ItemChecklist({
  item,
  concluido,
  id,
  aoAlternar,
}: {
  id: string;
  item: ItemPlano;
  concluido: boolean;
  aoAlternar: (id: string) => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: concluido }}
      onPress={() => aoAlternar(id)}
      className="mt-3 flex-row rounded-xl border p-4 active:opacity-80"
      style={{
        backgroundColor: concluido ? cores.fundo2 : cores.superficie,
        borderColor: concluido ? cores.bordaVerde : cores.borda,
      }}
    >
      <View
        className="mt-0.5 h-6 w-6 items-center justify-center rounded-lg border"
        style={{
          borderColor: concluido ? cores.verde : cores.bordaForte,
          backgroundColor: concluido ? cores.verde : 'transparent',
        }}
      >
        {concluido ? <Check size={14} color={cores.texto} /> : null}
      </View>

      <View className="ml-3 flex-1">
        <Text
          className="text-base font-semibold"
          style={{
            color: concluido ? cores.texto3 : cores.texto,
            textDecorationLine: concluido ? 'line-through' : 'none',
          }}
        >
          {item.titulo}
        </Text>
        <Text className="mt-1 text-sm leading-5" style={{ color: cores.texto2 }}>
          {item.descricao}
        </Text>

        <View className="mt-3 flex-row items-center justify-between">
          <Rotulo>{item.prazo}</Rotulo>
          <Text
            className="text-caption font-semibold"
            style={{ color: item.custo > 0 ? cores.verde : cores.texto4 }}
          >
            {moeda(item.custo)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function ItemBloqueado({ item }: { item: ItemPlano }) {
  return (
    <Card nivel={0} className="mt-3 flex-row items-center p-4">
      <Lock size={15} color={cores.texto4} />
      <Text className="ml-3 flex-1 text-base" style={{ color: cores.texto4 }}>
        {item.titulo}
      </Text>
    </Card>
  );
}

function Paywall({ total, visiveis }: { total: number; visiveis: number }) {
  const router = useRouter();

  return (
    <Card
      nivel={2}
      borda={cores.bordaVerde}
      className="mt-10 p-6"
    >
      <View
        className="h-11 w-11 items-center justify-center rounded-xl border"
        style={{ backgroundColor: `${cores.verde}14`, borderColor: cores.bordaVerde }}
      >
        <Lock size={19} color={cores.verde} />
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
          <CalendarDays size={15} color={cores.verde} />
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
          <Text className="text-caption font-semibold" style={{ color: cores.verde }}>
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
                      borderColor: escolhido ? cores.bordaVerde : cores.borda,
                      backgroundColor: escolhido ? `${cores.verde}14` : 'transparent',
                    }}
                  >
                    <Text
                      className="text-caption"
                      style={{ color: escolhido ? cores.verde : cores.texto3 }}
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