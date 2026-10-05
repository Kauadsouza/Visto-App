import { create } from 'zustand';
import { Platform } from 'react-native';
import * as ExpoLinking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';

import { erroConfigSupabase, exigirSupabase, supabaseConfigurado } from '@/lib/supabase';

interface EstadoAuth {
  session: Session | null;
  /** `true` enquanto o token guardado no disco ainda não foi lido. */
  carregando: boolean;
  /** Mensagem de erro da última ação, já em português. */
  erro: string | null;
  iniciar: () => Promise<void>;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (email: string, senha: string) => Promise<void>;
  entrarComGoogle: () => Promise<void>;
  sair: () => Promise<void>;
  limparErro: () => void;
}

export const useAuth = create<EstadoAuth>((set) => ({
  session: null,
  carregando: true,
  erro: null,

  async iniciar() {
    if (!supabaseConfigurado) {
      set({ carregando: false, erro: erroConfigSupabase() });
      return;
    }

    // `getSession` devolve o token persistido (SecureStore no Android),
    // que é o que faz o app abrir já logado depois de ser fechado.
    const { data } = await exigirSupabase().auth.getSession();
    set({ session: data.session, carregando: false });

    // Mantém o store em dia em login, logout e refresh de token.
    exigirSupabase().auth.onAuthStateChange((_evento, session) => {
      set({ session, carregando: false });
    });
  },

  async entrar(email, senha) {
    set({ erro: null });
    const { error } = await exigirSupabase().auth.signInWithPassword({
      email,
      password: senha,
    });
    if (error) throw new Error(error.message);
  },

  async cadastrar(email, senha) {
    set({ erro: null });
    const { error } = await exigirSupabase().auth.signUp({
      email,
      password: senha,
      // Sem e-mail de confirmação no MVP: o usuário entra na hora.
      options: { emailRedirectTo: undefined },
    });
    if (error) throw new Error(error.message);
  },

  async entrarComGoogle() {
    set({ erro: null });
    const supabase = exigirSupabase();
    const redirectTo = redirectUri();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        // Devolve a URL em vez de trocar o app pelo navegador do sistema.
        skipBrowserRedirect: true,
      },
    });

    if (error) throw new Error(error.message);
    if (!data?.url) throw new Error('O login com Google não está disponível agora.');

    // `openAuthSessionAsync` abre a aba e volta sozinho quando o Google
    // redireciona — a pessoa não precisa trocar de app manualmente.
    const { openAuthSessionAsync } = await import('expo-web-browser');
    const retorno = await openAuthSessionAsync(data.url, redirectTo);

    if (retorno.type !== 'success') {
      throw new Error('Login cancelado.');
    }

    const { access_token, refresh_token } = extrairTokens(retorno.url);
    if (!access_token || !refresh_token) {
      throw new Error('Não foi possível concluir o login com Google.');
    }

    const { error: erroSessao } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (erroSessao) throw new Error(erroSessao.message);
  },

  async sair() {
    set({ erro: null });
    await exigirSupabase().auth.signOut();
    set({ session: null });
  },

  limparErro() {
    set({ erro: null });
  },
}));

/**
 * Lê os tokens do fragmento da URL de retorno do Google.
 *
 * Não usamos `URL`/`URLSearchParams`: no Android o suporte a custom schemes
 * (`visto://`) é incompleto e o parsing quebra. O texto puro resolve.
 */
function extrairTokens(url: string): {
  access_token: string | null;
  refresh_token: string | null;
} {
  const fragmento = url.split('#')[1] ?? '';
  const query = url.split('?')[1] ?? '';
  const fonte = fragmento || query;

  const buscar = (chave: string): string | null => {
    const achado = fonte
      .split('&')
      .map((par) => par.split('='))
      .find(([k]) => k === chave);
    return achado?.[1] ? decodeURIComponent(achado[1]) : null;
  };

  return {
    access_token: buscar('access_token'),
    refresh_token: buscar('refresh_token'),
  };
}

/** Redirect URI do OAuth: scheme nativo no app, URL do site na web. */
export function redirectUri(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }

  // `expo-linking` monta o URI a partir do `scheme` do app.json
  // (visto://auth/callback). O Linking do react-native não expõe createURL.
  return ExpoLinking.createURL('/auth/callback');
}