import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/database.types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Configuração ausente não é motivo para tela branca.
 * O app sobe com `supabase = null` e cada chamada mostra a mensagem certa,
 * em vez de estourar no import.
 */
export const supabaseConfigurado = Boolean(url && anonKey);

export function erroConfigSupabase(): string | null {
  if (supabaseConfigurado) return null;
  return (
    'Supabase não configurado. Crie o arquivo .env a partir do .env.example ' +
    'e preencha EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

/**
 * Storage da sessão.
 *
 * Android guarda os tokens no Keystore do sistema via SecureStore, que é
 * cifrado em repouso. Na web o SecureStore não existe, então cai para o
 * localStorage (AsyncStorage), que é o comportamento esperado de um SPA —
 * o risco é o mesmo de qualquer cookie de sessão em navegador.
 */
const storage = {
  getItem(key: string) {
    if (Platform.OS === 'web') return AsyncStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  setItem(key: string, value: string) {
    if (Platform.OS === 'web') return AsyncStorage.setItem(key, value);
    return SecureStore.setItemAsync(key, value);
  },
  removeItem(key: string) {
    if (Platform.OS === 'web') return AsyncStorage.removeItem(key);
    return SecureStore.deleteItemAsync(key);
  },
};

/**
 * SEMPRE a `anon public key`. A `service_role` bypassa RLS e nunca pode entrar
 * num app cliente — se um dia ela aparecer no bundle, o app inteiro está
 * vazado. O check abaixo existe pra fazer isso explícito.
 */
function cliente(): SupabaseClient<Database> | null {
  if (!url || !anonKey) return null;

  if (anonKey.includes('service_role')) {
    throw new Error(
      'EXPO_PUBLIC_SUPABASE_ANON_KEY parece ser a service_role key. ' +
        'Use a anon public key — a service_role não pode ir para o cliente.'
    );
  }

  return createClient<Database>(url, anonKey, {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  });
}

export const supabase = cliente();

/**
 * Wrapper para as chamadas do app: garante que sempre exista um cliente e
 * transforma config ausente em erro legível, em vez de `null is not a function`
 * em três telas diferentes.
 */
export function exigirSupabase(): SupabaseClient<Database> {
  if (!supabase) throw new Error(erroConfigSupabase()!);
  return supabase;
}