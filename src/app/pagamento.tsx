import { useEffect, useRef, useState } from 'react';
import { AppState, Linking, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, CreditCard, ExternalLink, Info } from 'lucide-react-native';

import { Botao } from '@/components/Botao';
import { Cabecalho } from '@/components/Cabecalho';
import { PRECO_MENSAL } from '@/lib/config';
import { temAcesso, usePlano } from '@/store/plano';
import { cores } from '@/theme';

const LINK_STRIPE = process.env.EXPO_PUBLIC_STRIPE_PAYMENT_LINK;

const BENEFICIOS = [
  'Checklist completo com prazos e custos de cada etapa',
  'Contador de dias com histórico de entradas e saídas',
  'Atualizações de regras e custos quando algo muda',
  'Cancelamento a qualquer momento, direto no app',
];

type Retorno = 'nenhum' | 'voltou' | 'abriu';

export default function Pagamento() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { assinatura, ativarAssinaturaDemo, cancelarAssinatura } = usePlano();

  const [processando, setProcessando] = useState(false);
  const [retorno, setRetorno] = useState<Retorno>('nenhum');

  const assinado = temAcesso(assinatura);
  const linkConfigurado = Boolean(LINK_STRIPE && LINK_STRIPE.startsWith('https://'));

  // Observa a ida e a volta do navegador.
  const indoParaOFora = useRef(false);
  useEffect(() => {
    const onChange = AppState.addEventListener('change', (estado) => {
      if (estado === 'active' && indoParaOFora.current) {
        indoParaOFora.current = false;
        setRetorno('voltou');
      }
      if (estado === 'inactive') indoParaOFora.current = true;
    });
    return () => onChange.remove();
  }, []);

  /**
   * Abre o Payment Link do Stripe no navegador.
   *
   * Sem backend, o app NÃO consegue confirmar que o pagamento foi aprovado:
   * quem saberia disso é o Stripe ou uma Edge Function que consultasse a
   * assinatura. Por isso a tela abaixo diz isso na cara, em vez de fingir que
   * liberou.
   */
  async function assinar() {
    if (!linkConfigurado) {
      setProcessando(true);
      await new Promise((r) => setTimeout(r, 800));
      ativarAssinaturaDemo();
      setProcessando(false);
      router.replace('/plano');
      return;
    }

    try {
      await Linking.openURL(LINK_STRIPE!);
      indoParaOFora.current = true;
      setRetorno('abriu');
    } catch {
      setRetorno('nenhum');
      setProcessando(false);
    }
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

        {/* Estado depois de voltar do Stripe. */}
        {retorno === 'voltou' ? (
          <View className="mt-8 rounded-2xl border border-atencao/40 bg-atencao/10 p-5">
            <View className="flex-row items-center">
              <Info size={17} color={cores.atencao} />
              <Text className="ml-2 flex-1 text-sm font-semibold text-texto">
                Você voltou do Stripe
              </Text>
            </View>

            <Text className="mt-2 text-sm leading-6 text-texto-2">
              O app ainda não consegue confirmar o pagamento sozinho. A
              verificação automática precisa de um servidor (Edge Function), que
              é a fase 2. Se você já pagou, seu acesso é liberado assim que
              existir.
            </Text>

            <Pressable
              onPress={() => router.replace('/plano')}
              className="mt-4 py-2"
            >
              <Text className="text-sm font-semibold text-verde">
                Voltar para o meu plano
              </Text>
            </Pressable>
          </View>
        ) : null}

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
            titulo={
              linkConfigurado
                ? `Assinar por ${PRECO_MENSAL}`
                : `Assinar por ${PRECO_MENSAL} (modo demo)`
            }
            onPress={assinar}
            carregando={processando}
            disabled={retorno === 'voltou'}
            className="mt-8"
          />
        )}

        {linkConfigurado ? (
          <View className="mt-5 flex-row rounded-xl border border-borda bg-superficie p-4">
            <ExternalLink size={16} color={cores.texto3} className="mt-0.5" />
            <Text className="ml-3 flex-1 text-xs leading-5 text-texto-2">
              O pagamento acontece na página segura do Stripe, fora do app. Você
              volta aqui em seguida.
            </Text>
          </View>
        ) : (
          <View className="mt-5 flex-row rounded-xl border border-atencao/40 bg-atencao/10 p-4">
            <CreditCard size={16} color={cores.atencao} className="mt-0.5" />
            <Text className="ml-3 flex-1 text-xs leading-5 text-texto-2">
              Sem Payment Link configurado, nada é cobrado: o botão ativa o
              acesso só neste aparelho, para você testar o app.
            </Text>
          </View>
        )}

        <Text className="mt-6 pb-8 text-xs leading-5 text-texto-3">
          Ao assinar você concorda com os termos de uso e a política de
          privacidade do Visto. Cancelamento a qualquer momento.
        </Text>
      </View>
    </View>
  );
}