import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarDays, Check, Lock } from 'lucide-react-native';

import { Botao } from '@/components/Botao';
import { Cabecalho } from '@/components/Cabecalho';
import { TriangleAlert } from 'lucide-react-native';
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

  // Sem rota na URL (acesso direto pela aba), usa a melhor do diagnóstico.
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
        <Cabecalho titulo="Seu plano" />
        <ContadorDias contador={contador} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
      >
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-sm text-texto-2">
            {`${concluidos.length} de ${itens.length} passos concluídos`}
          </Text>
          <Pressable onPress={() => router.replace('/resultado')} className="py-2">
            <Text className="text-sm text-verde">Trocar de rota</Text>
          </Pressable>
        </View>

        <View className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-superficie-2">
          <View
            className="h-full rounded-full bg-verde"
            style={{ width: `${percentual}%` }}
          />
        </View>

        {/* Aviso de estimativa fica acima do checklist: os valores não podem
            parecer oficiais em momento algum. */}
        <View className="mt-6 flex-row rounded-xl border border-atencao/40 bg-atencao/10 p-4">
          <TriangleAlert size={17} color={cores.atencao} className="mt-0.5" />
          <Text className="ml-3 flex-1 text-xs leading-5 text-texto-2">
            {AVISO_CUSTOS}
          </Text>
        </View>

        {/* Índice global do item, para o paywall valer sobre a lista inteira —
            e não fase por fase, senão daria para ver tudo só pulando de fase. */}
        <ChecklistAgrupado grupos={grupos} assinado={assinado} concluidos={concluidos} />

        {assinado ? (
          <Botao
            titulo="Gerenciar assinatura"
            variante="secundario"
            onPress={() => router.push('/pagamento')}
            className="mt-8"
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
          <View key={grupo.fase} className="mt-8">
            <Text className="text-xs uppercase tracking-widest text-texto-3">
              {grupo.nome}
            </Text>

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
      className="mt-3 flex-row rounded-xl border border-borda bg-superficie p-4 active:opacity-80"
    >
      <View
        className="mt-0.5 h-6 w-6 items-center justify-center rounded-md border"
        style={{
          borderColor: concluido ? cores.verde : cores.borda,
          backgroundColor: concluido ? cores.verde : 'transparent',
        }}
      >
        {concluido ? <Check size={15} color={cores.texto} /> : null}
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
        <Text className="mt-1 text-sm leading-5 text-texto-2">{item.descricao}</Text>

        <View className="mt-3 flex-row gap-4">
          <Text className="text-xs text-texto-3">{`Prazo: ${item.prazo}`}</Text>
          <Text className="text-xs font-semibold text-verde">{moeda(item.custo)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function ItemBloqueado({ item }: { item: ItemPlano }) {
  return (
    <View className="mt-3 flex-row rounded-xl border border-borda bg-superficie/40 p-4">
      <Lock size={16} color={cores.texto3} className="mt-0.5" />
      <View className="ml-3 flex-1">
        <Text className="text-base text-texto-3">{item.titulo}</Text>
      </View>
    </View>
  );
}

function Paywall({ total, visiveis }: { total: number; visiveis: number }) {
  const router = useRouter();

  return (
    <View className="mt-8 rounded-2xl border border-verde/40 bg-verde/5 p-6">
      <Lock size={22} color={cores.verde} />
      <Text className="mt-3 text-lg font-bold text-texto">
        {`Faltam ${total - visiveis} passos do seu plano`}
      </Text>
      <Text className="mt-2 text-sm leading-6 text-texto-2">
        Os itens completos — com prazos e custos de cada etapa — ficam liberados
        com o acesso completo. Você já viu os primeiros {visiveis}.
      </Text>

      <Botao
        titulo="Assinar acesso completo"
        onPress={() => router.push('/pagamento')}
        className="mt-5"
      />
    </View>
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
    <View className="mx-4 mb-2 rounded-2xl border border-borda bg-superficie p-4">
      <View className="flex-row items-center">
        <CalendarDays size={16} color={cores.verde} />
        <Text className="ml-2 text-xs uppercase tracking-widest text-texto-3">
          Seu contador
        </Text>
      </View>

      <View className="mt-3 flex-row">
        <Indicador
          rotulo="Dias no país atual"
          valor={String(contador.diasNoPais)}
          cor={cores.texto}
        />
        <Indicador
          rotulo="Restantes no bloco 90/180"
          valor={String(contador.diasRestantesSchengen)}
          cor={contador.noLimiteSchengen ? cores.erro : cores.texto}
        />
        <Indicador
          rotulo="Para residência na Espanha"
          valor={`${emAnos(contador.diasParaResidencia)} anos`}
          cor={cores.texto}
        />
      </View>

      {contador.noLimiteSchengen && contador.liberaEm ? (
        <Text className="mt-3 text-xs leading-5 text-erro">
          {`Você atingiu os 90 dias no bloco Schengen. O contador reabre em ${contador.liberaEm.toLocaleDateString('pt-BR')}.`}
        </Text>
      ) : null}

      <Pressable onPress={() => setEditando(!editando)} className="mt-4 py-1">
        <Text className="text-xs text-verde">
          {editando
            ? 'Fechar'
            : atual
              ? 'Corrigir data de entrada'
              : 'Registrar entrada'}
        </Text>
      </Pressable>

      {editando ? (
        <View className="mt-3">
          <TextInput
            value={pais}
            onChangeText={setPais}
            placeholder="País onde você está"
            placeholderTextColor={cores.texto3}
            className="h-11 rounded-lg border border-borda bg-fundo px-3 text-sm text-texto"
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-2"
            contentContainerStyle={{ gap: 6 }}
          >
            {PAISES_SCHENGEN.slice(0, 8).map((p) => (
              <Pressable
                key={p}
                onPress={() => setPais(p)}
                className="rounded-full border border-borda px-3 py-1"
              >
                <Text className="text-xs text-texto-2">{p}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <TextInput
            value={data}
            onChangeText={setData}
            placeholder="aaaa-mm-dd"
            placeholderTextColor={cores.texto3}
            className="mt-3 h-11 rounded-lg border border-borda bg-fundo px-3 text-sm text-texto"
          />

          <Botao
            titulo={atual ? 'Salvar saída' : 'Registrar entrada'}
            variante="secundario"
            onPress={() => (atual ? registrarSaida(data) : registrarEntrada(pais, data))}
            className="mt-3 h-11"
          />

          <Text className="mt-2 text-xs leading-4 text-texto-3">
            Baseado nas regras simplificadas do espaço Schengen. O oficial é o
            registro de movimentos do consulado.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function Indicador({
  rotulo,
  valor,
  cor,
}: {
  rotulo: string;
  valor: string;
  cor: string;
}) {
  return (
    <View className="flex-1 pr-2">
      <Text style={{ color: cor }} className="text-xl font-bold">
        {valor}
      </Text>
      <Text className="mt-1 text-xs leading-4 text-texto-3">{rotulo}</Text>
    </View>
  );
}