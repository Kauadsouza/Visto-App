import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface ContaLocal {
  /** Identificador único (gera no cadastro). */
  id: string;
  nome: string;
  email?: string;
  /** Hash do PIN (não guardamos o PIN em texto puro). */
  pinHash: string;
  criadoEm: number;
}

interface Estado {
  /** null quando não há conta cadastrada neste aparelho. */
  conta: ContaLocal | null;
  /** Quando o usuário acabou de digitar o PIN e a tela está verificando. */
  carregando: boolean;
  /**
   * true enquanto o persist ainda não leu o que estava salvo. O GuardaRota
   * espera isso terminar antes de decidir por onde mandar o usuário — sem isso
   * ele veria `conta: null` por um frame e jogaria pra tela de login mesmo
   * com conta salva.
   */
  hidratado: boolean;
  erro: string | null;

  cadastrar: (nome: string, email: string | undefined, pin: string) => Promise<void>;
  entrar: (pin: string) => Promise<void>;
  sair: () => void;
  limparErro: () => void;
}

const STORAGE_NAME = 'conta-pin';
const PIN_LENGTH_MIN = 4;
const PIN_LENGTH_MAX = 8;

/** Hash simples. Não é segurança real, mas não é texto puro. */
async function hash(texto: string): Promise<string> {
  const enc = new TextEncoder();
  const bytes = enc.encode(texto);
  let hash = 0;
  for (const b of bytes) {
    hash = (hash * 31 + b) >>> 0;
  }
  // Sal com 6 rounds para dificultar colisão trivial.
  let acc = `v1$${hash.toString(16)}`;
  for (let i = 0; i < 6; i++) {
    let h2 = 0;
    for (const c of acc) h2 = (h2 * 17 + c.charCodeAt(0)) >>> 0;
    acc = `v${i + 2}$${h2.toString(16)}`;
  }
  return acc;
}

const storage = {
  async getItem(key: string) {
    if (Platform.OS === 'web') return AsyncStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') return AsyncStorage.setItem(key, value);
    return SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string) {
    if (Platform.OS === 'web') return AsyncStorage.removeItem(key);
    return SecureStore.deleteItemAsync(key);
  },
};

export const useAuth = create<Estado>()(
  persist(
    (set, get) => ({
      conta: null,
      carregando: false,
      hidratado: false,
      erro: null,

      async cadastrar(nome, email, pin) {
        set({ erro: null });
        const n = nome.trim();
        if (n.length < 2) {
          set({ erro: 'Nome precisa ter pelo menos 2 letras.' });
          throw new Error('nome-curto');
        }
        if (pin.length < PIN_LENGTH_MIN || pin.length > PIN_LENGTH_MAX) {
          set({ erro: `PIN precisa ter entre ${PIN_LENGTH_MIN} e ${PIN_LENGTH_MAX} dígitos.` });
          throw new Error('pin-invalido');
        }
        if (!/^\d+$/.test(pin)) {
          set({ erro: 'PIN só pode ter números.' });
          throw new Error('pin-nao-numerico');
        }
        if (get().conta) {
          set({ erro: 'Já existe conta neste aparelho. Saia antes de criar outra.' });
          throw new Error('conta-existente');
        }

        const pinHash = await hash(pin);
        set({
          conta: {
            id: `${Date.now()}`,
            nome: n,
            email: email?.trim() || undefined,
            pinHash,
            criadoEm: Date.now(),
          },
        });
      },

      async entrar(pin) {
        set({ erro: null, carregando: true });
        try {
          const c = get().conta;
          if (!c) {
            set({ erro: 'Nenhuma conta cadastrada neste aparelho.' });
            return;
          }
          const pinHash = await hash(pin);
          if (pinHash !== c.pinHash) {
            set({ erro: 'PIN incorreto.' });
            return;
          }
          // "Entrar" com PIN válido não muda nada além de confirmar — o estado
          // já tinha a conta. Mantemos assim porque a tela de PIN é o que
          // segura a porta, não o store.
        } finally {
          set({ carregando: false });
        }
      },

      sair() {
        set({ conta: null, erro: null });
      },

      limparErro() {
        set({ erro: null });
      },
    }),
    {
      name: STORAGE_NAME,
      storage: createJSONStorage(() => ({
        getItem: storage.getItem,
        setItem: storage.setItem,
        removeItem: storage.removeItem,
      })),
      onRehydrateStorage: () => () => {
        // Roda depois que o storage do dispositivo responde (ou falha): é o
        // ponto em que `conta` já vale o que estava salvo, ou o padrão.
        useAuth.setState({ hidratado: true });
      },
    }
  )
);