import { useEffect, useRef } from 'react';
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
import { ArrowLeft, Check } from 'lucide-react-native';

import { Botao } from '@/components/Botao';
import { Tela } from '@/components/Tela';
import { PERGUNTAS } from '@/lib/perguntas';
import { respostaValida, useQuestionario } from '@/store/questionario';
import { cores } from '@/theme';

export default function Questionario() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const { respostas, indice, responder, irPara } = useQuestionario();

  const pergunta = PERGUNTAS[indice];
  const valor = respostas[pergunta.chave];
  const ultima = indice === PERGUNTAS.length - 1;
  const avancavel = respostaValida(pergunta, valor);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [indice]);

  const voltar = () => (indice === 0 ? router.back() : irPara(indice - 1));

  const avancar = () => {
    if (!avancavel) return;
    if (ultima) router.push('/resultado');
    else irPara(indice + 1);
  };

  return (
    <Tela>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View>
        <View className="flex-row items-center gap-4 px-6 pb-5">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={voltar}
            className="h-10 w-10 items-center justify-center rounded-xl border active:opacity-70"
            style={{ backgroundColor: cores.superficie, borderColor: cores.borda }}
          >
            <ArrowLeft size={18} color={cores.texto2} />
          </Pressable>

          <View className="flex-1">
            <View className="h-1 w-full overflow-hidden rounded-full" style={{ backgroundColor: cores.superficie3 }}>
              <View
                className="h-full rounded-full"
                style={{
                  width: `${((indice + 1) / PERGUNTAS.length) * 100}%`,
                  backgroundColor: cores.verde,
                }}
              />
            </View>
          </View>

          <Text
            className="text-caption font-semibold"
            style={{ color: cores.texto3, width: 46, textAlign: 'right' }}
          >
            {`${indice + 1}/${PERGUNTAS.length}`}
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-2xl font-bold" style={{ color: cores.texto }}>
          {pergunta.texto}
        </Text>
        {pergunta.ajuda ? (
          <Text className="mt-3 text-sm leading-6" style={{ color: cores.texto2 }}>
            {pergunta.ajuda}
          </Text>
        ) : null}

        <View className="mt-8">
          {pergunta.tipo === 'opcoes' ? (
            <View className="gap-3">
              {pergunta.opcoes!.map((opcao) => {
                const escolhida = valor === opcao.valor;
                return (
                  <Pressable
                    key={opcao.valor}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: escolhida }}
                    onPress={() => responder(pergunta.chave, opcao.valor)}
                    className="flex-row items-center rounded-xl border p-4 active:opacity-80"
                    style={{
                      borderColor: escolhida ? cores.verde : cores.borda,
                      backgroundColor: escolhida ? `${cores.verde}14` : cores.superficie,
                    }}
                  >
                    {/* Marcador à esquerda: dá um alvo de toque maior que o texto */}
                    <View
                      className="mr-3 h-5 w-5 items-center justify-center rounded-full border"
                      style={{
                        borderColor: escolhida ? cores.verde : cores.bordaForte,
                        backgroundColor: escolhida ? cores.verde : 'transparent',
                      }}
                    >
                      {escolhida ? <Check size={12} color={cores.texto} /> : null}
                    </View>

                    <Text
                      className="flex-1 text-base"
                      style={{ color: escolhida ? cores.texto : cores.texto2 }}
                    >
                      {opcao.rotulo}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View>
              <TextInput
                value={valor}
                onChangeText={(t) => responder(pergunta.chave, t)}
                placeholder={pergunta.placeholder}
                placeholderTextColor={cores.texto4}
                keyboardType={pergunta.tipo === 'numero' ? 'number-pad' : 'default'}
                autoFocus
                className="h-14 rounded-xl border bg-superficie px-4 text-lg"
                style={{ borderColor: cores.borda, color: cores.texto }}
              />
              {pergunta.tipo === 'numero' ? (
                <Text className="mt-3 text-caption" style={{ color: cores.texto3 }}>
                  {`Entre ${pergunta.min} e ${pergunta.max} anos.`}
                </Text>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>

      <View className="px-6 pt-2 pb-4">
        <Botao
          titulo={ultima ? 'Ver meu resultado' : 'Próxima'}
          onPress={avancar}
          disabled={!avancavel}
        />
      </View>
    </KeyboardAvoidingView>
    </Tela>
  );
}