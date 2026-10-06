import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RegistroViagem } from '@/lib/database.types';

export interface AssinaturaLocal {
  status: 'inativa' | 'ativa' | 'cancelada' | 'inadimplente';
  /** Epoch ms. null enquanto inativa. */
  currentPeriodEnd: number | null;
}

interface Estado {
  assinatura: AssinaturaLocal;
  /** Itens concluídos, por id do item (posição estável dentro da rota). */
  concluidos: string[];
  /** Registros de entrada/saída por país. */
  viagens: RegistroViagem[];

  alternarItem: (id: string) => void;
  reiniciarRota: () => void;
  registrarEntrada: (pais: string, dataISO: string) => void;
  registrarSaida: (dataISO: string) => void;
  removerViagem: (id: string) => void;

  // No MVP sem backend a assinatura é local. Quando houver Stripe, estas duas
  // saem do client e passam a vir da tabela `assinaturas`.
  ativarAssinaturaDemo: () => void;
  cancelarAssinatura: () => void;
}

const hojeISO = () => new Date().toISOString().slice(0, 10);

export const usePlano = create<Estado>()(
  persist(
    (set, get) => ({
      assinatura: { status: 'inativa', currentPeriodEnd: null },
      concluidos: [],
      viagens: [],

      alternarItem: (id) =>
        set((estado) => ({
          concluidos: estado.concluidos.includes(id)
            ? estado.concluidos.filter((x) => x !== id)
            : [...estado.concluidos, id],
        })),

      reiniciarRota: () => set({ concluidos: [] }),

      registrarEntrada: (pais, dataISO) => {
        // Só um país de cada vez: fecha o registro aberto antes de abrir outro.
        const anteriores = get().viagens.map((v) =>
          v.data_saida === null ? { ...v, data_saida: dataISO } : v
        );

        set({
          viagens: [
            ...anteriores,
            {
              id: `${Date.now()}`,
              user_id: 'local',
              pais,
              data_entrada: dataISO,
              data_saida: null,
              created_at: new Date().toISOString(),
            },
          ],
        });
      },

      registrarSaida: (dataISO) =>
        set((estado) => ({
          viagens: estado.viagens.map((v) =>
            v.data_saida === null ? { ...v, data_saida: dataISO } : v
          ),
        })),

      removerViagem: (id) =>
        set((estado) => ({ viagens: estado.viagens.filter((v) => v.id !== id) })),

      ativarAssinaturaDemo: () =>
        set({
          assinatura: {
            status: 'ativa',
            currentPeriodEnd: Date.now() + 30 * 86_400_000,
          },
        }),

      cancelarAssinatura: () =>
        set({ assinatura: { status: 'cancelada', currentPeriodEnd: null } }),
    }),
    {
      name: 'visto:plano',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (e) => ({
        assinatura: e.assinatura,
        concluidos: e.concluidos,
        viagens: e.viagens,
      }),
    }
  )
);

/**
 * O usuário tem acesso ao checklist inteiro?
 *
 * A assinatura mora local enquanto não houver backend. Quando o Stripe entrar,
 * este helper passa a ler `assinaturas.status` do Supabase — o resto da tela
 * não muda.
 */
export function temAcesso(assinatura: AssinaturaLocal): boolean {
  return assinatura.status === 'ativa';
}

/** Quantos itens o não-assinante vê antes do paywall. */
export const ITENS_FREE = 3;