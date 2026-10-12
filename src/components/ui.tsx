import { Pressable, Text, View } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';

import { cores, elevacao } from '@/theme';

/**
 * Card base do sistema.
 *
 * A profundidade vem de cor de fundo, borda e respiro — sombra é um reforço
 * opcional (`elevado`), não o que define a hierarquia. Em papel claro a
 * sombra existe e ajuda a folha a descolar da mesa.
 *
 * `elevacao` recebe o tema, então a tela escolhe: `elevacao(temaAtual(), n)`.
 * As telas usam o helper `temaAtual()`; o resto do app consome `cores`, que já
 * é a paleta ativa.
 */
export function Card({
  children,
  nivel = 1,
  borda,
  elevado = false,
  className = '',
}: {
  children: React.ReactNode;
  nivel?: 0 | 1 | 2 | 3;
  borda?: string;
  elevado?: boolean;
  className?: string;
}) {
  const e = elevacao('light', nivel);
  return (
    <View
      className={`rounded-2xl border ${className}`}
      style={[
        { backgroundColor: e.fundo, borderColor: borda ?? e.borda },
        elevado
          ? {
              shadowColor: '#16130F',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 2,
            }
          : null,
      ]}
    >
      {children}
    </View>
  );
}

/** Rótulo pequeno em maiúscula. Cria a hierarquia sem competir com o título. */
export function Rotulo({
  children,
  cor = cores.texto3,
  className = '',
}: {
  children: React.ReactNode;
  cor?: string;
  className?: string;
}) {
  return (
    <Text
      className={`text-label font-semibold uppercase ${className}`}
      style={{ color: cor }}
    >
      {children}
    </Text>
  );
}

/**
 * Título de tela ou de seção.
 *
 * Serifada de propósito: é a maior alavanca de "isso parece um serviço
 * sério" que existe sem custo. O corpo continua sem serifa — a mistura é o
 * que dá o ar editorial, não a serifa sozinha.
 */
export function Titulo({
  children,
  tamanho = '4xl',
  className = '',
  cor = cores.texto,
}: {
  children: React.ReactNode;
  tamanho?: '2xl' | '3xl' | '4xl' | '5xl';
  className?: string;
  cor?: string;
}) {
  return (
    <Text
      className={`font-serif text-${tamanho} ${className}`}
      style={{ color: cor }}
    >
      {children}
    </Text>
  );
}

/** Título de seção, dentro de uma tela que já tem título. */
export function TituloSecao({ children }: { children: React.ReactNode }) {
  return (
    <Text className="mt-8 text-label font-semibold uppercase" style={{ color: cores.texto3 }}>
      {children}
    </Text>
  );
}

/** Etiqueta colorida (viabilidade, status). */
export function Etiqueta({
  texto,
  cor,
  fundo,
}: {
  texto: string;
  cor: string;
  fundo?: string;
}) {
  return (
    <View
      className="self-start rounded-full px-3 py-1"
      style={{ backgroundColor: fundo ?? `${cor}1F` }}
    >
      <Text className="text-caption font-semibold" style={{ color: cor }}>
        {texto}
      </Text>
    </View>
  );
}

/** Selo de destaque. Dourado é raro de propósito — quando aparece, significa algo. */
export function Selo({
  texto,
  Icone: Ico,
}: {
  texto: string;
  Icone?: LucideIcon;
}) {
  return (
    <View
      className="self-start flex-row items-center gap-1.5 rounded-full border px-3 py-1"
      style={{ backgroundColor: `${cores.dourado}14`, borderColor: `${cores.dourado}47` }}
    >
      {Ico ? <Ico size={11} color={cores.dourado} /> : null}
      <Text className="text-label font-semibold uppercase" style={{ color: cores.dourado }}>
        {texto}
      </Text>
    </View>
  );
}

/** Ícone dentro de um bloco com fundo — dá peso ao cabeçalho de cada tela. */
export function IconeQuadrado({
  Icone: Ico,
  cor = cores.marinho,
  tamanho = 44,
}: {
  Icone: LucideIcon;
  cor?: string;
  tamanho?: number;
}) {
  const icone = Math.round(tamanho * 0.5);
  return (
    <View
      className="items-center justify-center rounded-xl border"
      style={{
        width: tamanho,
        height: tamanho,
        backgroundColor: `${cor}14`,
        borderColor: `${cor}3D`,
      }}
    >
      <Ico size={icone} color={cor} />
    </View>
  );
}

/** Aviso destacado. O tom decide a seriedade: informativo, atenção, erro. */
export function Aviso({
  texto,
  tom = 'info',
  Icone,
}: {
  texto: string;
  tom?: 'info' | 'atencao' | 'erro';
  Icone?: LucideIcon;
}) {
  const paleta = {
    info: { cor: cores.info, fundo: `${cores.info}14`, borda: `${cores.info}40` },
    atencao: { cor: cores.atencao, fundo: `${cores.atencao}14`, borda: `${cores.atencao}47` },
    erro: { cor: cores.erro, fundo: `${cores.erro}14`, borda: `${cores.erro}47` },
  }[tom];

  return (
    <View
      className="flex-row rounded-xl border p-4"
      style={{ backgroundColor: paleta.fundo, borderColor: paleta.borda }}
    >
      {Icone ? (
        <Icone size={17} color={paleta.cor} className="mt-0.5" />
      ) : (
        <View
          className="mt-1.5 h-2 w-2 rounded-full"
          style={{ backgroundColor: paleta.cor }}
        />
      )}
      <Text className="ml-3 flex-1 text-caption leading-5" style={{ color: cores.texto2 }}>
        {texto}
      </Text>
    </View>
  );
}

/** Barra de progresso fina, usada em várias telas. */
export function Barra({
  valor,
  altura = 4,
  cor = cores.marinho,
  fundo = cores.superficie3,
}: {
  valor: number;
  altura?: number;
  cor?: string;
  fundo?: string;
}) {
  const pct = Math.max(0, Math.min(100, valor));
  return (
    <View
      className="w-full overflow-hidden rounded-full"
      style={{ height: altura, backgroundColor: fundo }}
    >
      <View
        className="h-full rounded-full"
        style={{ width: `${pct}%`, backgroundColor: cor }}
      />
    </View>
  );
}

/** Número grande com rótulo embaixo. Usado no contador e no resultado. */
export function Numero({
  valor,
  rotulo,
  cor = cores.texto,
  tamanho = 22,
}: {
  valor: string;
  rotulo: string;
  cor?: string;
  tamanho?: number;
}) {
  return (
    <View className="flex-1 pr-2">
      <Text style={{ color: cor, fontSize: tamanho, lineHeight: tamanho + 6, fontWeight: '700' }}>
        {valor}
      </Text>
      <Text className="mt-1 text-caption leading-4" style={{ color: cores.texto3 }}>
        {rotulo}
      </Text>
    </View>
  );
}

/**
 * Linha de navegação entre telas: título, descrição e um chevron.
 *
 * Antes cada tela tinha a sua própria versão disso (a `Atalho` da home era
 * uma cópia). Centralizar aqui é o que faz o app parecer um sistema só.
 */
export function LinhaNavegacao({
  titulo,
  descricao,
  Icone: Ico,
  aoTocar,
}: {
  titulo: string;
  descricao?: string;
  Icone?: LucideIcon;
  aoTocar: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={aoTocar}
      className="flex-row items-center rounded-xl border p-4 active:opacity-70"
      style={{ backgroundColor: cores.superficie, borderColor: cores.borda }}
    >
      {Ico ? (
        <View className="mr-3">
          <Ico size={18} color={cores.marinho} />
        </View>
      ) : null}
      <View className="flex-1 pr-3">
        <Text className="text-base font-semibold" style={{ color: cores.texto }}>
          {titulo}
        </Text>
        {descricao ? (
          <Text className="mt-0.5 text-caption leading-5" style={{ color: cores.texto3 }}>
            {descricao}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={18} color={cores.texto4} />
    </Pressable>
  );
}