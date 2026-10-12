import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Consultoria por IA — camada 2.
 *
 * Guarda só o fato de que a pessoa contratou e quando. O plano em si NÃO é
 * guardado: ele é derivado das respostas na hora em que a tela abre. Assim,
 * refazer o questionário atualiza o plano, e não existe relatório antigo
 * contradizendo o perfil novo.
 */

export const PRECO_CONSULTORIA_IA = 89;

interface Estado {
  /** Epoch ms da contratação, ou null se ainda não contratou. */
  contratadoEm: number | null;
  contratar: () => void;
  cancelar: () => void;
}

export const useConsultoriaIA = create<Estado>()(
  persist(
    (set) => ({
      contratadoEm: null,

      contratar: () => set({ contratadoEm: Date.now() }),
      cancelar: () => set({ contratadoEm: null }),
    }),
    {
      name: 'visto:consultoria-ia',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function consultoriaIAAtiva(contratadoEm: number | null): boolean {
  return typeof contratadoEm === 'number';
}