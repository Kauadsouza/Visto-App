import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { Tela } from '@/components/Tela';
import { PLANOS, rotuloCategoria, type PlanoConsultoria } from '@/lib/consultoria';
import { useConsultorias } from '@/store/consultorias';
import { cores } from '@/theme';
import { Briefcase, Calendar, Check, MessageCircle, X } from 'lucide-react-native';

const ICONE_POR_CATEGORIA = {
  diagnostico: Calendar,
  acompanhamento: MessageCircle,
  aplicacao: Briefcase,
} as const;

export default function Consultoria() {
  const { ativas, contratar, cancelar } = useConsultorias();
  const [expandido, setExpandido] = useState<string | null>(null);
  const [modal, setModal] = useState<PlanoConsultoria | null>(null);

  const contratacoesAtivas = ativas.filter((c) => c.status === 'ativa');

  return (
    <Tela>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 }}
      >
        <Text
          className="text-label font-semibold uppercase"
          style={{ color: cores.verde }}
        >
          consultoria
        </Text>
        <Text className="mt-2 text-3xl font-bold" style={{ color: cores.texto }}>
          Acompanhamento humano
        </Text>
        <Text className="mt-3 text-base leading-7" style={{ color: cores.texto2 }}>
          Consultores de imigração revisam seu perfil e te guiam nas próximas
          etapas. Não é assessoria jurídica — é a leitura crítica de alguém
          que já conduziu dezenas de processos parecidos.
        </Text>

        {contratacoesAtivas.length > 0 ? (
          <View
            className="mt-6 rounded-2xl border p-5"
            style={{
              backgroundColor: `${cores.verde}10`,
              borderColor: cores.bordaVerde,
            }}
          >
            <Text
              className="text-label font-semibold uppercase"
              style={{ color: cores.verde }}
            >
              você tem {contratacoesAtivas.length} consultoria ativa
            </Text>
            {contratacoesAtivas.map((c) => {
              const plano = PLANOS.find((p) => p.slug === c.slug);
              if (!plano) return null;
              return (
                <View
                  key={c.id}
                  className="mt-3 rounded-xl border p-4"
                  style={{ backgroundColor: cores.superficie, borderColor: cores.borda }}
                >
                  <Text className="text-base font-semibold" style={{ color: cores.texto }}>
                    {plano.titulo}
                  </Text>
                  <Text className="mt-1 text-caption" style={{ color: cores.texto3 }}>
                    Contratada em{' '}
                    {new Date(c.contratadaEm).toLocaleDateString('pt-BR')}
                  </Text>
                  <Text className="mt-3 text-caption leading-5" style={{ color: cores.texto2 }}>
                    {plano.entregaveis[0]}
                  </Text>
                  <View className="mt-3 flex-row gap-2">
                    <Botao
                      titulo="Abrir conversa"
                      tamanho="md"
                      onPress={() => routerOpenChat(c.slug)}
                      className="flex-1"
                    />
                    <Pressable
                      onPress={() => cancelar(c.id)}
                      className="h-12 items-center justify-center rounded-xl border px-4 active:opacity-80"
                      style={{ borderColor: '#4A2222' }}
                    >
                      <Text className="text-caption font-semibold" style={{ color: '#F87171' }}>
                        Cancelar
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        <Text
          className="mt-8 text-label font-semibold uppercase"
          style={{ color: cores.texto3 }}
        >
          planos
        </Text>

        {PLANOS.map((plano) => {
          const Icone = ICONE_POR_CATEGORIA[plano.categoria];
          const aberto = expandido === plano.slug;
          return (
            <View
              key={plano.slug}
              className="mt-3 overflow-hidden rounded-2xl border"
              style={{
                backgroundColor: cores.superficie2,
                borderColor: cores.bordaForte,
                shadowColor: cores.verde,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.16,
                shadowRadius: 18,
                elevation: 4,
              }}
            >
              <View className="h-1" style={{ backgroundColor: cores.verde }} />

              <Pressable
                onPress={() => setExpandido(aberto ? null : plano.slug)}
                className="p-5 active:opacity-80"
              >
                <View className="flex-row items-center gap-2">
                  <View
                    className="h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${cores.verde}1F` }}
                  >
                    <Icone size={18} color={cores.verde} />
                  </View>
                  <Text
                    className="text-label font-semibold uppercase"
                    style={{ color: cores.texto3 }}
                  >
                    {rotuloCategoria(plano.categoria)}
                  </Text>
                </View>

                <Text className="mt-3 text-xl font-bold" style={{ color: cores.texto }}>
                  {plano.titulo}
                </Text>
                <Text className="mt-2 text-sm leading-6" style={{ color: cores.texto2 }}>
                  {plano.resumo}
                </Text>

                <View className="mt-5 flex-row items-baseline">
                  <Text
                    style={{
                      color: cores.texto,
                      fontSize: 32,
                      lineHeight: 38,
                      fontWeight: '700',
                    }}
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

                {aberto ? (
                  <View className="mt-5">
                    <Text
                      className="text-label font-semibold uppercase"
                      style={{ color: cores.texto3 }}
                    >
                      o que está incluso
                    </Text>
                    {plano.entregaveis.map((e) => (
                      <ItemCheck key={e} texto={e} />
                    ))}

                    {plano.bonus && plano.bonus.length > 0 ? (
                      <View
                        className="mt-4 rounded-lg border p-3"
                        style={{
                          backgroundColor: `${cores.verde}0F`,
                          borderColor: cores.bordaVerde,
                        }}
                      >
                        <Text
                          className="text-label font-semibold uppercase"
                          style={{ color: cores.verde }}
                        >
                          bônus por estar no app
                        </Text>
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
                      style={{ backgroundColor: cores.superficie, borderColor: cores.borda }}
                    >
                      <Text
                        className="text-label font-semibold uppercase"
                        style={{ color: cores.texto3 }}
                      >
                        o que não está incluso
                      </Text>
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
                      titulo={`Contratar — R$ ${plano.preco.toLocaleString('pt-BR')}`}
                      onPress={() => setModal(plano)}
                      className="mt-5"
                    />
                  </View>
                ) : null}
              </Pressable>
            </View>
          );
        })}

        <Text className="mt-8 text-sm leading-6" style={{ color: cores.texto3 }}>
          Os preços e entregáveis foram revisados pelo time Visto, mas o
          custo final pode variar com o seu caso. O consultor confirma
          viabilidade antes de iniciar o trabalho.
        </Text>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={modal !== null}
        onRequestClose={() => setModal(null)}
      >
        <View
          className="flex-1 items-end justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
        >
          {modal ? (
            <View
              className="w-full rounded-t-3xl"
              style={{
                backgroundColor: cores.fundo,
                borderColor: cores.bordaVerde,
                borderWidth: 1,
                borderBottomWidth: 0,
                maxHeight: '90%',
              }}
            >
              <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 32 }}>
                <View className="flex-row items-center justify-between">
                  <Text
                    className="text-label font-semibold uppercase"
                    style={{ color: cores.verde }}
                  >
                    confirmar contratação
                  </Text>
                  <Pressable
                    onPress={() => setModal(null)}
                    className="h-9 w-9 items-center justify-center rounded-lg active:opacity-70"
                    style={{ backgroundColor: cores.superficie2 }}
                  >
                    <X size={16} color={cores.texto2} />
                  </Pressable>
                </View>

                <Text className="mt-3 text-2xl font-bold" style={{ color: cores.texto }}>
                  {modal.titulo}
                </Text>
                <Text className="mt-2 text-sm leading-6" style={{ color: cores.texto2 }}>
                  {modal.resumo}
                </Text>

                <View
                  className="mt-5 rounded-xl border p-4"
                  style={{ backgroundColor: cores.superficie, borderColor: cores.borda }}
                >
                  <Text
                    className="text-label font-semibold uppercase"
                    style={{ color: cores.texto3 }}
                  >
                    resumo
                  </Text>
                  <Text className="mt-1 text-caption leading-5" style={{ color: cores.texto2 }}>
                    {modal.duracao}
                  </Text>
                  <View className="mt-3 flex-row items-baseline">
                    <Text
                      style={{
                        color: cores.texto,
                        fontSize: 30,
                        lineHeight: 36,
                        fontWeight: '700',
                      }}
                    >
                      R$ {modal.preco.toLocaleString('pt-BR')}
                    </Text>
                    <Text className="ml-2 text-caption" style={{ color: cores.texto3 }}>
                      {modal.periodicidade === 'mensal' ? 'por mês' : 'pagamento único'}
                    </Text>
                  </View>
                </View>

                <Text
                  className="mt-5 text-label font-semibold uppercase"
                  style={{ color: cores.texto3 }}
                >
                  o que está incluso
                </Text>
                {modal.entregaveis.map((e) => (
                  <ItemCheck key={e} texto={e} />
                ))}

                <View
                  className="mt-5 rounded-xl border p-4"
                  style={{
                    backgroundColor: `${cores.atencao}10`,
                    borderColor: `${cores.atencao}47`,
                  }}
                >
                  <Text className="text-sm font-semibold" style={{ color: cores.texto }}>
                    Aviso importante
                  </Text>
                  <Text
                    className="mt-1.5 text-caption leading-5"
                    style={{ color: cores.texto2 }}
                  >
                    Esta contratação ativa a consultoria <Text className="font-semibold">localmente</Text> no
                    seu aparelho. Não há pagamento real nesta versão do
                    app. O Visto não é assessoria jurídica.
                  </Text>
                </View>

                <Botao
                  titulo="Confirmar contratação"
                  onPress={() => {
                    contratar(modal.slug);
                    setModal(null);
                  }}
                  className="mt-6"
                />
                <Pressable
                  onPress={() => setModal(null)}
                  className="mt-3 items-center py-3"
                >
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
        style={{ backgroundColor: `${cores.verde}1F` }}
      >
        <Check size={12} color={cores.verde} />
      </View>
      <Text className="ml-3 flex-1 text-sm leading-5" style={{ color: cores.texto2 }}>
        {texto}
      </Text>
    </View>
  );
}

// Stub: navega para o chat com a consultoria selecionada. Implementação
// real: usar router.push('/chat?slug=...') e o chat mostra o consultor
// da consultoria ativa.
function routerOpenChat(slug: string) {
  // Implementação mínima: redireciona pro chat com a consultoria.
  // Como a UI do chat atual filtra por assinatura (que é diferente de
  // "consultoria ativa"), fica como melhoria. Por enquanto, só avisa.
  console.warn('Abrir conversa para', slug);
}