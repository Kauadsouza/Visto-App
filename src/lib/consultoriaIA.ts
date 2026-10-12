/**
 * =============================================================
 * Consultoria por IA — o agente que monta o plano da pessoa
 * =============================================================
 *
 * A diferença entre esta camada e o assistente é o que ela faz ANTES de
 * responder: ela lê o questionário inteiro, a rota recomendada, os viagens
 * registrados e os custos, e devolve um plano montado para aquele perfil —
 * não respostas genéricas.
 *
 * Roda local e síncrono, como todo o resto do motor. Sem API, sem custo por
 * mensagem. O plano gerado é derivado das respostas: se a pessoa refizer o
 * questionário, o plano muda junto.
 * =============================================================
 */

import { TABELA_CUSTOS, type Rota } from '@/lib/diagnostico';
import type { Respostas } from '@/lib/perguntas';
import { calcularContador, emAnos } from '@/lib/permissoes';
import type { RegistroViagem } from '@/lib/database.types';

/** Uma etapa do plano gerado. */
export interface Etapa {
  numero: number;
  titulo: string;
  detalhe: string;
  prazo: string;
  custo: number;
  bloqueado: boolean;
  motivo?: string;
}

export interface PlanoGerado {
  /** Rota que o agente recommendspara esta pessoa. */
  rota: Rota;
  /** Frase de abertura, escrita para esta pessoa — não um template. */
  abertura: string;
  /** Por que esta rota e não as outras. */
  justificativa: string;
  etapas: Etapa[];
  /** Soma do que dá para estimar de verdade. */
  custoEstimado: number;
  /** O que o app NÃO consegue estimar e a pessoa precisa confirmar. */
  lacunas: string[];
  /** Avisos que vem do diagnóstico. */
  alertas: string[];
}

const ROTULO_OBJETIVO: Record<string, string> = {
  estudar: 'estudar',
  trabalhar: 'trabalhar remotamente',
  os_dois: 'estudar e trabalhar',
  morar: 'morar de forma permanente',
};

const ROTULO_INGLES: Record<string, string> = {
  basico: 'básico',
  intermediario: 'intermediário',
  avancado: 'avançado',
  nativo: 'nativo',
};

/** Etapas base por rota, com a chave do custo quando ela existe. */
const ETAPAS: Record<string, { titulo: string; detalhe: string; prazo: string; custo?: string }[]> = {
  'reino-unidos-estudo': [
    {
      titulo: 'Universidade e carta de aceitação condicional',
      detalhe:
        'Escolher o curso e a universidade elegíveis para o Student visa, e obter a carta de aceitação. É o documento que destrava todo o resto.',
      prazo: 'Semanas 1 a 8',
      custo: 'uk_registro',
    },
    {
      titulo: 'Comprovar os £1.400 por ano',
      detalhe:
        'Manter o dinheiro em conta por 28 dias consecutivos, com o extrato bancário como prova. Não pode ter entrada grande nos últimos 28 dias.',
      prazo: 'Dias 28 a 90',
      custo: 'uk_taxa_visto',
    },
    {
      titulo: 'CAS e taxa da universidade',
      detalhe:
        'O Confirmation of Acceptance for Studies é emitido pela universidade e leva seu nome. A taxa é definida por ela, não pelo governo britânico.',
      prazo: 'Semanas 8 a 12',
      custo: 'uk_cas',
    },
    {
      titulo: 'Teste de inglês e tradução juramentada',
      detalhe:
        'IELTS Academic, no nível exigido pelo curso. Em paralelo, a tradução juramentada dos documentos escolares — é ela que mais atrasa.',
      prazo: 'Semanas 4 a 14',
      custo: 'uk_teste_ingles',
    },
    {
      titulo: 'Passaporte, biometria e taxa do visto',
      detalhe:
        'Agendar a biometria no VAC com passaporte válido, comprovante financeiro e comprovante de endereço.',
      prazo: 'Semanas 14 a 20',
      custo: 'uk_biometria',
    },
    {
      titulo: 'Passagem aérea e seguro',
      detalhe:
        'O seguro médico é obrigatório para o Student visa e vale para todo o período do curso. A passagem você compra direto.',
      prazo: 'Semanas 18 a 24',
      custo: 'uk_passagem_seguro',
    },
  ],
  'espanha-estudo': [
    {
      titulo: 'Admissão na universidade espanhola',
      detalhe:
        'Pré-inscrição para pós-graduação ou credencial de admissão para graduação. Sem a credencial, a solicitação não anda.',
      prazo: 'Semanas 1 a 6',
    },
    {
      titulo: 'Tradução juramentada dos documentos',
      detalhe:
        'Diploma, histórico escolar e birth certificate traduzidos por tradutor juramentado e apostilados. É o item que mais atrasa o processo.',
      prazo: 'Semanas 3 a 10',
      custo: 'es_traducao',
    },
    {
      titulo: 'Seguro médico privado e capacidade econômica',
      detalhe:
        'Seguro com cobertura mínima exigida, válido para o período do curso, e comprovante de recursos para a subsistência.',
      prazo: 'Semanas 6 a 12',
      custo: 'es_seguro_estudo',
    },
    {
      titulo: 'Solicitação do visto de estudos',
      detalhe:
        'Formulário e agendamento no consulado. A autorização de retorno costuma ser pedida junto — vale conferir antes de ir.',
      prazo: 'Semanas 12 a 18',
      custo: 'es_taxa_visto',
    },
    {
      titulo: 'Passagem aérea',
      detalhe:
        'Depois da concessão. O valor varia muito por rota e época do ano — é a maior incerteza do orçamento.',
      prazo: 'Semanas 18 a 20',
      custo: 'es_passagem',
    },
  ],
  'espanha-digital-nomad': [
    {
      titulo: 'Provar renda remota',
      detalhe:
        'Extratos e nota fiscal dos últimos 3 meses mostrando renda acima de 2,5x o salário mínimo espanhol. Não serve savings parado.',
      prazo: 'Semanas 1 a 3',
    },
    {
      titulo: 'Comprovar vínculo com o trabalho',
      detalhe:
        'Contrato, CNPJ, extratos ou nota fiscal de cliente. A residência é para quem trabalha com a Espanha, não para quem guarda dinheiro.',
      prazo: 'Semanas 2 a 4',
    },
    {
      titulo: 'Seguro médico com cobertura europeia',
      detalhe:
        'A cobertura europeia costuma sair mais barato que a local. Investigue antes de fechar, é diferença de centenas de euros.',
      prazo: 'Semanas 4 a 6',
      custo: 'es_seguro_nomad',
    },
    {
      titulo: 'Comprovante de endereço na Espanha',
      detalhe:
        'Contrato de aluguel ou hospedagem. É requisito da autorização de longa duração e aparece na checagem.',
      prazo: 'Semanas 4 a 8',
      custo: 'es_moradia',
    },
    {
      titulo: 'Solicitação e registro de estrangeiros',
      detalhe:
        'Formulário, seguro comprovado e a taxa correspondente. Depois da chegada, o TIE na Oficina de Extranjeria.',
      prazo: 'Semanas 8 a 20',
      custo: 'es_tie',
    },
    {
      titulo: 'Passagem aérea',
      detalhe:
        'Depois da concessão. O valor varia muito por rota — é a maior incerteza do orçamento.',
      prazo: 'Semanas 20 a 24',
      custo: 'es_passagem',
    },
  ],
};

/** Condições que barram etapas para este perfil específico. */
function bloqueios(respostas: Respostas, rota: Rota): Map<string, string> {
  const b = new Map<string, string>();

  if (respostas.ensinoMedio === 'nao') {
    // Vale para todos os caminhos: sem comprovação de escolaridade não há
    // como sustentar a solicitação.
    b.set('traducao', 'Você não tem ensino médio completo. Este é o primeiro item a resolver — sem comprovação de escolaridade, nenhuma dessas rotas avança.');
    b.set('universidade', 'Depende do ensino médio. Resolva isso antes de escolher o curso.');
  }

  if (rota.slug === 'reino-unidos-estudo' && respostas.ingles === 'basico') {
    b.set(
      'teste',
      'Com inglês básico, o IELTS é o primeiro bloqueio. Sem ele o CAS não sai, e o CAS é pré-requisito da solicitação.'
    );
  }

  if (respostas.dinheiro === 'ate_3k') {
    b.set(
      'recursos',
      'Com esse valor guardado, o gargalo é aumentar a renda ou conseguir patrocínio. Nenhuma dessas rotas se sustenta com R$ 3 mil.'
    );
  }

  return b;
}

/** Liga uma palavra-chave do título da etapa ao motivo do bloqueio. */
function chaveDe(titulo: string): string {
  const t = titulo.toLowerCase();
  if (t.includes('tradução')) return 'traducao';
  if (t.includes('universidade')) return 'universidade';
  if (t.includes('teste') || t.includes('fundos')) return 'teste';
  if (t.includes('fundos')) return 'recursos';
  return '';
}

/**
 * Monta o plano. É pura: mesmo input, mesmo plano.
 */
export function gerarPlano(
  respostas: Respostas,
  rota: Rota,
  viagens: RegistroViagem[]
): PlanoGerado {
  const base = ETAPAS[rota.slug] ?? [];
  const bloqueado = bloqueios(respostas, rota);
  const contador = calcularContador(viagens);

  const etapas: Etapa[] = base.map((e, i) => {
    const motivo = bloqueado.get(chaveDe(e.titulo));
    return {
      numero: i + 1,
      titulo: e.titulo,
      detalhe: e.detalhe,
      prazo: e.prazo,
      custo: e.custo ? (TABELA_CUSTOS[e.custo]?.valor ?? 0) : 0,
      bloqueado: Boolean(motivo),
      motivo,
    };
  });

  // Abertura escrita para esta pessoa, não um template trocando variáveis.
  const objetivo = ROTULO_OBJETIVO[respostas.objetivo] ?? 'mudar de país';
  const idade = Number(respostas.idade);
  const abertura = Number.isFinite(idade)
    ? `Com ${idade} anos e o objetivo de ${objetivo}, o caminho mais curto para ${rota.nome} passa por ${base.length} etapas. ${
        etapas.some((e) => e.bloqueado)
          ? 'Uma delas precisa ser resolvida antes das outras — está marcada abaixo.'
          : 'Nenhuma etapa depende de algo que você ainda não tem.'
      }`
    : `Seu caminho para ${rota.nome} passa por ${base.length} etapas.`;

  // Justificativa: as outras rotas e o motivo de esta estar na frente.
  const maisBarata = rota.custoMin <= 20_000;
  const justificativa =
    rota.slug === 'reino-unidos-estudo'
      ? `A Inglaterra ficou na frente porque o seu perfil sustenta o custo dela — exige ${rotulo_ingles_para(respostas.ingles)} em inglês, o que é o principal filtro dessa rota. É a mais cara das três (R$ ${(rota.custoMin / 1000).toFixed(0)}k a R$ ${(rota.custoMax / 1000).toFixed(0)}k), e o retorno é um diploma reconhecido amplamente.`
      : rota.slug === 'espanha-estudo'
        ? `A Espanha para estudo é a mais barata das três e não exige IELTS na maioria dos casos. ${maisBarata ? 'No seu caso, o custo é o que a coloca na frente.' : 'Ela aparece como a segunda opção porque a viabilidade calculada para ela ficou abaixo de outra rota.'}`
        : `O Digital Nomad ficou na frente porque não depende de universidade: o que conta é a sua renda remota comprovada. Se a sua renda ainda não é estável, essa rota cai ao longo do tempo e a de estudo sobe.`;

  // O que o app não sabe estimar — sempre vale dizer.
  const lacunas = [
    'Passagem aérea: não há valor fixo, e é a maior incerteza do cálculo.',
    'Custo de vida no destino, que muda por cidade e muda todo mês.',
    'Taxa de câmbio do dia da conversão — as faixas usam uma taxa de referência.',
    'Honorários de tradução quando a oficial não serve para o seu caso.',
  ];

  if (contador.noLimiteSchengen) {
    lacunas.push(
      `Você tem ${contador.diasRestantesSchengen} dias restantes no bloco 90/180 — isso pode empurrar a data de saída.`
    );
  }

  if (contador.diasParaResidencia > 0) {
    lacunas.push(
      `Faltam ${emAnos(contador.diasParaResidencia)} anos de residência para os 5 anos do pedido permanente.`
    );
  }

  return {
    rota,
    abertura,
    justificativa,
    etapas,
    custoEstimado: etapas.reduce((s, e) => s + e.custo, 0),
    lacunas,
    alertas: [],
  };
}

function rotulo_ingles_para(nivel: string): string {
  const txt = ROTULO_INGLES[nivel] ?? 'um nível';
  return `inglês ${txt}`;
}