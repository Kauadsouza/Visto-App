import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { planoPorSlug, type PlanoConsultoria } from '@/lib/consultoria';

export interface ConsultoriaContratada {
  id: string;
  slug: string;
  /** Quando o usuário apertou "Confirmar contratação". */
  contratadaEm: number;
  status: 'ativa' | 'cancelada' | 'concluida';
  /** Mensagens trocadas com o consultor, persistidas com a contratação. */
  mensagens: {
    id: string;
    /** true = do usuário, false = do consultor */
    doUsuario: boolean;
    texto: string;
    criadoEm: number;
  }[];
  /**
   * Call agendada com o consultor, em epoch ms. É o entregável que justifica
   * o preço — sem ela a consultoria humana vira "mensagem", que a camada de IA
   * já entrega de graça.
   */
  callEm: number | null;
}

interface Estado {
  ativas: ConsultoriaContratada[];

  contratar: (slug: string) => ConsultoriaContratada | null;
  cancelar: (id: string) => void;
  adicionarMensagem: (
    id: string,
    mensagem: { doUsuario: boolean; texto: string }
  ) => void;
  agendarCall: (id: string, quando: number) => void;
  cancelarCall: (id: string) => void;
  ativasDoPlano: (slug: string) => ConsultoriaContratada[];
}

export const useConsultorias = create<Estado>()(
  persist(
    (set, get) => ({
      ativas: [],

      contratar(slug) {
        const plano = planoPorSlug(slug);
        if (!plano) return null;
        // Não permite duas contratações ativas do mesmo plano.
        if (get().ativas.some((c) => c.slug === slug && c.status === 'ativa')) {
          return get().ativas.find((c) => c.slug === slug && c.status === 'ativa')!;
        }
        const nova: ConsultoriaContratada = {
          id: `${Date.now()}`,
          slug,
          contratadaEm: Date.now(),
          status: 'ativa',
          mensagens: [],
          callEm: null,
        };
        set({ ativas: [...get().ativas, nova] });
        return nova;
      },

      cancelar(id) {
        set({
          ativas: get().ativas.map((c) =>
            c.id === id && c.status === 'ativa'
              ? { ...c, status: 'cancelada' }
              : c
          ),
        });
      },

      adicionarMensagem(id, mensagem) {
        set({
          ativas: get().ativas.map((c) =>
            c.id === id
              ? {
                  ...c,
                  mensagens: [
                    ...c.mensagens,
                    { id: `${Date.now()}-${c.mensagens.length}`, criadoEm: Date.now(), ...mensagem },
                  ],
                }
              : c
          ),
        });
      },

      agendarCall(id, quando) {
        set({
          ativas: get().ativas.map((c) => (c.id === id ? { ...c, callEm: quando } : c)),
        });
      },

      cancelarCall(id) {
        set({
          ativas: get().ativas.map((c) => (c.id === id ? { ...c, callEm: null } : c)),
        });
      },

      ativasDoPlano(slug) {
        return get().ativas.filter((c) => c.slug === slug && c.status === 'ativa');
      },
    }),
    {
      name: 'visto:consultorias',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/** Helper: pega a consultoria ativa mais recente de um slug. */
export function consultoriaAtiva(slug: string): ConsultoriaContratada | null {
  return useConsultorias.getState().ativasDoPlano(slug)[0] ?? null;
}

/** Resumo de uma consultoria para exibir na lista. */
export function resumoPlano(slug: string): PlanoConsultoria | undefined {
  return planoPorSlug(slug);
}