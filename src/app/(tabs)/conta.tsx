import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Botao } from '@/components/Botao';
import { Tela } from '@/components/Tela';
import {
  Aviso,
  Barra,
  Card,
  LinhaNavegacao,
  Numero,
  Rotulo,
  Selo,
  Etiqueta,
} from '@/components/ui';
import { corViabilidade, cores, rotuloViabilidade } from '@/theme';
import { CAMADAS, destinoDe, inicial, primeiroNome, rotaRecomendada } from '@/lib/perfil';
import { calcularContador, emAnos } from '@/lib/permissoes';
import { contarConcluidos, itensDaRota } from '@/lib/planos';
import { useAuth } from '@/store/auth';
import { usePlano } from '@/store/plano';
import { useQuestionario } from '@/store/questionario';
import { ArrowRight, CalendarDays, Compass, MessagesSquare } from 'lucide-react-native';

/**
 * A conta do cliente.
 *
 * É a tela que faz o app "abraçar": a pessoa chegou aqui depois do
 * questionário e já encontra o SEU nome, o SEU destino, o SEU contador e o
 * que já está liberado. Não é um perfil genérico com configurações.
 *
 * Quando o questionário ainda não foi respondido, ela vira convite em vez de
 * tela vazia — mesma regra da home.
 */
export default function Conta() {
  const router = useRouter();
  const { conta } = useAuth();
  const { respostas } = useQuestionario();
  const { concluidos, viagens, assinatura } = usePlano();

  const rota = useMemo(() => rotaRecomendada(respostas), [respostas]);
  const destino = destinoDe(rota);
  const contador = useMemo(() => calcularContador(viagens), [viagens]);

  const nome = primeiroNome(conta?.nome);

  if (!rota || !destino) {
    return (
      <Tela>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingTop: 40, justifyContent: 'center' }}
        >
          <Rotulo cor={cores.marinho}>sua conta</Rotulo>
          <Text
            className="mt-4 font-serif text-4xl font-bold"
            style={{ color: cores.texto }}
          >
            Aqui é a sua{'\n'}página.
          </Text>
          <Text className="mt-4 text-lg leading-8" style={{ color: cores.texto2 }}>
            Responda o questionário e esta tela vira o seu plano: o destino que
            faz sentido para você, o que já foi feito e o que ainda falta.
          </Text>

          <Botao
            titulo="Fazer o questionário"
            iconeFim={ArrowRight}
            onPress={() => router.push('/questionario')}
            className="mt-8"
          />
          <Botao
            titulo="Tenho conta, só entrar"
            variante="secundario"
            onPress={() => router.push('/auth')}
            className="mt-3"
          />
        </ScrollView>
      </Tela>
    );
  }

  const itens = itensDaRota(rota.slug);
  const feitos = contarConcluidos(itens, concluidos);
  const percentual = itens.length ? (feitos / itens.length) * 100 : 0;
  const cor = corViabilidade[rota.viabilidade];
  const temAcesso = assinatura.status === 'ativa';

  return (
    <Tela>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 32, paddingBottom: 40 }}
      >
        {/* Saudação com o nome real, não "olá usuário" */}
        <View className="flex-row items-center gap-3">
          <View
            className="h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: `${cores.marinho}14`, borderWidth: 1, borderColor: cores.bordaMarca }}
          >
            <Text className="font-serif text-xl font-bold" style={{ color: cores.marinho }}>
              {inicial(conta?.nome)}
            </Text>
          </View>
          <View className="flex-1">
            <Rotulo>sua conta</Rotulo>
            <Text className="mt-1 font-serif text-2xl font-bold" style={{ color: cores.texto }}>
              {nome || 'Bem-vindo'}
            </Text>
          </View>
        </View>

        <Text className="mt-8 text-2xl leading-8" style={{ color: cores.texto }}>
          {destino.abertura}
        </Text>

        {/* O destino dela — o número emocional da tela */}
        <Card nivel={1} elevado className="mt-6 p-6">
          <View className="flex-row items-start justify-between">
            <Rotulo>seu destino</Rotulo>
            <Etiqueta texto={rotuloViabilidade[rota.viabilidade]} cor={cor} />
          </View>

          <Text
            className="mt-3 font-serif text-3xl font-bold"
            style={{ color: cores.texto }}
          >
            {destino.nome}
          </Text>
          <Text className="mt-2 text-base leading-7" style={{ color: cores.texto2 }}>
            {rota.nome}
          </Text>

          <View className="mt-6 flex-row gap-6">
            <Numero
              valor={`${rota.tempoMeses[0]}–${rota.tempoMeses[1]}`}
              rotulo="meses até começar"
              tamanho={20}
            />
            <Numero
              valor={`R$ ${(rota.custoMin / 1000).toFixed(0)}–${(rota.custoMax / 1000).toFixed(0)}k`}
              rotulo="custo estimado"
              tamanho={20}
            />
          </View>

          <View className="mt-6">
            <View className="flex-row items-baseline justify-between">
              <Text className="text-caption font-semibold" style={{ color: cores.texto2 }}>
                {`${feitos} de ${itens.length} passos`}
              </Text>
              <Text className="text-caption" style={{ color: cores.texto3 }}>
                {`${Math.round(percentual)}%`}
              </Text>
            </View>
            <View className="mt-2">
              <Barra valor={percentual} altura={6} />
            </View>
          </View>

          <Botao
            titulo={temAcesso ? 'Continuar meu plano' : 'Ver meus passos'}
            iconeFim={ArrowRight}
            onPress={() => router.push({ pathname: '/plano', params: { rota: rota.slug } })}
            className="mt-6"
          />
        </Card>

        {/* Contadores — o que muda com o tempo e importa na decisão */}
        <Rotulo className="mt-8">seus números</Rotulo>

        <Card nivel={1} className="mt-3 p-5">
          <View className="flex-row">
            <Numero valor={String(contador.diasNoPais)} rotulo="dias desde sua entrada" />
            <Numero
              valor={String(contador.diasRestantesSchengen)}
              rotulo="dias no bloco 90/180"
              cor={contador.noLimiteSchengen ? cores.erro : cores.texto}
            />
            <Numero
              valor={emAnos(contador.diasParaResidencia)}
              rotulo="de 5 anos de residência"
            />
          </View>
          {contador.noLimiteSchengen ? (
            <View className="mt-4">
              <Aviso
                tom="erro"
                texto="Você atingiu o limite do bloco Schengen. Uma viagem nova agora exige esperar a janela de 180 dias ou outra base de cálculo."
              />
            </View>
          ) : null}
        </Card>

        {/* Assistente — a camada gratuita, sempre disponível */}
        <Rotulo className="mt-8">sempre disponível</Rotulo>
        <View className="mt-3">
          <LinhaNavegacao
            titulo="Assistente de IA"
            descricao="Tire dúvidas sobre vistos, custos e documentos. Grátis, sem limite."
            Icone={MessagesSquare}
            aoTocar={() => router.push('/chat')}
          />
        </View>

        {/* As camadas pagas — mostradas sem pressão */}
        <View className="mt-8 flex-row items-center justify-between">
          <Rotulo>seu nível de acompanhamento</Rotulo>
          {temAcesso ? <Selo texto="completo" /> : null}
        </View>

        {CAMADAS.map((camada, i) => {
          const ativa =
            (camada.chave === 'ia' && assinatura.status === 'ativa') ||
            (camada.chave === 'humano' && assinatura.status === 'ativa');
          const ultima = i === CAMADAS.length - 1;

          return (
            <Card
              key={camada.chave}
              nivel={1}
              borda={ultima ? `${cores.dourado}47` : undefined}
              className="mt-3 p-5"
            >
              <View className="flex-row items-center justify-between">
                <Text className="font-serif text-lg font-bold" style={{ color: cores.texto }}>
                  {camada.titulo}
                </Text>
                {ativa ? (
                  <Etiqueta
                    texto="ativo"
                    cor={cores.sucesso}
                    fundo={`${cores.sucesso}14`}
                  />
                ) : (
                  <Text className="text-caption font-semibold" style={{ color: ultima ? cores.dourado : cores.texto3 }}>
                    {camada.preco}
                  </Text>
                )}
              </View>

              <Text className="mt-2 text-sm leading-6" style={{ color: cores.texto2 }}>
                {camada.descricao}
              </Text>

              <View className="mt-4">
                {camada.destrava.slice(0, ativa ? camada.destrava.length : 3).map((d) => (
                  <View key={d} className="flex-row items-start" >
                    <Text className="mr-2 mt-0.5 text-caption" style={{ color: cores.marinho }}>
                      ✓
                    </Text>
                    <Text className="flex-1 text-caption leading-5" style={{ color: cores.texto2 }}>
                      {d}
                    </Text>
                  </View>
                ))}
              </View>

              {!ativa ? (
                <Botao
                  titulo={ultima ? 'Ver planos humanos' : 'Ver opções'}
                  variante="secundario"
                  tamanho="md"
                  onPress={() =>
                    router.push(ultima ? '/consultoria' : '/consultoria-ia')
                  }
                  className="mt-4"
                />
              ) : null}
            </Card>
          );
        })}

        <View className="mt-8 gap-3">
          <LinhaNavegacao
            titulo="Ver as três rotas"
            descricao="O diagnóstico completo, e por que elas ficaram assim"
            Icone={Compass}
            aoTocar={() => router.push('/resultado')}
          />
          <LinhaNavegacao
            titulo="Meus contador"
            descricao="Registrar entradas e saídas de cada país"
            Icone={CalendarDays}
            aoTocar={() => router.push({ pathname: '/plano', params: { rota: rota.slug } })}
          />
        </View>

        <Text className="mt-8 text-caption leading-5" style={{ color: cores.texto4 }}>
          O Visto não é assessoria jurídica. As informações aqui são estimativas
          educacionais — confirme cada valor na fonte oficial antes de decidir.
        </Text>
      </ScrollView>
    </Tela>
  );
}