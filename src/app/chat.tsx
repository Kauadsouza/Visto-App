import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, Send } from 'lucide-react-native';

import { Tela } from '@/components/Tela';
import {
  enviarMensagem,
  LIMITE_MENSAGENS_DIA,
  TAMANHO_MAX,
  validarInput,
  type Mensagem,
} from '@/lib/chat';
import { temAcesso, usePlano } from '@/store/plano';
import { cores } from '@/theme';

export default function Chat() {
  const insets = useSafeAreaInsets();
  const { assinatura } = usePlano();
  const scrollRef = useRef<ScrollView>(null);

  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const assinado = temAcesso(assinatura);

  async function aoEnviar() {
    setErro(null);
    const validacao = validarInput(input);
    if (!validacao.ok) {
      setErro(validacao.mensagem);
      return;
    }
    if (!assinado) {
      setErro('A IA entra na próxima fase e exige assinatura ativa.');
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
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const resposta = await enviarMensagem([...mensagens, nova], nova.texto);
      setMensagens((atual) => [...atual, resposta]);
    } catch (e) {
      setErro('Não foi possível enviar. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View style={{ paddingTop: insets.top + 16 }} className="px-6 pb-4">
          <Text className="text-label font-semibold uppercase" style={{ color: cores.verde }}>
            ia auxiliar
          </Text>
          <Text className="mt-1 text-2xl font-bold" style={{ color: cores.texto }}>
            Tire dúvidas em segundos
          </Text>
          <Text className="mt-1 text-caption" style={{ color: cores.texto3 }}>
            {`${LIMITE_MENSAGENS_DIA} mensagens por dia · anônimo para a IA`}
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        >
          {!assinado ? (
            <View
              className="mt-10 rounded-2xl border p-6"
              style={{ backgroundColor: cores.superficie2, borderColor: cores.bordaForte }}
            >
              <Lock size={20} color={cores.verde} />
              <Text className="mt-3 text-lg font-semibold" style={{ color: cores.texto }}>
                Precisa de acesso completo
              </Text>
              <Text className="mt-2 text-sm leading-6" style={{ color: cores.texto2 }}>
                A IA entra na próxima fase do produto. O esqueleto do chat
                já está aqui, e o limite será de {LIMITE_MENSAGENS_DIA} mensagens
                por dia para assinantes.
              </Text>
            </View>
          ) : mensagens.length === 0 ? (
            <View className="mt-12">
              <Text
                className="text-center text-base leading-7"
                style={{ color: cores.texto3 }}
              >
                Pergunte qualquer coisa sobre o seu caso de imigração.
                A IA cita a fonte oficial antes de responder.
              </Text>
            </View>
          ) : (
            mensagens.map((m) => <Bolha key={m.id} mensagem={m} />)
          )}

          {erro ? (
            <View
              className="mt-3 rounded-xl border p-3"
              style={{ backgroundColor: `${cores.erro}10`, borderColor: `${cores.erro}47` }}
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
              onChangeText={setInput}
              placeholder="Pergunte alguma coisa…"
              placeholderTextColor={cores.texto4}
              editable={!enviando && assinado}
              multiline
              maxLength={TAMANHO_MAX}
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

function Bolha({ mensagem }: { mensagem: Mensagem }) {
  const doUsuario = mensagem.papel === 'usuario';
  return (
    <View
      className={`mt-3 max-w-[80%] rounded-2xl border p-3 ${doUsuario ? 'self-end' : 'self-start'}`}
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
  );
}