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
import { Send, Sparkles } from 'lucide-react-native';

import { Tela } from '@/components/Tela';
import {
  enviarMensagem,
  LIMITE_MENSAGENS_DIA,
  mensagensHoje,
  TAMANHO_MAX_INPUT,
  validarInput,
  type Mensagem,
} from '@/lib/chat';
import { useAuth } from '@/store/auth';
import { cores } from '@/theme';

export default function Chat() {
  const insets = useSafeAreaInsets();
  const { conta } = useAuth();
  const scrollRef = useRef<ScrollView>(null);

  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Reset diário: a contagem é calculada a cada render pelas mensagens
  // de hoje, então não precisa atualizar manualmente quando virar o dia.
  const usadas = mensagensHoje(mensagens);
  const restantes = Math.max(0, LIMITE_MENSAGENS_DIA - usadas);
  const limiteAtingido = restantes === 0;

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
    if (!conta) {
      setErro('Crie um PIN na aba Conta para usar o chat.');
      return;
    }
    if (limiteAtingido) {
      setErro(`Limite diário de ${LIMITE_MENSAGENS_DIA} mensagens. Amanhã libera de novo.`);
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
        <View style={{ paddingTop: insets.top + 16 }} className="px-6 pb-3">
          <Text
            className="text-label font-semibold uppercase"
            style={{ color: cores.verde }}
          >
            ia auxiliar
          </Text>
          <Text className="mt-1 text-2xl font-bold" style={{ color: cores.texto }}>
            Tire dúvidas em segundos
          </Text>
          <View className="mt-1 flex-row items-center justify-between">
            <Text className="text-caption" style={{ color: cores.texto3 }}>
              {`${LIMITE_MENSAGENS_DIA} mensagens por dia · resposta a partir de regras oficiais`}
            </Text>
            <View
              className="flex-row items-center rounded-full px-2.5 py-1"
              style={{
                backgroundColor: restantes > 0 ? `${cores.verde}1F` : `${cores.atencao}1F`,
              }}
            >
              <Sparkles
                size={11}
                color={restantes > 0 ? cores.verde : cores.atencao}
              />
              <Text
                className="ml-1 text-caption font-semibold"
                style={{ color: restantes > 0 ? cores.verde : cores.atencao }}
              >
                {`${restantes} restantes`}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        >
          {!conta ? (
            <View
              className="mt-10 rounded-2xl border p-6"
              style={{
                backgroundColor: cores.superficie2,
                borderColor: cores.bordaForte,
              }}
            >
              <Text className="text-lg font-semibold" style={{ color: cores.texto }}>
                Crie um PIN para usar o chat
              </Text>
              <Text
                className="mt-2 text-sm leading-6"
                style={{ color: cores.texto2 }}
              >
                A IA auxiliar é a parte interativa do app. Sem conta local
                criada, ela fica desligada — assim ninguém vê o histórico
                de outra pessoa que usou o mesmo aparelho.
              </Text>
            </View>
          ) : mensagens.length === 0 ? (
            <View className="mt-12">
              <Text
                className="text-center text-base leading-7"
                style={{ color: cores.texto3 }}
              >
                Pergunte qualquer coisa sobre o seu caso. A IA cita a fonte
                antes de responder.
              </Text>
              <View className="mt-6 flex-row flex-wrap gap-2">
                {SUGESTOES.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setInput(s)}
                    className="rounded-full border px-3 py-1.5"
                    style={{ backgroundColor: cores.superficie, borderColor: cores.borda }}
                  >
                    <Text className="text-caption" style={{ color: cores.texto2 }}>
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            mensagens.map((m) => <Bolha key={m.id} mensagem={m} />)
          )}

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
          className="px-6 pt-3"
          style={{ paddingBottom: insets.bottom + 16, backgroundColor: cores.fundo }}
        >
          <View
            className="flex-row items-end rounded-2xl border p-2"
            style={{ backgroundColor: cores.superficie, borderColor: cores.bordaForte }}
          >
            <TextInput
              value={input}
              onChangeText={(t) => {
                setInput(t.slice(0, TAMANHO_MAX_INPUT));
                if (erro) setErro(null);
              }}
              placeholder={conta ? 'Pergunte alguma coisa…' : 'Crie um PIN na aba Conta'}
              placeholderTextColor={cores.texto4}
              editable={!enviando && Boolean(conta) && !limiteAtingido}
              multiline
              maxLength={TAMANHO_MAX_INPUT}
              className="flex-1 px-3 py-2 text-base"
              style={{ color: cores.texto, maxHeight: 120 }}
            />
            <Pressable
              accessibilityRole="button"
              onPress={aoEnviar}
              disabled={enviando || input.trim().length === 0}
              className="ml-2 h-10 w-10 items-center justify-center rounded-xl border active:opacity-80"
              style={{
                backgroundColor: cores.verde,
                borderColor: cores.verdeEscuro,
                opacity: enviando || input.trim().length === 0 ? 0.5 : 1,
              }}
            >
              <Send size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Tela>
  );
}

const SUGESTOES = [
  'Quanto custa a Inglaterra?',
  'Posso pedir visto sem ensino médio?',
  'Como funciona o Schengen 90/180?',
  'O que é Digital Nomad?',
];

function Bolha({ mensagem }: { mensagem: Mensagem }) {
  const doUsuario = mensagem.papel === 'usuario';
  return (
    <View className={`mt-3 ${doUsuario ? 'items-end' : 'items-start'}`}>
      <View
        className="max-w-[85%] rounded-2xl border p-3"
        style={{
          backgroundColor: doUsuario ? cores.verde : cores.superficie,
          borderColor: doUsuario ? cores.verdeEscuro : cores.borda,
        }}
      >
        <Text
          className="text-sm leading-5"
          style={{ color: doUsuario ? '#FFFFFF' : cores.texto }}
        >
          {mensagem.texto}
        </Text>
      </View>
      {!doUsuario && mensagem.fontes && mensagem.fontes.length > 0 ? (
        <View
          className="mt-1 ml-2 max-w-[85%] rounded-lg border px-2 py-1"
          style={{ backgroundColor: `${cores.verde}10`, borderColor: cores.bordaVerde }}
        >
          <Text
            className="text-caption"
            style={{ color: cores.verde }}
          >
            {`Fonte: ${mensagem.fontes.join(' · ')}`}
          </Text>
        </View>
      ) : null}
    </View>
  );
}