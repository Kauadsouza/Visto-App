import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  CHAVES_RESPOSTA,
  PERGUNTAS,
  RESPOSTAS_VAZIAS,
  type Pergunta,
  type Respostas,
} from '@/lib/perguntas';

const TAMANHO_MAX_CAMPO = 120;

/**
 * Higieniza as respostas ANTES de salvar.
 *
 * A resposta de "área de atuação" é texto livre, e texto livre sempre traz
 * junto o que a pessoa colou de outros lugares. Aqui a entrada é reduzida ao
 * formato esperado: chave por chave, sem chave desconhecida, string cortada,
 * sem tags. É a defesa de nível de app — a de verdade continua sendo a RLS.
 */
export function sanitizar(entrada: unknown): Respostas {
  const limpa = { ...RESPOSTAS_VAZIAS };

  if (typeof entrada !== 'object' || entrada === null) return limpa;
  const bruto = entrada as Record<string, unknown>;

  for (const chave of CHAVES_RESPOSTA) {
    const valor = bruto[chave];

    if (typeof valor !== 'string') continue;

    // Remove qualquer tag que venha colada, depois normaliza espaços.
    const limpo = valor
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, TAMANHO_MAX_CAMPO);

    limpa[chave] = limpo;
  }

  return limpa;
}

interface Estado {
  respostas: Respostas;
  /** Índice da pergunta atual, para retomar de onde parou. */
  indice: number;
  responder: (chave: keyof Respostas, valor: string) => void;
  irPara: (indice: number) => void;
  reiniciar: () => void;
}

export const useQuestionario = create<Estado>()(
  persist(
    (set) => ({
      respostas: RESPOSTAS_VAZIAS,
      indice: 0,

      responder: (chave, valor) =>
        set((estado) => ({
          // Só as chaves do tipo são aceitas; o resto é descartado na origem.
          respostas: sanitizar({ ...estado.respostas, [chave]: valor }),
        })),

      irPara: (indice) =>
        set({
          indice: Math.max(0, Math.min(PERGUNTAS.length - 1, indice)),
        }),

      reiniciar: () => set({ respostas: RESPOSTAS_VAZIAS, indice: 0 }),
    }),
    {
      name: 'visto:questionario',
      storage: createJSONStorage(() => AsyncStorage),
      // O que vai para o disco passa pelo mesmo sanitizador.
      partialize: (estado) => ({ respostas: estado.respostas, indice: estado.indice }),
      merge: (salvo, atual) => {
        const s = (salvo ?? {}) as Partial<Estado>;
        return {
          ...atual,
          respostas: sanitizar(s.respostas ?? RESPOSTAS_VAZIAS),
          indice: typeof s.indice === 'number' ? s.indice : 0,
        };
      },
    }
  )
);

/** A resposta atual já permite seguir? */
export function respostaValida(pergunta: Pergunta, valor: string): boolean {
  if (!valor.trim()) return false;

  if (pergunta.tipo === 'numero') {
    const n = Number(valor);
    if (!Number.isFinite(n)) return false;
    if (pergunta.min !== undefined && n < pergunta.min) return false;
    if (pergunta.max !== undefined && n > pergunta.max) return false;
  }

  return true;
}