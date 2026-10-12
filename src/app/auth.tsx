import { useState } from 'react';
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
import { AlertTriangle, ArrowRight, Check, KeyRound, User } from 'lucide-react-native';

import { Botao } from '@/components/Botao';
import { Aviso, IconeQuadrado, Rotulo } from '@/components/ui';
import { Tela } from '@/components/Tela';
import { useAuth } from '@/store/auth';
import { cores } from '@/theme';

type Modo = 'cadastrar' | 'entrar';

export default function Auth() {
  const router = useRouter();
  const { conta, cadastrar, entrar, sair, erro, limparErro, carregando } = useAuth();

  const [modo, setModo] = useState<Modo>('entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [pinRepetido, setPinRepetido] = useState('');

  const ocupado = carregando;
  const erroExibido = erro;

  function trocarModo(novo: Modo) {
    setModo(novo);
    setPin('');
    setPinRepetido('');
    limparErro();
  }

  async function enviar() {
    if (modo === 'cadastrar') {
      if (pin !== pinRepetido) {
        limparErro();
        // erro do store é resetado pelo limparErro; usamos um estado local
        // pequeno via setTimeout? Não: o store guarda a última string.
        // Solução mais simples: criar uma key separada para o erro de
        // PIN local, mas para evitar mais um campo, lançamos a partir do
        // setter via setTimeout.
        setTimeout(() => useAuth.setState({ erro: 'Os dois PINs não batem.' }), 0);
        return;
      }
      try {
        await cadastrar(nome, email || undefined, pin);
        router.replace('/');
      } catch {
        /* erro já está no store */
      }
    } else {
      await entrar(pin);
      if (!useAuth.getState().erro) {
        router.replace('/');
      }
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <Tela>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 36 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center">
            <IconeQuadrado Icone={KeyRound} cor={cores.verde} tamanho={64} />
          </View>

          <Rotulo className="mt-6 text-center">{modo === 'entrar' ? 'entrar' : 'criar conta'}</Rotulo>
          <Text className="mt-2 text-center text-2xl font-bold" style={{ color: cores.texto }}>
            {modo === 'entrar' ? 'Digite o seu PIN' : 'Crie o seu PIN'}
          </Text>
          <Text className="mt-2 text-center text-sm leading-6" style={{ color: cores.texto2 }}>
            {modo === 'entrar'
              ? 'É um número de 4 a 8 dígitos que você escolheu no cadastro.'
              : 'Escolha 4 a 8 números. A gente não usa email nem servidor — é tudo no seu aparelho.'}
          </Text>

          {modo === 'cadastrar' ? (
            <View className="mt-8">
              <Campo
                icone={User}
                rotulo="nome"
                valor={nome}
                aoMudar={setNome}
                placeholder="Como você quer ser chamado"
                capitalizar="words"
                autoCorrect={false}
              />
              <Campo
                icone={User}
                rotulo="email (opcional)"
                valor={email}
                aoMudar={setEmail}
                placeholder="seu@email.com"
                tipo="emailAddress"
                capitalizar="none"
                autoCorrect={false}
              />
            </View>
          ) : null}

          <View className="mt-4">
            <Campo
              icone={KeyRound}
              rotulo={modo === 'entrar' ? 'pin' : 'novo pin'}
              valor={pin}
              aoMudar={(t) => {
                setPin(t.replace(/\D/g, '').slice(0, 8));
                if (erro) limparErro();
              }}
              placeholder="4 a 8 números"
              seguro
              keyboard="number-pad"
              maxLength={8}
            />
            {modo === 'cadastrar' ? (
              <Campo
                icone={KeyRound}
                rotulo="repita o pin"
                valor={pinRepetido}
                aoMudar={(t) => {
                  setPinRepetido(t.replace(/\D/g, '').slice(0, 8));
                  if (erro) limparErro();
                }}
                placeholder="o mesmo de novo"
                seguro
                keyboard="number-pad"
                maxLength={8}
              />
            ) : null}
          </View>

          {erroExibido ? (
            <View className="mt-4">
              <Aviso texto={erroExibido} tom="erro" Icone={AlertTriangle} />
            </View>
          ) : null}

          <Botao
            titulo={modo === 'entrar' ? 'Entrar' : 'Criar conta'}
            onPress={enviar}
            carregando={ocupado}
            disabled={pin.length < 4 || (modo === 'cadastrar' && nome.trim().length < 2)}
            className="mt-8"
          />

          {conta && modo === 'entrar' ? (
            <Pressable
              onPress={() => {
                sair();
              }}
              className="mt-3 items-center py-3"
            >
              <Text className="text-caption" style={{ color: cores.texto3 }}>
                Sair e trocar de conta
              </Text>
            </Pressable>
          ) : null}

          <View className="mt-8 flex-row items-center">
            <View className="h-px flex-1" style={{ backgroundColor: cores.borda }} />
            <Text className="mx-4 text-caption uppercase" style={{ color: cores.texto4 }}>
              ou
            </Text>
            <View className="h-px flex-1" style={{ backgroundColor: cores.borda }} />
          </View>

          <Pressable
            onPress={() => trocarModo(modo === 'entrar' ? 'cadastrar' : 'entrar')}
            className="mt-4 items-center py-2"
          >
            <Text className="text-sm font-semibold" style={{ color: cores.verde }}>
              {modo === 'entrar' ? 'Criar conta nova' : 'Já tenho PIN — entrar'}
              <ArrowRight size={14} color={cores.verde} className="ml-1" />
            </Text>
          </Pressable>

          <View className="mt-6 flex-row items-center rounded-xl border p-3" style={{ backgroundColor: cores.superficie, borderColor: cores.borda }}>
            <Check size={15} color={cores.verde} />
            <Text className="ml-3 flex-1 text-caption leading-4" style={{ color: cores.texto3 }}>
              {conta
                ? `Conectado como ${conta.nome}. Tudo fica no seu aparelho.`
                : 'Sem servidor. Sem cadastro em site. Sem email para confirmar. O PIN é a única porta.'}
            </Text>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </Tela>
    </KeyboardAvoidingView>
  );
}

function Campo({
  icone: Icone,
  rotulo,
  valor,
  aoMudar,
  placeholder,
  seguro,
  tipo,
  capitalizar,
  autoCorrect,
  keyboard,
  maxLength,
}: {
  icone: typeof User;
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  placeholder: string;
  seguro?: boolean;
  tipo?: 'emailAddress';
  capitalizar?: 'none' | 'words' | 'sentences';
  autoCorrect?: boolean;
  keyboard?: 'default' | 'email-address' | 'number-pad';
  maxLength?: number;
}) {
  const [focado, setFocado] = useState(false);
  const borda = focado ? cores.bordaVerde : cores.borda;

  return (
    <View className="mb-3">
      <Rotulo>{rotulo}</Rotulo>
      <View
        className="mt-2 flex-row items-center rounded-xl border bg-superficie px-3"
        style={{ borderColor: borda, height: 56 }}
      >
        <Icone size={16} color={cores.texto3} />
        <TextInput
          value={valor}
          onChangeText={aoMudar}
          onFocus={() => setFocado(true)}
          onBlur={() => setFocado(false)}
          placeholder={placeholder}
          placeholderTextColor={cores.texto4}
          secureTextEntry={seguro}
          keyboardType={keyboard}
          textContentType={tipo}
          autoCapitalize={capitalizar}
          autoCorrect={autoCorrect}
          maxLength={maxLength}
          className="flex-1 px-3 text-base"
          style={{ color: cores.texto }}
        />
      </View>
    </View>
  );
}