import { useRef, useState } from 'react';
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Compass, FileCheck2, Route } from 'lucide-react-native';

import { Botao } from '@/components/Botao';
import { Tela } from '@/components/Tela';
import { Barra, IconeQuadrado } from '@/components/ui';
import { cores } from '@/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    Icone: Compass,
    titulo: 'Sair do Brasil é um processo.',
    texto:
      'Não é um visto que se pede num fim de semana. É uma sequência de decisões, dinheiro e documentos. A gente te mostra o caminho, na ordem.',
  },
  {
    Icone: FileCheck2,
    titulo: 'Responda 8 perguntas.',
    texto:
      'Sua idade, seu dinheiro, seu objetivo, seu inglês. Com isso calculamos quais caminhos são realmente viáveis para o seu perfil.',
  },
  {
    Icone: Route,
    titulo: 'Descubra o que é real pra você.',
    texto:
      'Custo, prazo e o que você precisa fazer primeiro. Sem promessa irrealista e sem pseudo-assessoria jurídica — só informação clara para você decidir.',
  },
];

export default function Onboarding() {
  const scrollRef = useRef<ScrollView>(null);
  const [indice, setIndice] = useState(0);

  const irPara = (novo: number) => {
    setIndice(novo);
    scrollRef.current?.scrollTo({ x: width * novo, animated: true });
  };

  const avancar = () => {
    if (indice < SLIDES.length - 1) irPara(indice + 1);
    else router.push('/auth');
  };

  return (
    <Tela>
    <View className="flex-1">
      {/* Topo: progresso em segmentos — mostra quantas etapas faltam */}
      <View className="flex-row gap-1.5 px-6 pt-5">
        {SLIDES.map((s, i) => (
          <View key={s.titulo} className="flex-1">
            <Barra
              valor={i <= indice ? 100 : 0}
              altura={3}
              cor={i <= indice ? cores.verde : cores.superficie3}
            />
          </View>
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const novo = Math.round(e.nativeEvent.contentOffset.x / width);
          if (novo !== indice) setIndice(novo);
        }}
        className="flex-1"
      >
        {SLIDES.map(({ Icone, titulo, texto }, i) => (
          <View
            key={titulo}
            className="flex-1 justify-center px-8"
            style={{ width }}
          >
            <View className="mb-10 flex-row items-center gap-4">
              <IconeQuadrado Icone={Icone} tamanho={52} />
              <Text
                className="text-caption font-semibold uppercase"
                style={{ color: cores.texto3, letterSpacing: 1.6 }}
              >
                {`passo ${i + 1} de ${SLIDES.length}`}
              </Text>
            </View>

            <Text className="text-3xl font-bold" style={{ color: cores.texto }}>
              {titulo}
            </Text>

            <Text className="mt-5 text-base leading-7" style={{ color: cores.texto2 }}>
              {texto}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View className="px-6 pb-6">
        {indice > 0 ? (
          <Pressable onPress={() => irPara(indice - 1)} className="mb-4 items-center py-2">
            <Text className="text-sm" style={{ color: cores.texto3 }}>
              Voltar
            </Text>
          </Pressable>
        ) : null}

        <Botao
          titulo={indice === SLIDES.length - 1 ? 'Começar' : 'Continuar'}
          onPress={avancar}
        />
      </View>
    </View>
    </Tela>
  );
}