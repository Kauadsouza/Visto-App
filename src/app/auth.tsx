import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertTriangle } from 'lucide-react-native';

import { Botao } from '@/components/Botao';
import { MODO_SEM_BACKEND } from '@/lib/config';
import { mensagemDe } from '@/lib/erros';
import { erroConfigSupabase } from '@/lib/supabase';
import { useAuth } from '@/store/auth';

type Modo = 'entrar' | 'cadastrar';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Auth() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, erro, entrar, cadastrar, entrarComGoogle, limparErro } = useAuth();

  const [modo, setModo] = useState<Modo>('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [googleCarregando, setGoogleCarregando] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  const configFalta = erroConfigSupabase();

  // O guardião de rota já redireciona; isso cobre o caso da tela montar
  // com a sessão viva e o redirect ainda não ter rodado.
  useEffect(() => {
    if (session) router.replace('/questionario');
  }, [session, router]);

  const erroExibido = erroLocal ?? erro ?? configFalta;

  function trocarModo(novo: Modo) {
    setModo(novo);
    setErroLocal(null);
    limparErro();
  }

  /**oferece criar conta quando o email não tem cadastro — o caminho útil. */
  function sugerirCadastro() {
    if (!erro) return;
    if (/não tem conta|não possui conta|not found/i.test(erro)) {
      trocarModo('cadastrar');
    }
  }

  async function enviar() {
    const emailLimpo = email.trim().toLowerCase();

    if (!emailLimpo) return setErroLocal('Digite seu email.');
    if (!EMAIL_RE.test(emailLimpo)) return setErroLocal('Esse email não parece válido.');
    if (senha.length < 6) return setErroLocal('A senha precisa ter pelo menos 6 caracteres.');

    setErroLocal(null);
    setEnviando(true);

    try {
      if (modo === 'entrar') {
        await entrar(emailLimpo, senha);
      } else {
        await cadastrar(emailLimpo, senha);
      }
      router.replace('/questionario');
    } catch (e) {
      setErroLocal(mensagemDe(e));
      sugerirCadastro();
    } finally {
      setEnviando(false);
    }
  }

  async function comGoogle() {
    setErroLocal(null);
    setGoogleCarregando(true);
    try {
      await entrarComGoogle();
      router.replace('/questionario');
    } catch (e) {
      setErroLocal(mensagemDe(e));
    } finally {
      setGoogleCarregando(false);
    }
  }

  const ocupado = enviando || googleCarregando;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-fundo"
    >
      <View
        className="flex-1 px-8"
        style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
      >
        <Text className="text-2xl font-bold text-texto">
          {modo === 'entrar' ? 'Entrar na sua conta' : 'Criar sua conta'}
        </Text>
        <Text className="mt-2 text-sm leading-6 text-texto-2">
          {modo === 'entrar'
            ? 'Entre para continuar de onde você parou.'
            : 'Leva menos de um minuto. É só email e senha.'}
        </Text>

        <View className="mt-8">
          <Text className="mb-2 text-xs uppercase tracking-widest text-texto-3">
            Email
          </Text>
          <TextInput
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (erroLocal) setErroLocal(null);
            }}
            placeholder="voce@email.com"
            placeholderTextColor="#71717A"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            editable={!ocupado}
            className="h-14 rounded-xl border border-borda bg-superficie px-4 text-base text-texto"
          />
        </View>

        <View className="mt-5">
          <Text className="mb-2 text-xs uppercase tracking-widest text-texto-3">
            Senha
          </Text>
          <TextInput
            value={senha}
            onChangeText={(t) => {
              setSenha(t);
              if (erroLocal) setErroLocal(null);
            }}
            placeholder="mínimo 6 caracteres"
            placeholderTextColor="#71717A"
            secureTextEntry
            textContentType={modo === 'entrar' ? 'password' : 'newPassword'}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!ocupado}
            onSubmitEditing={enviar}
            returnKeyType="go"
            className="h-14 rounded-xl border border-borda bg-superficie px-4 text-base text-texto"
          />
        </View>

        {erroExibido ? (
          <View className="mt-5 flex-row rounded-xl border border-erro/40 bg-erro/10 p-4">
            <AlertTriangle size={18} color="#DC2626" className="mt-0.5" />
            <Text className="ml-3 flex-1 text-sm leading-5 text-texto">{erroExibido}</Text>
          </View>
        ) : null}

        <View className="mt-8">
          <Botao
            titulo={modo === 'entrar' ? 'Entrar' : 'Criar conta'}
            onPress={enviar}
            carregando={enviando}
            disabled={ocupado || Boolean(configFalta)}
          />
        </View>

        <View className="my-7 flex-row items-center">
          <View className="h-px flex-1 bg-borda" />
          <Text className="mx-3 text-xs uppercase tracking-widest text-texto-3">ou</Text>
          <View className="h-px flex-1 bg-borda" />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Entrar com Google"
          onPress={comGoogle}
          disabled={ocupado || Boolean(configFalta)}
          className="h-14 w-full flex-row items-center justify-center gap-3 rounded-xl border border-borda bg-superficie active:opacity-80"
        >
          <View className="h-6 w-6 items-center justify-center rounded-full bg-texto">
            <Text className="text-sm font-bold text-fundo">G</Text>
          </View>
          <Text className="text-base font-medium text-texto">
            {googleCarregando ? 'Abrindo o Google…' : 'Entrar com Google'}
          </Text>
        </Pressable>

        <View className="mt-auto pt-8">
          {MODO_SEM_BACKEND ? (
            <>
              <Pressable
                onPress={() => router.replace('/questionario')}
                disabled={ocupado}
                className="mb-6 items-center rounded-xl border border-borda py-4 active:opacity-80"
              >
                <Text className="text-sm font-semibold text-texto-2">
                  Continuar sem conta
                </Text>
              </Pressable>

              <Text className="text-center text-xs leading-5 text-texto-3">
                Modo de desenvolvimento: sem Supabase, o app funciona só com
                estado local e nada é salvo na nuvem.
              </Text>
            </>
          ) : null}

          <Text className="mt-4 text-center text-sm text-texto-2">
            {modo === 'entrar' ? 'Ainda não tem conta?' : 'Já tem conta?'}
          </Text>
          <Pressable
            onPress={() => trocarModo(modo === 'entrar' ? 'cadastrar' : 'entrar')}
            className="mt-2 py-2"
          >
            <Text className="text-center text-sm font-semibold text-verde">
              {modo === 'entrar' ? 'Criar conta' : 'Entrar na conta existente'}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}