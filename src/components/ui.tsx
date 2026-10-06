import { Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { cores, elevacao } from '@/theme';

/**
 * Card base do sistema.
 *
 * Não usa sombra — em fundo escuro sombra não aparece. A profundidade vem de
 * cor de fundo, borda e respiro, e é por isso que todo card do app passa
 * por aqui em vez de repetir a mesma tripla classe.
 */
export function Card({
  children,
  nivel = 1,
  borda,
  className = '',
}: {
  children: React.ReactNode;
  nivel?: 0 | 1 | 2 | 3;
  borda?: string;
  className?: string;
}) {
const e = elevacao('dark', nivel);
  return (
    <View
      className={`rounded-2xl border ${className}`}
      style={{ backgroundColor: e.fundo, borderColor: borda ?? e.borda }}
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

/** Título de seção. */
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
}: {
  texto: string;
  cor: string;
}) {
  return (
    <View
      className="self-start rounded-full px-3 py-1"
      style={{ backgroundColor: `${cor}1F` }}
    >
      <Text className="text-caption font-semibold" style={{ color: cor }}>
        {texto}
      </Text>
    </View>
  );
}

/** Ícone dentro de um bloco com fundo — dá peso ao cabeçalho de cada tela. */
export function IconeQuadrado({
  Icone: Ico,
  cor = cores.verde,
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
  cor = cores.verde,
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