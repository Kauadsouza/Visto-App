import { useMemo, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from 'react-native';
import { Check, ChevronDown, Lock } from 'lucide-react-native';

import type { FasePlano, ItemPlano } from '@/lib/database.types';
import { moeda } from '@/lib/planos';
import { cores } from '@/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface GrupoTrilha {
  fase: FasePlano;
  nome: string;
  itens: ItemPlano[];
}

type EstadoFase = 'feito' | 'atual' | 'futuro';

/**
 * A trilha do processo.
 *
 * O plano não é uma lista de tarefas soltas — é uma sequência, e quem paga por
 * um serviço de imigração quer ver a sequência, não uma to-do list. Por isso o
 * componente desenha um trilho vertical contínuo: cada fase é um marco no
 * trilho, o que está feito pinta o trilho, e a fase em que a pessoa está
 * aparece destacada e aberta.
 *
 * A fase atual abre sozinha. As outras abrem e fecham ao toque — num celular,
 * mostrar as cinco fases abertas de uma vez esconde justamente o que importa:
 * onde você está.
 */
export function Trilha({
  grupos,
  idDe,
  concluidos,
  aoAlternar,
  assinado,
}: {
  grupos: GrupoTrilha[];
  /** Id do item — vem de `idDoItem`, para não duplicar a regra do índice. */
  idDe: (fase: FasePlano, indiceNoGrupo: number) => string;
  concluidos: string[];
  aoAlternar: (id: string) => void;
  assinado: boolean;
}) {
  const comPareceres = useMemo(
    () => grupos.filter((g) => g.itens.length > 0),
    [grupos]
  );

  const estadoDe = useMemo(() => {
    const estados = new Map<FasePlano, EstadoFase>();
    let achouAtual = false;

    for (const grupo of comPareceres) {
      const feitos = grupo.itens.filter((_, i) =>
        concluidos.includes(idDe(grupo.fase, i))
      ).length;
      const completo = feitos === grupo.itens.length;

      if (completo) estados.set(grupo.fase, 'feito');
      else if (!achouAtual) {
        estados.set(grupo.fase, 'atual');
        achouAtual = true;
      } else estados.set(grupo.fase, 'futuro');
    }

    return estados;
  }, [comPareceres, concluidos, idDe]);

  const faseAtual = comPareceres.find((g) => estadoDe.get(g.fase) === 'atual')?.fase;

  // A fase atual começa aberta; as demais, recolhidas.
  const [abertas, setAbertas] = useState<FasePlano[]>(() =>
    faseAtual ? [faseAtual] : []
  );

  function alternar(fase: FasePlano) {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(180, LayoutAnimation.Types.easeInEaseOut, 'opacity')
    );
    setAbertas((atual) =>
      atual.includes(fase) ? atual.filter((f) => f !== fase) : [...atual, fase]
    );
  }

  return (
    <View>
      <MapaFases grupos={comPareceres} estadoDe={estadoDe} idDe={idDe} concluidos={concluidos} />

      {comPareceres.map((grupo, indiceGrupo) => {
        const estado = estadoDe.get(grupo.fase) ?? 'futuro';
        const aberta = abertas.includes(grupo.fase);
        const ultimo = indiceGrupo === comPareceres.length - 1;

        const feitos = grupo.itens.filter((_, i) =>
          concluidos.includes(idDe(grupo.fase, i))
        ).length;

        return (
          <View key={grupo.fase} className="flex-row">
            {/* Trilho: o nó da fase e a linha que desce até a próxima. */}
            <View className="w-11 items-center">
              <No estado={estado} />
              {!ultimo ? (
                <View
                  className="w-0.5 flex-1"
                  style={{ backgroundColor: cores.borda }}
                />
              ) : null}
            </View>

            <View className="flex-1 pb-6">
              <Pressable
                onPress={() => alternar(grupo.fase)}
                className="active:opacity-70"
                accessibilityRole="button"
                accessibilityState={{ expanded: aberta }}
              >
                <View className="flex-row items-center justify-between pr-1">
                  <View className="flex-1 pr-3">
                    <Text
                      className="font-serif text-lg font-bold"
                      style={{
                        color: estado === 'futuro' ? cores.texto3 : cores.texto,
                      }}
                    >
                      {grupo.nome}
                    </Text>
                    <Text className="mt-0.5 text-caption" style={{ color: cores.texto3 }}>
                      {estado === 'feito'
                        ? `${feitos} de ${grupo.itens.length} · concluída`
                        : estado === 'atual'
                          ? `${feitos} de ${grupo.itens.length} · você está aqui`
                          : `${grupo.itens.length} passos`}
                    </Text>
                  </View>

                  <ChevronDown
                    size={18}
                    color={cores.texto4}
                    style={{
                      transform: [{ rotate: aberta ? '180deg' : '0deg' }],
                    }}
                  />
                </View>

                {estado === 'atual' ? (
                  <View className="mt-3">
                    <BarraDaFase valor={feitos / grupo.itens.length} />
                  </View>
                ) : null}
              </Pressable>

              {aberta ? (
                <View className="mt-4">
                  {grupo.itens.map((item, indiceNoGrupo) => {
                    const id = idDe(grupo.fase, indiceNoGrupo);
                    return (
                      <PassoTrilha
                        key={id}
                        id={id}
                        item={item}
                        concluido={concluidos.includes(id)}
                        bloqueado={!assinado && estado === 'futuro'}
                        aoAlternar={aoAlternar}
                      />
                    );
                  })}
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Barra fina do progresso dentro da fase atual. */
function BarraDaFase({ valor }: { valor: number }) {
  const pct = Math.max(0, Math.min(100, valor * 100));
  return (
    <View
      className="h-1 w-full overflow-hidden rounded-full"
      style={{ backgroundColor: cores.superficie3 }}
    >
      <View
        className="h-full rounded-full"
        style={{ width: `${pct}%`, backgroundColor: cores.marinho }}
      />
    </View>
  );
}

/**
 * O mapa de cima: as cinco fases em linha.
 *
 * É o "onde eu estou" sem precisar rolar. Num celular, a rolagem é o defeito —
 * quem pergunta "e agora?" não desce 600px para descobrir a resposta.
 */
function MapaFases({
  grupos,
  estadoDe,
  idDe,
  concluidos,
}: {
  grupos: GrupoTrilha[];
  estadoDe: Map<FasePlano, EstadoFase>;
  idDe: (fase: FasePlano, indiceNoGrupo: number) => string;
  concluidos: string[];
}) {
  return (
    <View className="mb-8 flex-row">
      {grupos.map((grupo, i) => {
        const estado = estadoDe.get(grupo.fase) ?? 'futuro';
        const feitos = grupo.itens.filter((_, k) =>
          concluidos.includes(idDe(grupo.fase, k))
        ).length;

        return (
          <View key={grupo.fase} className="flex-1">
            <View className="flex-row items-center">
              {/* A linha que liga um marco ao seguinte. */}
              {i > 0 ? (
                <View
                  className="h-0.5 flex-1 rounded-full"
                  style={{
                    backgroundColor:
                      estado === 'feito' ? cores.marinho : cores.superficie3,
                  }}
                />
              ) : null}
              <View
                className="h-4 w-4 items-center justify-center rounded-full border-2"
                style={{
                  borderColor:
                    estado === 'futuro' ? cores.superficie3 : cores.marinho,
                  backgroundColor: estado === 'feito' ? cores.marinho : 'transparent',
                }}
              >
                {estado === 'feito' ? <Check size={9} color="#FFFFFF" /> : null}
                {estado === 'atual' ? (
                  <View
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: cores.marinho }}
                  />
                ) : null}
              </View>
              {i < grupos.length - 1 ? (
                <View
                  className="h-0.5 flex-1 rounded-full"
                  style={{
                    backgroundColor:
                      estado === 'feito' ? cores.marinho : cores.superficie3,
                  }}
                />
              ) : null}
            </View>

            <Text
              className="mt-2 text-center text-caption font-semibold uppercase"
              style={{
                color: estado === 'atual' ? cores.marinho : cores.texto4,
              }}
              numberOfLines={2}
            >
              {grupo.nome}
            </Text>
            <Text
              className="mt-0.5 text-center text-caption"
              style={{ color: cores.texto4 }}
            >
              {`${feitos}/${grupo.itens.length}`}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** O marco do trilho: o que diz em que fase a pessoa está. */
function No({ estado }: { estado: EstadoFase }) {
  if (estado === 'feito') {
    return (
      <View
        className="mt-1 h-7 w-7 items-center justify-center rounded-full"
        style={{ backgroundColor: cores.marinho }}
      >
        <Check size={14} color="#FFFFFF" />
      </View>
    );
  }

  if (estado === 'atual') {
    return (
      <View
        className="mt-1 h-7 w-7 items-center justify-center rounded-full border-2"
        style={{
          borderColor: cores.marinho,
          backgroundColor: `${cores.marinho}14`,
        }}
      >
        <View
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: cores.marinho }}
        />
      </View>
    );
  }

  return (
    <View
      className="mt-1 h-7 w-7 items-center justify-center rounded-full border"
      style={{ borderColor: cores.superficie3 }}
    />
  );
}

/** Um passo dentro da fase: toque para concluir. */
function PassoTrilha({
  id,
  item,
  concluido,
  bloqueado,
  aoAlternar,
}: {
  id: string;
  item: ItemPlano;
  concluido: boolean;
  bloqueado: boolean;
  aoAlternar: (id: string) => void;
}) {
  if (bloqueado) {
    return (
      <View className="mb-2 flex-row items-center rounded-xl border border-dashed p-3">
        <Lock size={13} color={cores.texto4} />
        <Text className="ml-2 flex-1 text-caption" style={{ color: cores.texto4 }}>
          {item.titulo}
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: concluido }}
      onPress={() => aoAlternar(id)}
      className="mb-2 flex-row rounded-xl border p-4 active:opacity-70"
      style={{
        backgroundColor: concluido ? cores.fundo2 : cores.superficie,
        borderColor: concluido ? cores.bordaMarca : cores.borda,
      }}
    >
      <View
        className="mt-0.5 h-5 w-5 items-center justify-center rounded-md border"
        style={{
          borderColor: concluido ? cores.marinho : cores.bordaForte,
          backgroundColor: concluido ? cores.marinho : 'transparent',
        }}
      >
        {concluido ? <Check size={12} color="#FFFFFF" /> : null}
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
          <Text className="text-caption" style={{ color: cores.texto3 }}>
            {item.prazo}
          </Text>
          <Text
            className="text-caption font-semibold"
            style={{ color: item.custo > 0 ? cores.marinho : cores.texto4 }}
          >
            {moeda(item.custo)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}