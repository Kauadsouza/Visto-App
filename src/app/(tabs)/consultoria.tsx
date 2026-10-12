import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Briefcase,
  Calendar,
  CalendarCheck,
  Check,
  MessageCircle,
  UserCheck,
  X,
} from 'lucide-react-native';

import { Botao } from '@/components/Botao';
import { Tela } from '@/components/Tela';
import { Aviso, Card, Rotulo, Selo } from '@/components/ui';
import { PLANOS, rotuloCategoria, type PlanoConsultoria } from '@/lib/consultoria';
import { useConsultorias } from '@/store/consultorias';
import { cores } from '@/theme';

const ICONE_POR_CATEGORIA = {
  diagnostico: Calendar,
  acompanhamento: MessageCircle,
  aplicacao: Briefcase,
} as const;

/**
 * Consultoria humana — camada 3.
 *
 * O que a pessoa paga aqui é tempo de gente. Por isso a tela abre com a call
 * agendada, não com um formulário de pagamento: a agenda é o produto. O chat
 * existe para o tempo entre as calls, e abre de verdade — manda para a tela
 * do plano com a consultoria selecionada.
 */
export default function Consultoria() {
  const router = useRouter();
  const { ativas, contratar, cancelar, agendarCall, cancelarCall } = useConsultorias();
  const [expandido, setExpandido] = useState<string | null>(null);
  const [modal, setModal] = useState<PlanoConsultoria | null>(null);
  const [agendando, setAgendando] = useState<string | null>(null);

  const contratacoesAtivas = ativas.filter((c) => c.status === 'ativa');
  const comCall = contratacoesAtivas.filter((c) => c.callEm !== null).length;

  return (
    <Tela>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 32, paddingBottom: 40 }}
      >
        <View className="flex-row items-center justify-between">
          <Rotulo cor={cores.marinho}>consultoria humana</Rotulo>
          {comCall > 0 ? <Selo texto={`${comCall} call marcada`} Icone={UserCheck} /> : null}
        </View>

        <Text className="mt-3 font-serif text-4xl font-bold" style={{ color: cores.texto }}>
          Gente de imigração{'\n'}no seu caso.
        </Text>
        <Text className="mt-4 text-lg leading-8" style={{ color: cores.texto2 }}>
          Um consultor revisa seu perfil, entra na sua call e responde o que a
          inteligência artificial não responde. Não é assessoria jurídica — é a
          leitura crítica de alguém que já conduziu dezenas de processos.
        </Text>

        {contratacoesAtivas.length > 0 ? (
          <View className="mt-8">
            <Rotulo>suas consultorias</Rotulo>
            {contratacoesAtivas.map((c) => {
              const plano = PLANOS.find((p) => p.slug === c.slug);
              if (!plano) return null;

              return (
                <Card key={c.id} nivel={1} elevado className="mt-3 p-5">
                  <View className="flex-row items-start justify-between">
                    <Text
                      className="flex-1 pr-3 font-serif text-lg font-bold"
                      style={{ color: cores.texto }}
                    >
                      {plano.titulo}
                    </Text>
                    <Selo texto="ativa" />
                  </View>

                  <Text className="mt-1 text-caption" style={{ color: cores.texto3 }}>
                    Contratada em {new Date(c.contratadaEm).toLocaleDateString('pt-BR')}
                  </Text>

                  {/* A call é o entregável — fica no topo do card. */}
                  {c.callEm ? (
                    <View
                      className="mt-4 flex-row items-center rounded-xl border p-4"
                      style={{
                        backgroundColor: `${cores.dourado}14`,
                        borderColor: `${cores.dourado}47`,
                      }}
                    >
                      <CalendarCheck size={18} color={cores.dourado} />
                      <View className="ml-3 flex-1">
                        <Rotulo cor={cores.dourado}>call marcada</Rotulo>
                        <Text className="mt-0.5 text-base font-semibold" style={{ color: cores.texto }}>
                          {new Date(c.callEm).toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: '2-digit',
                            month: 'long',
                          })}
                        </Text>
                        <Text className="text-caption" style={{ color: cores.texto3 }}>
                          {new Date(c.callEm).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View
                      className="mt-4 flex-row items-center rounded-xl border p-4"
                      style={{ backgroundColor: cores.superficie2, borderColor: cores.borda }}
                    >
                      <Calendar size={18} color={cores.texto3} />
                      <View className="ml-3 flex-1">
                        <Text className="text-base font-semibold" style={{ color: cores.texto }}>
                          Marcar sua call
                        </Text>
                        <Text className="text-caption" style={{ color: cores.texto3 }}>
                          60 min por vídeo, com o consultor do seu plano
                        </Text>
                      </View>
                    </View>
                  )}

                  <View className="mt-4 gap-2">
                    {c.callEm ? (
                      <Botao
                        titulo="Entrar na conversa"
                        icone={MessageCircle}
                        onPress={() =>
                          router.push({
                            pathname: '/plano',
                            params: { rota: '', consultoria: c.id },
                          })
                        }
                      />
                    ) : null}
                    <View className="flex-row gap-2">
                      <Botao
                        titulo={c.callEm ? 'Reagendar' : 'Agendar call'}
                        variante="secundario"
                        tamanho="md"
                        onPress={() => setAgendando(c.id)}
                        className="flex-1"
                      />
                      {c.callEm ? (
                        <Pressable
                          onPress={() => cancelarCall(c.id)}
                          className="h-12 items-center justify-center rounded-xl border px-4 active:opacity-80"
                          style={{ borderColor: `${cores.erro}47` }}
                        >
                          <Text className="text-caption font-semibold" style={{ color: cores.erro }}>
                            Desmarcar
                          </Text>
                        </Pressable>
                      ) : (
                        <Pressable
                          onPress={() => cancelar(c.id)}
                          className="h-12 items-center justify-center rounded-xl border px-4 active:opacity-80"
                          style={{ borderColor: `${cores.erro}47` }}
                        >
                          <Text className="text-caption font-semibold" style={{ color: cores.erro }}>
                            Cancelar
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        ) : null}

        <Rotulo className="mt-8">os planos</Rotulo>

        {PLANOS.map((plano) => {
          const Icone = ICONE_POR_CATEGORIA[plano.categoria];
          const aberto = expandido === plano.slug;
          return (
            <Card key={plano.slug} nivel={1} className="mt-3 p-5">
              <Pressable onPress={() => setExpandido(aberto ? null : plano.slug)}>
                <View className="flex-row items-center gap-2">
                  <View
                    className="h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${cores.marinho}14` }}
                  >
                    <Icone size={17} color={cores.marinho} />
                  </View>
                  <Rotulo>{rotuloCategoria(plano.categoria)}</Rotulo>
                </View>

                <Text className="mt-3 font-serif text-xl font-bold" style={{ color: cores.texto }}>
                  {plano.titulo}
                </Text>
                <Text className="mt-2 text-sm leading-6" style={{ color: cores.texto2 }}>
                  {plano.resumo}
                </Text>

                <View className="mt-5 flex-row items-baseline">
                  <Text
                    className="font-serif font-bold"
                    style={{ color: cores.texto, fontSize: 32, lineHeight: 38 }}
                  >
                    R$ {plano.preco.toLocaleString('pt-BR')}
                  </Text>
                  <Text className="ml-2 text-sm" style={{ color: cores.texto3 }}>
                    {plano.periodicidade === 'mensal' ? '/mês' : 'pagamento único'}
                  </Text>
                </View>
                <Text className="mt-1 text-caption" style={{ color: cores.texto3 }}>
                  {plano.duracao}
                </Text>
              </Pressable>

              {aberto ? (
                <View className="mt-5">
                  <Rotulo>o que está incluso</Rotulo>
                  {plano.entregaveis.map((e) => (
                    <ItemCheck key={e} texto={e} />
                  ))}

                  {plano.bonus && plano.bonus.length > 0 ? (
                    <View
                      className="mt-4 rounded-lg border p-3"
                      style={{
                        backgroundColor: `${cores.dourado}14`,
                        borderColor: `${cores.dourado}47`,
                      }}
                    >
                      <Rotulo cor={cores.dourado}>bônus por estar no app</Rotulo>
                      {plano.bonus.map((b) => (
                        <Text
                          key={b}
                          className="mt-1 text-caption leading-5"
                          style={{ color: cores.texto2 }}
                        >
                          {`· ${b}`}
                        </Text>
                      ))}
                    </View>
                  ) : null}

                  <View
                    className="mt-4 rounded-lg border p-3"
                    style={{ backgroundColor: cores.superficie2, borderColor: cores.borda }}
                  >
                    <Rotulo>o que não está incluso</Rotulo>
                    {plano.limitacoes.map((l) => (
                      <Text
                        key={l}
                        className="mt-1 text-caption leading-5"
                        style={{ color: cores.texto3 }}
                      >
                        {`· ${l}`}
                      </Text>
                    ))}
                  </View>

                  <Botao
                    titulo="Contratar este plano"
                    onPress={() => setModal(plano)}
                    className="mt-5"
                  />
                </View>
              ) : null}
            </Card>
          );
        })}

        <Text className="mt-8 text-caption leading-5" style={{ color: cores.texto4 }}>
          Os preços e entregáveis foram revisados pelo time Visto, mas o custo
          final pode variar com o seu caso. O consultor confirma a viabilidade
          antes de iniciar o trabalho.
        </Text>
      </ScrollView>

      {/* Agendar call: horários reais, começando amanhã. A key faz o modal
          remontar a cada abertura, para a lista recomeçar em "amanhã" e a
          seleção anterior não vazar de uma call para outra. */}
      {agendando ? (
        <ModalAgendar
          key={agendando}
          aberto
          aoFechar={() => setAgendando(null)}
          aoConfirmar={(quando) => {
            if (agendando) agendarCall(agendando, quando);
            setAgendando(null);
          }}
        />
      ) : null}

      <Modal
        animationType="slide"
        transparent
        visible={modal !== null}
        onRequestClose={() => setModal(null)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(22,19,15,0.5)' }}>
          {modal ? (
            <View
              className="rounded-t-3xl"
              style={{ backgroundColor: cores.fundo, maxHeight: '90%' }}
            >
              <ScrollView contentContainerStyle={{ padding: 28, paddingBottom: 32 }}>
                <View className="flex-row items-center justify-between">
                  <Rotulo cor={cores.marinho}>confirmar contratação</Rotulo>
                  <Pressable
                    onPress={() => setModal(null)}
                    className="h-9 w-9 items-center justify-center rounded-lg active:opacity-70"
                    style={{ backgroundColor: cores.superficie2 }}
                  >
                    <X size={16} color={cores.texto2} />
                  </Pressable>
                </View>

                <Text className="mt-4 font-serif text-3xl font-bold" style={{ color: cores.texto }}>
                  {modal.titulo}
                </Text>
                <Text className="mt-2 text-base leading-7" style={{ color: cores.texto2 }}>
                  {modal.resumo}
                </Text>

                <Card nivel={1} className="mt-6 p-4">
                  <Rotulo>resumo</Rotulo>
                  <Text className="mt-1 text-caption leading-5" style={{ color: cores.texto2 }}>
                    {modal.duracao}
                  </Text>
                  <View className="mt-3 flex-row items-baseline">
                    <Text
                      className="font-serif font-bold"
                      style={{ color: cores.texto, fontSize: 30, lineHeight: 36 }}
                    >
                      R$ {modal.preco.toLocaleString('pt-BR')}
                    </Text>
                    <Text className="ml-2 text-caption" style={{ color: cores.texto3 }}>
                      {modal.periodicidade === 'mensal' ? 'por mês' : 'pagamento único'}
                    </Text>
                  </View>
                </Card>

                <Rotulo className="mt-6">o que está incluso</Rotulo>
                {modal.entregaveis.map((e) => (
                  <ItemCheck key={e} texto={e} />
                ))}

                <View className="mt-6">
                  <Aviso
                    tom="atencao"
                    texto="Esta contratação ativa a consultoria localmente no seu aparelho. Não há pagamento real nesta versão do app. O Visto não é assessoria jurídica."
                  />
                </View>

                <Botao
                  titulo="Confirmar contratação"
                  onPress={() => {
                    contratar(modal.slug);
                    setModal(null);
                  }}
                  className="mt-6"
                />
                <Pressable onPress={() => setModal(null)} className="mt-3 items-center py-3">
                  <Text className="text-sm" style={{ color: cores.texto3 }}>
                    Voltar
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          ) : null}
        </View>
      </Modal>
    </Tela>
  );
}

function ItemCheck({ texto }: { texto: string }) {
  return (
    <View className="mt-2 flex-row">
      <View
        className="mt-0.5 h-5 w-5 items-center justify-center rounded-full"
        style={{ backgroundColor: `${cores.marinho}14` }}
      >
        <Check size={12} color={cores.marinho} />
      </View>
      <Text className="ml-3 flex-1 text-sm leading-5" style={{ color: cores.texto2 }}>
        {texto}
      </Text>
    </View>
  );
}

interface Sugestao {
  quando: number;
  dia: string;
  hora: string;
}

/**
 * Escolha da data e hora da call.
 *
 * Oferece os próximos dias úteis em horário comercial. Não é integração com
 * calendário — é o suficiente para a pessoa ter uma data real e para o
 * consultor organizar a agenda.
 */
function ModalAgendar({
  aberto,
  aoFechar,
  aoConfirmar,
}: {
  aberto: boolean;
  aoFechar: () => void;
  aoConfirmar: (quando: number) => void;
}) {
  // Sem useMemo de propósito: o componente só existe enquanto o modal está
  // aberto (ver o `key` no chamador), então recalcular a cada render é
  // irrelevante e o `aberto` no array de dependências seria enganoso.
  const horarios = sugerirHorarios();
  const [escolhido, setEscolhido] = useState<number | null>(null);

  return (
    <Modal animationType="slide" transparent visible={aberto} onRequestClose={aoFechar}>
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(22,19,15,0.5)' }}>
        <View
          className="rounded-t-3xl"
          style={{ backgroundColor: cores.fundo, maxHeight: '85%' }}
        >
          <ScrollView contentContainerStyle={{ padding: 28, paddingBottom: 32 }}>
            <View className="flex-row items-center justify-between">
              <Rotulo cor={cores.marinho}>marcar sua call</Rotulo>
              <Pressable
                onPress={() => {
                  setEscolhido(null);
                  aoFechar();
                }}
                className="h-9 w-9 items-center justify-center rounded-lg active:opacity-70"
                style={{ backgroundColor: cores.superficie2 }}
              >
                <X size={16} color={cores.texto2} />
              </Pressable>
            </View>

            <Text className="mt-4 font-serif text-3xl font-bold" style={{ color: cores.texto }}>
              60 minutos{'\n'}por vídeo
            </Text>

            <Rotulo className="mt-6">escolha o horário</Rotulo>
            {horarios.map((h) => {
              const ativo = escolhido === h.quando;
              return (
                <Pressable
                  key={h.quando}
                  onPress={() => setEscolhido(h.quando)}
                  className="mt-2 flex-row items-center rounded-xl border p-4 active:opacity-80"
                  style={{
                    backgroundColor: ativo ? `${cores.marinho}0F` : cores.superficie,
                    borderColor: ativo ? cores.bordaMarca : cores.borda,
                  }}
                >
                  <CalendarCheck size={17} color={ativo ? cores.marinho : cores.texto3} />
                  <View className="ml-3 flex-1">
                    <Text
                      className="text-base font-semibold"
                      style={{ color: ativo ? cores.marinho : cores.texto }}
                    >
                      {h.dia}
                    </Text>
                    <Text className="text-caption" style={{ color: cores.texto3 }}>
                      {`${h.hora} · 60 min`}
                    </Text>
                  </View>
                  {ativo ? <Check size={17} color={cores.marinho} /> : null}
                </Pressable>
              );
            })}

            <Botao
              titulo="Confirmar horário"
              disabled={escolhido === null}
              onPress={() => {
                if (escolhido !== null) {
                  aoConfirmar(escolhido);
                  setEscolhido(null);
                }
              }}
              className="mt-6"
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Próximos dias úteis, a partir de amanhã, em três horários de negócio.
 * O mínimo é amanhã: agendar para daqui a duas horas não é uma consulta.
 */
function sugerirHorarios(): Sugestao[] {
  const HORAS = ['09:00', '14:00', '17:00'];
  const saida: Sugestao[] = [];

  for (let d = 1; saida.length < 9 && d < 14; d++) {
    const data = new Date();
    data.setDate(data.getDate() + d);
    data.setHours(0, 0, 0, 0);

    const diaSemana = data.getDay();
    if (diaSemana === 0 || diaSemana === 6) continue;

    for (const hora of HORAS) {
      const quando = new Date(data);
      const [h, m] = hora.split(':').map(Number);
      quando.setHours(h, m, 0, 0);

      saida.push({
        quando: quando.getTime(),
        dia: quando.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
        }),
        hora,
      });
    }
  }

  return saida;
}