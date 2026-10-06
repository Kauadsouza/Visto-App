import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, CreditCard } from 'lucide-react-native';

import { Botao } from '@/components/Botao';
import { Cabecalho } from '@/components/Cabecalho';
import { MODO_SEM_BACKEND, PRECO_MENSAL } from '@/lib/config';
import { temAcesso, usePlano } from '@/store/plano';
import { cores } from '@/theme';

const BENEFICIOS = [
  'Checklist completo com prazos e custos de cada etapa',
  'Contador de dias com histórico de entradas e saídas',
  'Atualizações de regras e custos quando algo muda',
  'Cancelamento a qualquer momento, direto no app',
];

export default function Pagamento() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { assinatura, ativarAssinaturaDemo, cancelarAssinatura } = usePlano();

  const [processando, setProcessando] = useState(false);
  const assinado = temAcesso(assinatura);

  // =============================================================
  // SEM BACKEND: ativa localmente, sem cobrar ninguém.
  //
  // Quando o Stripe entrar (Etapa 7), este bloco vira:
  //   1. Linking.openURL(CHECKOUT_URL) abrindo o checkout hospedado
  //   2. polling na tabela `assinaturas` a cada 5s, timeout 60s
  //   3. status = 'ativa' libera o plano
  //
  // O status passa a vir do servidor — nunca é o app que escreve 'ativa'.
  // =============================================================
  async function assinar() {
    setProcessando(true);
    if (MODO_SEM_BACKEND) {
      await new Promise((r) => setTimeout(r, 900));
      ativarAssinaturaDemo();
      setProcessando(false);
      router.replace('/plano');
      return;
    }
    setProcessando(false);
  }

  return (
    <View className="flex-1 bg-fundo">
      <View style={{ paddingTop: insets.top }}>
        <Cabecalho titulo="Acesso completo" />
      </View>

      <View className="flex-1 px-8">
        <Text className="text-2xl font-bold leading-8 text-texto">
          Libere o plano inteiro
        </Text>
        <Text className="mt-2 text-sm leading-6 text-texto-2">
          Você já viu como o diagnóstico funciona. Com o acesso completo, o app
          mostra o passo a passo no seu perfil — com prazos, custos e o que
          fazer primeiro.
        </Text>

        <View className="mt-8 flex-row items-end justify-between rounded-2xl border border-verde/40 bg-verde/5 p-6">
          <View>
            <Text className="text-xs uppercase tracking-widest text-texto-3">
              Mensal
            </Text>
            <Text className="mt-1 text-3xl font-bold text-texto">
              {PRECO_MENSAL}
            </Text>
          </View>
          <Text className="text-xs text-texto-3">cobrança mensal</Text>
        </View>

        <View className="mt-8">
          {BENEFICIOS.map((b) => (
            <View key={b} className="mb-3 flex-row">
              <Check size={18} color={cores.verde} className="mt-0.5" />
              <Text className="ml-3 flex-1 text-sm leading-6 text-texto-2">
                {b}
              </Text>
            </View>
          ))}
        </View>

        {assinado ? (
          <View className="mt-8 rounded-2xl border border-verde/40 bg-verde/5 p-5">
            <Text className="text-base font-semibold text-texto">
              Sua assinatura está ativa
            </Text>
            <Text className="mt-1 text-sm text-texto-2">
              {assinatura.currentPeriodEnd
                ? `Renova em ${new Date(assinatura.currentPeriodEnd).toLocaleDateString('pt-BR')}.`
                : 'Sem data de renovação definida.'}
            </Text>

            <Botao
              titulo="Cancelar assinatura"
              variante="secundario"
              onPress={cancelarAssinatura}
              className="mt-4 h-12"
            />
          </View>
        ) : (
          <Botao
            titulo={`Assinar por ${PRECO_MENSAL}`}
            onPress={assinar}
            carregando={processando}
            className="mt-8"
          />
        )}

        {MODO_SEM_BACKEND ? (
          <View className="mt-5 flex-row rounded-xl border border-atencao/40 bg-atencao/10 p-4">
            <CreditCard size={16} color={cores.atencao} className="mt-0.5" />
            <Text className="ml-3 flex-1 text-xs leading-5 text-texto-2">
              Modo de desenvolvimento: nada é cobrado. O botão ativa a assinatura
              só neste aparelho. O Stripe entra na Etapa 7.
            </Text>
          </View>
        ) : null}

        <Text className="mt-6 pb-8 text-xs leading-5 text-texto-3">
          Ao assinar você concorda com os termos de uso e a política de
          privacidade do Visto. Cancelamento a qualquer momento.
        </Text>
      </View>
    </View>
  );
}