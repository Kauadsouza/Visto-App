import { useEffect, useRef, useState } from 'react';
import { AppState, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, CreditCard, ExternalLink } from 'lucide-react-native';

import { Botao } from '@/components/Botao';
import { Aviso, Card, Rotulo } from '@/components/ui';
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

type Retorno = 'nenhum' | 'voltou';

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
      setRetorno('voltou');
    } catch {
      setRetorno('nenhum');
      setProcessando(false);
    }
  }

  return (
    <View className="flex-1 bg-fundo">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: insets.top + 28,
          paddingBottom: insets.bottom + 32,
        }}
      >
        <Rotulo>acesso completo</Rotulo>

        <Text className="mt-3 text-3xl font-bold" style={{ color: cores.texto }}>
          Libere o plano inteiro
        </Text>
        <Text className="mt-3 text-base leading-7" style={{ color: cores.texto2 }}>
          Você já viu como o diagnóstico funciona. Com o acesso completo, o app
          mostra o passo a passo no seu perfil — com prazos, custos e o que
          fazer primeiro.
        </Text>

        <Card nivel={2} borda={cores.bordaVerde} className="mt-8 p-6">
          <Rotulo>mensal</Rotulo>
          <View className="mt-2 flex-row items-end justify-between">
            <Text
              style={{
                color: cores.texto,
                fontSize: 38,
                lineHeight: 46,
                fontWeight: '700',
              }}
            >
              {PRECO_MENSAL}
            </Text>
            <Text className="mb-2 text-caption" style={{ color: cores.texto3 }}>
              por mês
            </Text>
          </View>
        </Card>

        <View className="mt-8">
          {BENEFICIOS.map((b) => (
            <View key={b} className="mb-4 flex-row">
              <View
                className="mt-0.5 h-5 w-5 items-center justify-center rounded-full"
                style={{ backgroundColor: `${cores.verde}1F` }}
              >
                <Check size={12} color={cores.verde} />
              </View>
              <Text
                className="ml-3 flex-1 text-sm leading-6"
                style={{ color: cores.texto2 }}
              >
                {b}
              </Text>
            </View>
          ))}
        </View>

        {/* Estado depois de voltar do Stripe. */}
        {retorno === 'voltou' ? (
          <Card nivel={2} borda={`${cores.atencao}47`} className="mt-8 p-5">
            <Text className="text-base font-semibold" style={{ color: cores.texto }}>
              Você voltou do Stripe
            </Text>
            <Text className="mt-2 text-sm leading-6" style={{ color: cores.texto2 }}>
              O app ainda não consegue confirmar o pagamento sozinho. A
              verificação automática precisa de um servidor (Edge Function), que é
              a fase 2. Se você já pagou, seu acesso é liberado assim que existir.
            </Text>

            <Pressable
              onPress={() => router.replace('/plano')}
              className="mt-4 py-2"
            >
              <Text className="text-sm font-semibold" style={{ color: cores.verde }}>
                Voltar para o meu plano
              </Text>
            </Pressable>
          </Card>
        ) : null}

        {assinado ? (
          <Card nivel={2} borda={cores.bordaVerde} className="mt-8 p-5">
            <Text className="text-base font-semibold" style={{ color: cores.texto }}>
              Sua assinatura está ativa
            </Text>
            <Text className="mt-1 text-sm" style={{ color: cores.texto2 }}>
              {assinatura.currentPeriodEnd
                ? `Renova em ${new Date(assinatura.currentPeriodEnd).toLocaleDateString('pt-BR')}.`
                : 'Sem data de renovação definida.'}
            </Text>
            <Botao
              titulo="Cancelar assinatura"
              variante="perigo"
              tamanho="md"
              onPress={cancelarAssinatura}
              className="mt-4"
            />
          </Card>
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

        <View className="mt-5">
          {linkConfigurado ? (
            <Aviso
              texto="O pagamento acontece na página segura do Stripe, fora do app. Você volta aqui em seguida."
              Icone={ExternalLink}
            />
          ) : (
            <Aviso
              tom="atencao"
              texto="Sem Payment Link configurado, nada é cobrado: o botão ativa o acesso só neste aparelho, para você testar o app."
              Icone={CreditCard}
            />
          )}
        </View>

        <Text className="mt-8 text-caption leading-5" style={{ color: cores.texto4 }}>
          Ao assinar você concorda com os termos de uso e a política de
          privacidade do Visto. Cancelamento a qualquer momento.
        </Text>
      </ScrollView>
    </View>
  );
}