import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowUpRight, Sparkles } from 'lucide-react-native';

import { Tela } from '@/components/Tela';
import { Rotulo } from '@/components/ui';
import {
  enviarMensagem,
  TAMANHO_MAX_INPUT,
  validarInput,
  type Mensagem,
} from '@/lib/chat';
import { rotaRecomendada } from '@/lib/perfil';
import { useQuestionario } from '@/store/questionario';
import { cores } from '@/theme';

/**
 * Assistente — a camada gratuita.
 *
 * Responde o básico, sem cota e sem cobrar nada. É a vitrine: quem não
 * conhece o Visto entra por aqui e entende o valor antes de ver preço.
 * Quem quiser um plano montado a partir do próprio perfil é remetido para a
 * consultoria por IA — o botão aparece quando a conversa já começou.
 */
export default function Chat() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { respostas } = useQuestionario();
  const scrollRef = useRef<ScrollView>(null);

  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const rota = rotaRecomendada(respostas);
  // Só faz sentido oferecer o plano sob medida depois que a pessoa já conversou
  // — oferecer antes que ela sentisse o valor seria só um anúncio.
  const mostrarUpsell = mensagens.length >= 2;

  useEffect(() => {
    if (mensagens.length === 0) return;
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, [mensagens.length]);

  async function aoEnviar() {
    setErro(null);
    const validacao = validarInput(input);
    if (!validacao.ok) {
      setErro(validacao.mensagem);
      return;
    }

    const nova: Mensagem = {
      id: `${Date.now()}`,
      papel: 'usuario',
      texto: input.trim(),
      criadoEm: Date.now(),
    };
    setMensagens((atual) => [...atual, nova]);
    setInput('');
    setEnviando(true);

    // Latência simulada: a IA local é síncrona, mas o "carregando" mostra
    // que o sistema está pensando.
    await new Promise((r) => setTimeout(r, 250));

    const resposta = enviarMensagem([...mensagens, nova], nova.texto);
    setMensagens((atual) => [...atual, resposta]);
    setEnviando(false);
  }

  return (
    <Tela>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <View style={{ paddingTop: insets.top + 16 }} className="px-7 pb-3">
          <Rotulo cor={cores.marinho}>assistente</Rotulo>
          <Text className="mt-2 font-serif text-3xl font-bold" style={{ color: cores.texto }}>
            Pergunte o que quiser
          </Text>
          <Text className="mt-2 text-caption" style={{ color: cores.texto3 }}>
            Grátis e sem limite de mensagens. O assistente cita a fonte de cada
            resposta.
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 24 }}
        >
          {mensagens.length === 0 ? (
            <View className="mt-8">
              <View
                className="rounded-2xl border p-5"
                style={{ backgroundColor: cores.superficie, borderColor: cores.borda }}
              >
                <View className="flex-row items-center gap-2">
                  <Sparkles size={14} color={cores.marinho} />
                  <Text className="text-caption font-semibold" style={{ color: cores.marinho }}>
                    Comece por aqui
                  </Text>
                </View>
                <Text className="mt-2 text-sm leading-6" style={{ color: cores.texto2 }}>
                  O assistente responde dúvidas gerais: custos, prazos,
                  documentos, regras de Schengen. Para um plano montado a partir
                  do seu perfil, a consultoria por IA faz isso.
                </Text>
              </View>

              <View className="mt-6 gap-2">
                {SUGESTOES.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setInput(s)}
                    className="rounded-xl border px-4 py-3 active:opacity-70"
                    style={{ backgroundColor: cores.superficie, borderColor: cores.borda }}
                  >
                    <Text className="text-sm" style={{ color: cores.texto2 }}>
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            mensagens.map((m) => <Bolha key={m.id} mensagem={m} />)
          )}

          {mostrarUpsell ? (
            <Pressable
              onPress={() => router.push('/consultoria-ia')}
              className="mt-6 flex-row items-center rounded-2xl border p-5 active:opacity-80"
              style={{ backgroundColor: cores.superficie, borderColor: cores.bordaMarca }}
            >
              <View className="flex-1 pr-3">
                <Text className="text-label font-semibold uppercase" style={{ color: cores.marinho }}>
                  próximo passo
                </Text>
                <Text className="mt-2 font-serif text-lg font-bold" style={{ color: cores.texto }}>
                  Um plano feito para o seu caso
                </Text>
                <Text className="mt-1 text-caption leading-5" style={{ color: cores.texto2 }}>
                  {rota
                    ? `O agente cruza as suas respostas com a rota "${rota.nome}" e monta documentos, prazos e custo somado.`
                    : 'O agente cruza as suas respostas e monta um plano com documentos, prazos e custo.'}
                </Text>
              </View>
              <ArrowUpRight size={20} color={cores.marinho} />
            </Pressable>
          ) : null}

          {erro ? (
            <View
              className="mt-3 rounded-xl border p-3"
              style={{
                backgroundColor: `${cores.erro}10`,
                borderColor: `${cores.erro}47`,
              }}
            >
              <Text className="text-caption" style={{ color: cores.erro }}>
                {erro}
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <View
          className="px-7 pt-3"
          style={{ paddingBottom: insets.bottom + 16, backgroundColor: cores.fundo }}
        >
          <View
            className="flex-row items-end rounded-2xl border p-2"
            style={{ backgroundColor: cores.superficie, borderColor: cores.borda }}
          >
            <TextInput
              value={input}
              onChangeText={(t) => {
                setInput(t.slice(0, TAMANHO_MAX_INPUT));
                if (erro) setErro(null);
              }}
              placeholder="Pergunte sobre vistos, custos ou documentos…"
              placeholderTextColor={cores.texto4}
              editable={!enviando}
              multiline
              maxLength={TAMANHO_MAX_INPUT}
              className="flex-1 px-3 py-2 text-base"
              style={{ color: cores.texto, maxHeight: 120 }}
            />
            <Pressable
              accessibilityRole="button"
              onPress={aoEnviar}
              disabled={enviando || input.trim().length === 0}
              className="ml-2 h-10 w-10 items-center justify-center rounded-xl active:opacity-80"
              style={{
                backgroundColor: cores.marinho,
                opacity: enviando || input.trim().length === 0 ? 0.4 : 1,
              }}
            >
              <ArrowUpRight size={17} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Tela>
  );
}

const SUGESTOES = [
  'Quanto custa tirar visto para a Inglaterra?',
  'Posso pedir visto sem ensino médio completo?',
  'Como funciona o bloco Schengen de 90 dias?',
  'O que é o visto de Digital Nomad?',
];

function Bolha({ mensagem }: { mensagem: Mensagem }) {
  const doUsuario = mensagem.papel === 'usuario';
  return (
    <View className={`mt-3 ${doUsuario ? 'items-end' : 'items-start'}`}>
      <View
        className="max-w-[85%] rounded-2xl border p-4"
        style={{
          backgroundColor: doUsuario ? cores.marinho : cores.superficie,
          borderColor: doUsuario ? cores.marinho : cores.borda,
        }}
      >
        <Text
          className="text-sm leading-6"
          style={{ color: doUsuario ? '#FFFFFF' : cores.texto }}
        >
          {mensagem.texto}
        </Text>
      </View>
      {!doUsuario && mensagem.fontes && mensagem.fontes.length > 0 ? (
        <View className="mt-1 ml-2 max-w-[85%] px-2 py-1">
          <Text className="text-caption" style={{ color: cores.texto4 }}>
            {`Fonte: ${mensagem.fontes.join(' · ')}`}
          </Text>
        </View>
      ) : null}
    </View>
  );
}