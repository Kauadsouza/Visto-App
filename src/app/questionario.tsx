import { useRef, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Check } from 'lucide-react-native';

import { Botao } from '@/components/Botao';
import { Cabecalho } from '@/components/Cabecalho';
import { PERGUNTAS } from '@/lib/perguntas';
import { respostaValida, useQuestionario } from '@/store/questionario';
import { cores } from '@/theme';

export default function Questionario() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const { respostas, indice, responder, irPara } = useQuestionario();

  const pergunta = PERGUNTAS[indice];
  const valor = respostas[pergunta.chave];
  const ultima = indice === PERGUNTAS.length - 1;
  const avancavel = respostaValida(pergunta, valor);

  // Trocar de pergunta começa sempre no topo.
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [indice]);

  const voltar = () => {
    if (indice === 0) {
      router.back();
      return;
    }
    irPara(indice - 1);
  };

  const avancar = () => {
    if (!avancavel) return;
    if (ultima) {
      router.push('/resultado');
      return;
    }
    irPara(indice + 1);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-fundo"
    >
      <View style={{ paddingTop: insets.top }}>
        <Cabecalho titulo="Seu perfil" />

        {/* Barra de progresso */}
        <View className="px-6 pb-5">
          <View className="h-1 w-full overflow-hidden rounded-full bg-superficie-2">
            <View
              className="h-full rounded-full bg-verde"
              style={{ width: `${((indice + 1) / PERGUNTAS.length) * 100}%` }}
            />
          </View>
          <Text className="mt-2 text-xs uppercase tracking-widest text-texto-3">
            {`pergunta ${indice + 1} de ${PERGUNTAS.length}`}
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-2xl font-bold leading-8 text-texto">
          {pergunta.texto}
        </Text>
        {pergunta.ajuda ? (
          <Text className="mt-3 text-sm leading-6 text-texto-2">
            {pergunta.ajuda}
          </Text>
        ) : null}

        <View className="mt-8">
          {pergunta.tipo === 'opcoes'
            ? pergunta.opcoes!.map((opcao) => {
                const escolhida = valor === opcao.valor;
                return (
                  <Pressable
                    key={opcao.valor}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: escolhida }}
                    onPress={() => responder(pergunta.chave, opcao.valor)}
                    className="mb-3 flex-row items-center rounded-xl border p-4 active:opacity-80"
                    style={{
                      borderColor: escolhida ? cores.verde : cores.borda,
                      backgroundColor: escolhida ? '#16A34A18' : cores.superficie,
                    }}
                  >
                    <Text
                      className="flex-1 text-base"
                      style={{ color: escolhida ? cores.texto : cores.texto2 }}
                    >
                      {opcao.rotulo}
                    </Text>
                    {escolhida ? <Check size={20} color={cores.verde} /> : null}
                  </Pressable>
                );
              })
            : (
                <TextInput
                  value={valor}
                  onChangeText={(t) => responder(pergunta.chave, t)}
                  placeholder={pergunta.placeholder}
                  placeholderTextColor={cores.texto3}
                  keyboardType={pergunta.tipo === 'numero' ? 'number-pad' : 'default'}
                  autoFocus
                  className="h-14 rounded-xl border border-borda bg-superficie px-4 text-lg text-texto"
                />
              )}
        </View>

        {pergunta.tipo === 'numero' && valor ? (
          <Text className="mt-3 text-xs text-texto-3">
            {`Entre ${pergunta.min} e ${pergunta.max} anos.`}
          </Text>
        ) : null}
      </ScrollView>

      <View
        className="flex-row gap-3 px-6"
        style={{ paddingBottom: insets.bottom + 20 }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={voltar}
          className="h-14 w-14 items-center justify-center rounded-xl border border-borda active:opacity-70"
        >
          <ArrowLeft size={20} color={cores.texto2} />
        </Pressable>

        <Botao
          titulo={ultima ? 'Ver meu resultado' : 'Próxima'}
          onPress={avancar}
          disabled={!avancavel}
          className="flex-1"
        />
      </View>
    </KeyboardAvoidingView>
  );
}