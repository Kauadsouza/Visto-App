import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Lock,
  Sparkles,
  X,
} from 'lucide-react-native';

import { Botao } from '@/components/Botao';
import { Tela } from '@/components/Tela';
import { Aviso, Card, Rotulo, Selo } from '@/components/ui';
import { gerarPlano } from '@/lib/consultoriaIA';
import { rotaRecomendada } from '@/lib/perfil';
import { PRECO_CONSULTORIA_IA, useConsultoriaIA } from '@/store/consultoriaIA';
import { usePlano } from '@/store/plano';
import { useQuestionario } from '@/store/questionario';
import { cores } from '@/theme';

/**
 * Consultoria por IA — camada 2.
 *
 * A diferença para o assistente está no que a tela mostra: um plano montado a
 * partir do questionário inteiro, com etapas numeradas, prazos, custo somado e
 * o que ainda não dá para estimar. O agente não espera a pessoa perguntar.
 *
 * Sem questionário respondido, a tela manda para o questionário — não faz
 * sentido montar um plano sobre respostas vazias.
 */
export default function ConsultoriaIA() {
  const router = useRouter();
  const { respostas } = useQuestionario();
  const { viagens } = usePlano();
  const { contratadoEm, contratar } = useConsultoriaIA();
  const [modal, setModal] = useState(false);

  const rota = useMemo(() => rotaRecomendada(respostas), [respostas]);
  const plano = useMemo(
    () => (rota ? gerarPlano(respostas, rota, viagens) : null),
    [respostas, rota, viagens]
  );

  if (!plano) {
    return (
      <Tela>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 28,
            paddingTop: 40,
            justifyContent: 'center',
          }}
        >
          <Rotulo cor={cores.marinho}>consultoria por ia</Rotulo>
          <Text className="mt-4 font-serif text-4xl font-bold" style={{ color: cores.texto }}>
            O plano precisa{'\n'}do seu perfil.
          </Text>
          <Text className="mt-4 text-lg leading-8" style={{ color: cores.texto2 }}>
            O agente cruza suas oito respostas com a rota recomendada e monta as
            etapas no seu caso. Sem o questionário, não há o que cruzar.
          </Text>
          <Botao
            titulo="Responder o questionário"
            iconeFim={ArrowRight}
            onPress={() => router.push('/questionario')}
            className="mt-8"
          />
        </ScrollView>
      </Tela>
    );
  }

  const ativa = contratadoEm !== null;

  return (
    <Tela>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 32, paddingBottom: 40 }}
      >
        <View className="flex-row items-center justify-between">
          <Rotulo cor={cores.marinho}>consultoria por ia</Rotulo>
          {ativa ? <Selo texto="plano ativo" Icone={Sparkles} /> : null}
        </View>

        <Text className="mt-3 font-serif text-4xl font-bold" style={{ color: cores.texto }}>
          Seu plano,{'\n'}{plano.rota.nome}
        </Text>

        <Text className="mt-4 text-lg leading-8" style={{ color: cores.texto2 }}>
          {plano.abertura}
        </Text>

        {/* Por que esta rota — é a dúvida que todo mundo tem */}
        <Card nivel={1} className="mt-6 p-5">
          <Rotulo>por que esta rota</Rotulo>
          <Text className="mt-3 text-sm leading-6" style={{ color: cores.texto2 }}>
            {plano.justificativa}
          </Text>
        </Card>

        {/* Custo */}
        <Card nivel={1} elevado className="mt-3 p-5">
          <Rotulo>custo que dá para estimar</Rotulo>
          <View className="mt-3 flex-row items-baseline">
            <Text
              className="font-serif text-4xl font-bold"
              style={{ color: cores.texto }}
            >
              {`R$ ${plano.custoEstimado.toLocaleString('pt-BR')}`}
            </Text>
          </View>
          <Text className="mt-2 text-caption leading-5" style={{ color: cores.texto3 }}>
            Soma das etapas com valor conhecido. Não inclui passagem aérea,
            custo de vida no destino nem honorários de tradução.
          </Text>
        </Card>

        {/* Etapas */}
        <Rotulo className="mt-8">as etapas, na ordem</Rotulo>

        <View className="mt-3">
          {plano.etapas.map((etapa) => (
            <Card
              key={etapa.numero}
              nivel={1}
              borda={etapa.bloqueado ? `${cores.atencao}47` : undefined}
              className="mb-3 p-5"
            >
              <View className="flex-row items-start">
                <View
                  className="h-7 w-7 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: etapa.bloqueado ? `${cores.atencao}14` : `${cores.marinho}14`,
                  }}
                >
                  {etapa.bloqueado ? (
                    <Lock size={13} color={cores.atencao} />
                  ) : (
                    <Text className="text-caption font-bold" style={{ color: cores.marinho }}>
                      {etapa.numero}
                    </Text>
                  )}
                </View>

                <View className="ml-3 flex-1">
                  <Text className="text-base font-semibold" style={{ color: cores.texto }}>
                    {etapa.titulo}
                  </Text>
                  <Text className="mt-0.5 text-caption" style={{ color: cores.texto4 }}>
                    {etapa.prazo}
                  </Text>
                  <Text className="mt-2 text-sm leading-6" style={{ color: cores.texto2 }}>
                    {etapa.detalhe}
                  </Text>

                  {etapa.custo > 0 ? (
                    <Text className="mt-2 text-caption font-semibold" style={{ color: cores.marinho }}>
                      {`R$ ${etapa.custo.toLocaleString('pt-BR')}`}
                    </Text>
                  ) : null}

                  {etapa.motivo ? (
                    <View
                      className="mt-3 flex-row rounded-lg p-3"
                      style={{ backgroundColor: `${cores.atencao}14` }}
                    >
                      <AlertTriangle size={13} color={cores.atencao} className="mt-0.5" />
                      <Text className="ml-2 flex-1 text-caption leading-5" style={{ color: cores.texto2 }}>
                        {etapa.motivo}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* O que não dá para saber */}
        <Rotulo className="mt-6">o que ainda não dá para saber</Rotulo>
        <Card nivel={1} className="mt-3 p-5">
          {plano.lacunas.map((l) => (
            <View key={l} className="flex-row items-start">
              <Text className="mr-2 mt-0.5 text-caption" style={{ color: cores.texto4 }}>
                ·
              </Text>
              <Text className="flex-1 text-caption leading-5" style={{ color: cores.texto2 }}>
                {l}
              </Text>
            </View>
          ))}
        </Card>

        <View className="mt-6">
          <Aviso
            tom="atencao"
            Icone={AlertTriangle}
            texto="Custos e prazos são estimativas educacionais. Nenhum valor aqui foi conferido contra tabela oficial de consulado — confirme cada um na fonte antes de decidir por ele."
          />
        </View>

        {!ativa ? (
          <Card nivel={2} borda={cores.bordaMarca} elevado className="mt-8 p-6">
            <Rotulo cor={cores.marinho}>desbloquear o plano</Rotulo>
            <Text className="mt-3 font-serif text-2xl font-bold" style={{ color: cores.texto }}>
              Você está vendo a prévia.
            </Text>
            <Text className="mt-2 text-sm leading-6" style={{ color: cores.texto2 }}>
              A versão completa traz o plano gerado a partir do seu perfil, o
              custo somado e o contador atualizado.
            </Text>
            <Botao
              titulo="Assinar por R$ 89/mês"
              iconeFim={ArrowRight}
              onPress={() => setModal(true)}
              className="mt-5"
            />
          </Card>
        ) : null}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={modal}
        onRequestClose={() => setModal(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(22,19,15,0.5)' }}>
          <View
            className="rounded-t-3xl"
            style={{ backgroundColor: cores.fundo, maxHeight: '88%' }}
          >
            <ScrollView contentContainerStyle={{ padding: 28, paddingBottom: 32 }}>
              <View className="flex-row items-center justify-between">
                <Rotulo cor={cores.marinho}>assinar consultoria por ia</Rotulo>
                <Pressable
                  onPress={() => setModal(false)}
                  className="h-9 w-9 items-center justify-center rounded-lg active:opacity-70"
                  style={{ backgroundColor: cores.superficie2 }}
                >
                  <X size={16} color={cores.texto2} />
                </Pressable>
              </View>

              <Text className="mt-4 font-serif text-3xl font-bold" style={{ color: cores.texto }}>
                R$ {PRECO_CONSULTORIA_IA}/mês
              </Text>
              <Text className="mt-2 text-base leading-7" style={{ color: cores.texto2 }}>
                O agente monta este plano a partir do seu questionário e dos seus
                viagens registradas, e atualiza quando o seu perfil mudar.
              </Text>

              <Rotulo className="mt-6">o que você leva</Rotulo>
              {[
                'O plano completo, com as etapas na ordem e o motivo de cada bloqueio',
                'Custo somado do que dá para estimar',
                'Lista do que ainda precisa ser confirmado por você',
                'O assistente, agora sabendo do seu plano',
              ].map((d) => (
                <View key={d} className="mt-3 flex-row">
                  <View
                    className="mt-0.5 h-5 w-5 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${cores.marinho}14` }}
                  >
                    <Check size={12} color={cores.marinho} />
                  </View>
                  <Text className="ml-3 flex-1 text-sm leading-5" style={{ color: cores.texto2 }}>
                    {d}
                  </Text>
                </View>
              ))}

              <View
                className="mt-6 rounded-xl border p-4"
                style={{ backgroundColor: `${cores.atencao}14`, borderColor: `${cores.atencao}47` }}
              >
                <Text className="text-sm font-semibold" style={{ color: cores.texto }}>
                  Aviso importante
                </Text>
                <Text className="mt-1.5 text-caption leading-5" style={{ color: cores.texto2 }}>
                  Esta contratação ativa a consultoria por IA{' '}
                  <Text className="font-semibold">localmente</Text> no seu
                  aparelho. Não há pagamento real nesta versão do app. O Visto não
                  é assessoria jurídica.
                </Text>
              </View>

              <Botao
                titulo="Assinar consultoria por IA"
                onPress={() => {
                  contratar();
                  setModal(false);
                }}
                className="mt-6"
              />
              <Pressable onPress={() => setModal(false)} className="mt-3 items-center py-3">
                <Text className="text-sm" style={{ color: cores.texto3 }}>
                  Voltar
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Tela>
  );
}