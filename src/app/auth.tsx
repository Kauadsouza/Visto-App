import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { TriangleAlert } from 'lucide-react-native';

import { Botao } from '@/components/Botao';
import { Tela } from '@/components/Tela';
import { Aviso, Rotulo } from '@/components/ui';
import { MODO_SEM_BACKEND } from '@/lib/config';
import { mensagemDe } from '@/lib/erros';
import { erroConfigSupabase } from '@/lib/supabase';
import { useAuth } from '@/store/auth';
import { cores } from '@/theme';

type Modo = 'entrar' | 'cadastrar';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Input com rótulo flutuando acima, no mesmo peso do resto do sistema. */
function Campo({
  rotulo,
  valor,
  aoMudar,
  placeholder,
  seguro,
  teclado,
  capitalizar,
  tipo,
  aoEnviar,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  placeholder: string;
  seguro?: boolean;
  teclado?: 'default' | 'email-address';
  capitalizar?: 'none' | 'sentences';
  tipo?: 'emailAddress' | 'password' | 'newPassword';
  aoEnviar?: () => void;
}) {
  const [focado, setFocado] = useState(false);
  const borda = focado ? cores.bordaVerde : cores.borda;

  return (
    <View className="mt-5">
      <Rotulo>{rotulo}</Rotulo>
      <TextInput
        value={valor}
        onChangeText={aoMudar}
        onFocus={() => setFocado(true)}
        onBlur={() => setFocado(false)}
        placeholder={placeholder}
        placeholderTextColor={cores.texto4}
        secureTextEntry={seguro}
        keyboardType={teclado ?? 'default'}
        autoCapitalize={capitalizar ?? 'sentences'}
        autoCorrect={false}
        textContentType={tipo}
        returnKeyType="go"
        onSubmitEditing={aoEnviar}
        className="mt-2 h-14 rounded-xl border bg-superficie px-4 text-base"
        style={{ borderColor: borda, color: cores.texto }}
      />
    </View>
  );
}

export default function Auth() {
  const router = useRouter();
  const { session, erro, entrar, cadastrar, entrarComGoogle, limparErro } = useAuth();

  const [modo, setModo] = useState<Modo>('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [googleCarregando, setGoogleCarregando] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  const configFalta = erroConfigSupabase();
  const erroExibido = erroLocal ?? erro ?? configFalta;
  const ocupado = enviando || googleCarregando;

  useEffect(() => {
    if (session) router.replace('/');
  }, [session, router]);

  function trocarModo(novo: Modo) {
    setModo(novo);
    setErroLocal(null);
    limparErro();
  }

  /** Email válido mas sem cadastro é o caso mais comum: oferece criar conta. */
  const podeSugerirCadastro = Boolean(
    erro && /não tem conta|não possui conta|not found/i.test(erro)
  );

  async function enviar() {
    const emailLimpo = email.trim().toLowerCase();

    if (!emailLimpo) return setErroLocal('Digite seu email.');
    if (!EMAIL_RE.test(emailLimpo)) return setErroLocal('Esse email não parece válido.');
    if (senha.length < 6)
      return setErroLocal('A senha precisa ter pelo menos 6 caracteres.');

    setErroLocal(null);
    setEnviando(true);

    try {
      if (modo === 'entrar') await entrar(emailLimpo, senha);
      else await cadastrar(emailLimpo, senha);
      router.replace('/');
    } catch (e) {
      setErroLocal(mensagemDe(e));
    } finally {
      setEnviando(false);
    }
  }

  async function comGoogle() {
    setErroLocal(null);
    setGoogleCarregando(true);
    try {
      await entrarComGoogle();
      router.replace('/');
    } catch (e) {
      setErroLocal(mensagemDe(e));
    } finally {
      setGoogleCarregando(false);
    }
  }

  return (
    <Tela>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView
        className="flex-1"
        // flexGrow deixa o conteúdo ocupar a altura toda; sem isso o rodapé
        // fica colado no formulário e sobra um vazio enorme embaixo.
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 28 }}
        keyboardShouldPersistTaps="handled"
      >
        <Rotulo cor={cores.verde}>{modo === 'entrar' ? 'voltar ao plano' : 'começar'}</Rotulo>

        <Text className="mt-3 text-3xl font-bold" style={{ color: cores.texto }}>
          {modo === 'entrar' ? 'Entre na sua conta' : 'Crie sua conta'}
        </Text>
        <Text className="mt-3 text-base leading-7" style={{ color: cores.texto2 }}>
          {modo === 'entrar'
            ? 'Continue de onde você parou.'
            : 'Leva menos de um minuto. Só email e senha.'}
        </Text>

        <Campo
          rotulo="email"
          valor={email}
          aoMudar={(v) => {
            setEmail(v);
            if (erroLocal) setErroLocal(null);
          }}
          placeholder="voce@email.com"
          teclado="email-address"
          capitalizar="none"
          tipo="emailAddress"
          aoEnviar={enviar}
        />

        <Campo
          rotulo="senha"
          valor={senha}
          aoMudar={(v) => {
            setSenha(v);
            if (erroLocal) setErroLocal(null);
          }}
          placeholder="mínimo 6 caracteres"
          seguro
          capitalizar="none"
          tipo={modo === 'entrar' ? 'password' : 'newPassword'}
          aoEnviar={enviar}
        />

        {erroExibido ? (
          <View className="mt-6">
            <Aviso texto={erroExibido} tom="erro" Icone={TriangleAlert} />
          </View>
        ) : null}

        <Botao
          titulo={modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          onPress={enviar}
          carregando={enviando}
          disabled={ocupado || Boolean(configFalta)}
          className="mt-8"
        />

        {/* Só aparece quando o email é válido e não tem conta — é a ação útil. */}
        {podeSugerirCadastro && modo === 'entrar' ? (
          <Pressable onPress={() => trocarModo('cadastrar')} className="mt-4 items-center py-2">
            <Text className="text-sm font-semibold" style={{ color: cores.verde }}>
              Criar conta com esse email
            </Text>
          </Pressable>
        ) : null}

        <View className="mb-8 mt-7 flex-row items-center">
          <View className="h-px flex-1" style={{ backgroundColor: cores.borda }} />
          <Text className="mx-4 text-caption uppercase" style={{ color: cores.texto4 }}>
            ou
          </Text>
          <View className="h-px flex-1" style={{ backgroundColor: cores.borda }} />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Entrar com Google"
          onPress={comGoogle}
          disabled={ocupado || Boolean(configFalta)}
          className="h-14 w-full flex-row items-center justify-center gap-3 rounded-xl border active:opacity-80"
          style={{ backgroundColor: cores.superficie, borderColor: cores.borda }}
        >
          <View
            className="h-6 w-6 items-center justify-center rounded-full"
            style={{ backgroundColor: cores.texto }}
          >
            <Text className="text-sm font-bold" style={{ color: cores.fundo }}>
              G
            </Text>
          </View>
          <Text className="text-base font-medium" style={{ color: cores.texto }}>
            {googleCarregando ? 'Abrindo o Google…' : 'Entrar com Google'}
          </Text>
        </Pressable>

        {/* Empurra o rodapé para o fim da tela. */}
        <View className="flex-1 min-h-8" />

        {MODO_SEM_BACKEND ? (
          <View>
            <Pressable
              onPress={() => router.replace('/')}
              disabled={ocupado}
              className="items-center rounded-xl border py-4 active:opacity-80"
              style={{ backgroundColor: cores.fundo2, borderColor: cores.borda }}
            >
              <Text className="text-sm font-semibold" style={{ color: cores.texto2 }}>
                Continuar sem conta
              </Text>
            </Pressable>

            <Text
              className="mt-4 text-center text-caption leading-5"
              style={{ color: cores.texto4 }}
            >
              Modo de desenvolvimento: sem Supabase o app funciona só com estado
              local e nada é salvo na nuvem.
            </Text>
          </View>
        ) : null}

        <View className="mt-10 flex-row items-center justify-center">
          <Text className="text-sm" style={{ color: cores.texto3 }}>
            {modo === 'entrar' ? 'Ainda não tem conta?' : 'Já tem conta?'}
          </Text>
          <Pressable
            onPress={() => trocarModo(modo === 'entrar' ? 'cadastrar' : 'entrar')}
            style={{ marginLeft: 6 }}
          >
            <Text className="text-sm font-semibold" style={{ color: cores.verde }}>
              {modo === 'entrar' ? 'Criar conta' : 'Entrar'}
            </Text>
          </Pressable>
        </View>
        <View style={{ height: 28 }} />
      </ScrollView>
    </KeyboardAvoidingView>
    </Tela>
  );
}