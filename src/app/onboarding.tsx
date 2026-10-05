import { useRef, useState } from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ArrowRight, Compass, FileCheck, Route } from 'lucide-react-native';

import { Botao } from '@/components/Botao';
import { cores } from '@/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icone: Compass,
    titulo: 'Sair do Brasil é um processo.',
    texto:
      'Não é um visto que se pede num fim de semana. É uma sequência de decisões, dinheiro e documentos. A gente te mostra o caminho, na ordem.',
  },
  {
    icone: FileCheck,
    titulo: 'Responda 8 perguntas.',
    texto:
      'Sua idade, seu dinheiro, seu objetivo, seu inglês. Com isso a gente calcula quais caminhos de imigração são realmente viáveis para o seu perfil.',
  },
  {
    icone: Route,
    titulo: 'Descubra o que é real pra você.',
    texto:
      'Custo, prazo e o que você precisa fazer primeiro. Sem promessa irrealista e sem assessedoria jurídica — só informação clara para você decidir.',
  },
] as const;

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [indice, setIndice] = useState(0);

  const progresso = useSharedValue(0);
  const opacidade = useSharedValue(0);

  const barraStyle = useAnimatedStyle(() => ({
    width: `${((indice + 1) / SLIDES.length) * 100}%` as `${number}%`,
  }));

  const conteudoStyle = useAnimatedStyle(() => ({
    opacity: withTiming(progresso.value, { duration: 200 }),
    transform: [{ translateY: withSpring((1 - progresso.value) * 8) }],
  }));

  const avancar = () => {
    if (indice < SLIDES.length - 1) {
      const proximo = indice + 1;
      setIndice(proximo);
      progresso.value = 0;
      progresso.value = 1;
      scrollRef.current?.scrollTo({ x: width * proximo, animated: true });
    } else {
      router.push('/auth');
    }
  };

  const voltarParaInicio = () => {
    if (indice === 0) return;
    const anterior = indice - 1;
    setIndice(anterior);
    progresso.value = 1;
    scrollRef.current?.scrollTo({ x: width * anterior, animated: true });
  };

  return (
    <View className="flex-1 bg-fundo">
      <View
        className="flex-row items-center"
        style={{ paddingTop: insets.top + 8, paddingHorizontal: 24 }}
      >
        <View className="h-1 flex-1 overflow-hidden rounded-full bg-superficie-2">
          <Animated.View
            style={[
              { height: '100%', backgroundColor: cores.verde },
              barraStyle,
            ]}
          />
        </View>
        <Animated.View style={conteudoStyle}>
          <Text className="ml-4 text-sm text-texto-3">
            {indice + 1}/{SLIDES.length}
          </Text>
        </Animated.View>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const novo = Math.round(e.nativeEvent.contentOffset.x / width);
          if (novo !== indice) {
            setIndice(novo);
            progresso.value = 0;
            progresso.value = 1;
          }
        }}
      >
        {SLIDES.map((slide, i) => {
          const Icone = slide.icone;
          return (
            <View
              key={slide.titulo}
              className="flex-1 justify-center px-8"
              style={{ width }}
            >
              <View className="mb-10 h-16 w-16 items-center justify-center rounded-2xl border border-borda bg-superficie">
                <Icone size={28} color={cores.verde} />
              </View>

              <Text className="text-3xl font-bold leading-9 text-texto">
                {slide.titulo}
              </Text>
              <Text className="mt-4 text-base leading-7 text-texto-2">
                {slide.texto}
              </Text>

              <View className="mt-8 flex-row">
                {i === 0 ? null : (
                  <Text className="text-xs uppercase tracking-widest text-texto-3">
                    {`0${i + 1}`}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View
        className="px-8"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <View className="mb-6 flex-row justify-center">
          {SLIDES.map((slide, i) => (
            <View
              key={slide.titulo}
              className="mx-1 h-2 w-2 rounded-full"
              style={{
                backgroundColor: i <= indice ? cores.verde : cores.superficie2,
              }}
            />
          ))}
        </View>

        {indice > 0 ? (
          <Text
            onPress={voltarParaInicio}
            className="mb-3 text-center text-sm text-texto-3"
          >
            Voltar
          </Text>
        ) : null}

        <Botao
          titulo={indice === SLIDES.length - 1 ? 'Começar' : 'Continuar'}
          onPress={avancar}
          className="flex-row"
        />
      </View>
    </View>
  );
}
