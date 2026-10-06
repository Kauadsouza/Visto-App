/**
 * =============================================================
 * Diagnóstico — regra de negócio pura.
 * =============================================================
 *
 * Roda LOCAL, sem internet e sem API de IA. É instantâneo, não custa nada
 * e dá o mesmo resultado para o mesmo input — o que importa numa tela onde a
 * pessoa está decidindo a vida dela.
 *
 * `diagnosticar()` é pura: entra um `Respostas`, volta um array de rotas com
 * score. Nada de I/O, nada de estado. Isso é o que a torna testável.
 *
 * -------------------------------------------------------------
 * COMO A VIABILIDADE É CALCULADA
 * -------------------------------------------------------------
 * Cada rota começa num nível e recebe ajustes de +1 / -1:
 *
 *     2 = alta    1 = média    0 = baixa
 *
 * Os ajustes são aplicados na ordem em que estão escritos, porque o resultado
 * final depende da ordem (um +1 seguido de um -1 não é o mesmo que um -1
 * seguido de um +1 quando o nível é limitado a 2).
 * =============================================================
 */

import type { Respostas } from '@/lib/perguntas';

export type Viabilidade = 'alta' | 'media' | 'baixa';

const NIVEL: Record<Viabilidade, number> = { alta: 2, media: 1, baixa: 0 };
const ROTULO: Record<number, Viabilidade> = { 2: 'alta', 1: 'media', 0: 'baixa' };

export interface Rota {
  slug: string;
  nome: string;
  viabilidade: Viabilidade;
  resumo: string;
  custoMin: number;
  custoMax: number;
  tempoMeses: [number, number];
  passos: string[];
}

export interface Diagnostico {
  rotas: Rota[];
  /** Avisos que valem para o perfil inteiro, mostrados acima dos cards. */
  avisos: string[];
  /** Perfil incompleto — o app manda de volta pro questionário. */
  completo: boolean;
}

/**
 * Valor em reais no topo de cada faixa de dinheiro.
 * O topo (e não a média) porque o orçamento precisa cobrir o pior caso: um
 * critério que passa com R$ 8 mil não deve reprovar quem tem exatamente R$ 8 mil.
 */
const DINHEIRO: Record<string, number> = {
  ate_3k: 3_000,
  '3_8k': 8_000,
  '8_20k': 20_000,
  '20_60k': 60_000,
  '60k_mais': 100_000,
};

/** Rotas do MVP. Nada além destas três é oferecida. */
/**
 * =============================================================
 * TABELA DE CUSTOS — fonte e data de verificação
 * =============================================================
 *
 * ESTE É O ARQUIVO PARA EDITAR QUANDO VALIDAR UM VALOR.
 *
 * Tudo que aparece como "custo estimado" no app sai daqui. Cada valor tem
 * a fonte onde ele deve ser conferido e o status da conferência. Quando
 * validar, é só trocar `status` para 'verificada' e preencher
 * `verificadoEm`. Nada mais precisa mudar: o checklist em
 * `src/lib/planos.ts` lê os valores desta tabela.
 *
 * -------------------------------------------------------------
 * ⚠️  NENHUM VALOR AQUI FOI CONFERIDO CONTRA FONTE OFICIAL.
 * -------------------------------------------------------------
 * Todos os números foram estimados em 05/10/2026 por referência geral de
 * mercado. Nenhum foi lido de tabela de consulado. Usuários decidem
 * dinheiro da vida real com esses números, então eles precisam ser
 * conferidos antes de publicar.
 *
 * Conversão usada nas estimativas: 1 GBP ≈ R$ 6,30; 1 EUR ≈ R$ 6,10.
 * Essas taxas também envelhecem — reconferir junto com cada valor.
 *
 * status:
 *   'nao-verificada' — número estimado, nunca conferido
 *   'em-duvida'      — conferido, mas diverge entre fontes
 *   'verificada'     — conferido contra a fonte em `fonte`
 * =============================================================
 */

export type StatusCusto = 'nao-verificada' | 'em-duvida' | 'verificada';

export interface Custo {
  /** Identificador estável. Usado por src/lib/planos.ts. */
  chave: string;
  rotulo: string;
  /** Em BRL, já convertido. */
  valor: number;
  /** Onde conferir. URL ou nome do documento. */
  fonte: string;
  status: StatusCusto;
  /** 'aaaa-mm-dd' quando conferido. null enquanto não. */
  verificadoEm: string | null;
  /** Origem do número enquanto não verificado. */
  nota?: string;
}

export const TABELA_CUSTOS: Record<string, Custo> = {
  // ---------- Inglaterra ----------
  uk_teste_ingles: {
    chave: 'uk_teste_ingles',
    rotulo: 'Teste de inglês (IELTS)',
    valor: 900,
    fonte: 'https://www.gov.uk/government/publications/iielts-fees',
    status: 'nao-verificada',
    verificadoEm: null,
    nota: 'Estimativa para IELTS Academic (~£130). Confirmar se o teste é aceito.',
  },
  uk_passaporte: {
    chave: 'uk_passaporte',
    rotulo: 'Passaporte comum',
    valor: 300,
    fonte: 'https://www.gov.br/pf/pt-br/assuntos/passaporte',
    status: 'nao-verificada',
    verificadoEm: null,
  },
  uk_apostila_escolar: {
    chave: 'uk_apostila_escolar',
    rotulo: 'Tradução juramentada de documentos escolares',
    valor: 600,
    fonte: 'British Council — tradutores juramentados no Reino Unido',
    status: 'nao-verificada',
    verificadoEm: null,
  },
  uk_cas: {
    chave: 'uk_cas',
    rotulo: 'Carta CAS (Confirmation of Acceptance for Studies)',
    valor: 3_100,
    fonte: 'https://www.gov.uk/student-visa',
    status: 'nao-verificada',
    verificadoEm: null,
    nota: '£490 pela universidade. O valor é definido por ela, não pelo governo.',
  },
  uk_biometria: {
    chave: 'uk_biometria',
    rotulo: 'Taxa de biometria no VAC',
    valor: 700,
    fonte: 'https://www.gov.uk/visas-immigration/fees',
    status: 'nao-verificada',
    verificadoEm: null,
    nota: 'Valor aproximado para o VAC no Brasil.',
  },
  uk_taxa_visto: {
    chave: 'uk_taxa_visto',
    rotulo: 'Taxa de visto (Student)',
    valor: 3_500,
    fonte: 'https://www.gov.uk/student-visa/how-much-it-costs',
    status: 'nao-verificada',
    verificadoEm: null,
  },
  uk_passagem_seguro: {
    chave: 'uk_passagem_seguro',
    rotulo: 'Passagem aérea + seguro £1.035/ano',
    valor: 4_200,
    fonte: 'https://www.gov.uk/student-visa',
    status: 'nao-verificada',
    verificadoEm: null,
    nota: 'Seguro obrigatório. A passagem varia muito por rota e data.',
  },
  uk_registro: {
    chave: 'uk_registro',
    rotulo: 'Registro local e matrícula',
    valor: 800,
    fonte: 'Universidade de destino',
    status: 'nao-verificada',
    verificadoEm: null,
  },

  // ---------- Espanha ----------
  es_traducao: {
    chave: 'es_traducao',
    rotulo: 'Tradução juramentada (spanhol)',
    valor: 800,
    fonte: 'MAEC — tradutores juramentados',
    status: 'nao-verificada',
    verificadoEm: null,
  },
  uk_passaporte_compartilhado: {
    chave: 'uk_passaporte_compartilhado',
    rotulo: 'Passaporte comum',
    valor: 300,
    fonte: 'https://www.gov.br/pf/pt-br/assuntos/passaporte',
    status: 'nao-verificada',
    verificadoEm: null,
  },
  es_seguro_estudo: {
    chave: 'es_seguro_estudo',
    rotulo: 'Seguro médico privado (estudante)',
    valor: 1_400,
    fonte: 'Consulado Geral da Espanha em Brasília',
    status: 'nao-verificada',
    verificadoEm: null,
  },
  es_seguro_nomad: {
    chave: 'es_seguro_nomad',
    rotulo: 'Seguro médico privado (teletrabalho)',
    valor: 1_800,
    fonte: 'Consulado Geral da Espanha em Brasília',
    status: 'nao-verificada',
    verificadoEm: null,
    nota: 'A cobertura de saúdeEuropeia costuma ser mais barata que a local.',
  },
  es_taxa_visto: {
    chave: 'es_taxa_visto',
    rotulo: 'Taxa de visto (estudos / longa duração)',
    valor: 900,
    fonte: 'Consulado Geral da Espanha em Brasília — tabela de taxas',
    status: 'nao-verificada',
    verificadoEm: null,
    nota: 'O valor muda por tipo de autorização. Conferir a tabela atual.',
  },
  es_passagem: {
    chave: 'es_passagem',
    rotulo: 'Passagem aérea',
    valor: 5_000,
    fonte: 'Companhia aérea',
    status: 'nao-verificada',
    verificadoEm: null,
    nota: 'Não existe valor fixo. É a maior incerteza de todo o cálculo.',
  },
  es_moradia: {
    chave: 'es_moradia',
    rotulo: 'Moradia inicial na Espanha',
    valor: 4_500,
    fonte: 'Aluguel / hospedagem',
    status: 'nao-verificada',
    verificadoEm: null,
    nota: 'Comprovante de endereço é requisito do visto de teletrabalho.',
  },
  es_tie: {
    chave: 'es_tie',
    rotulo: 'Registro de estrangeiros e TIE',
    valor: 600,
    fonte: 'Consulado / Oficina de Extranjeria',
    status: 'nao-verificada',
    verificadoEm: null,
  },
};

/** Custos que ainda precisam de conferência. */
export function custosPendentes(): Custo[] {
  return Object.values(TABELA_CUSTOS).filter((c) => c.status !== 'verificada');
}

export function totalPendente(): number {
  return custosPendentes().length;
}

/** Valor de um custo pela chave. Estoura em vez de devolver NaN em silêncio. */
export function custoDe(chave: string): number {
  const custo = TABELA_CUSTOS[chave];
  if (!custo) throw new Error(`Custo "${chave}" não existe em TABELA_CUSTOS.`);
  return custo.valor;
}

/**
 * Faixas de custo por rota, somando os itens do checklist mais o que o app
 * não consegue estimar (passagem, custo de vida, câmbio).
 *
 * ⚠️ Também estimadas. Ver a ressalva no topo deste arquivo.
 */
const FAIXAS: Record<string, { custoMin: number; custoMax: number }> = {
  'reino-unidos-estudo': { custoMin: 25_000, custoMax: 45_000 },
  'espanha-estudo': { custoMin: 15_000, custoMax: 30_000 },
  'espanha-digital-nomad': { custoMin: 20_000, custoMax: 40_000 },
};

/**
 * ⚠️ Custos e prazos abaixo são ESTIMATIVAS, não tabelas oficiais.
 * Mesma ressalva do checklist em src/lib/planos.ts — valide contra UKVI e
 * consulado espanhol antes de publicar. Ver TABELA_CUSTOS acima.
 */
const BASE: Record<string, Omit<Rota, 'viabilidade' | 'resumo' | 'custoMin' | 'custoMax'>> = {
  'reino-unidos-estudo': {
    slug: 'reino-unidos-estudo',
    nome: 'Estudo na Inglaterra',
    tempoMeses: [3, 6],
    passos: [
      'Escolher uma universidade e um curso elegível para o Student visa, e obter a carta de aceitação condicional.',
      'Comprovar £1.400 por ano de manutenção (funds), mantidos por 28 dias consecutivos.',
      'Gerar o CAS (Confirmation of Acceptance for Studies) e pagar a taxa de £490.',
      'Agendar a biometria no VAC e apresentar passaporte, CAS e comprovante financeiro.',
    ],
  },
  'espanha-estudo': {
    slug: 'espanha-estudo',
    nome: 'Estudo na Espanha',
    tempoMeses: [2, 5],
    passos: [
      'Conseguir a credencial de admissão (DIP) na universidade, ou pré-inscrição se for pós-graduação.',
      'Traduzir e apostilar os documentos de escolaridade.',
      'Comprovar capacidade econômica e seguro médico privado.',
      'Solicitar o visto de estudos (Studies) e a autorização de retorno.',
    ],
  },
  'espanha-digital-nomad': {
    slug: 'espanha-digital-nomad',
    nome: 'Espanha — Digital Nomad',
    tempoMeses: [3, 6],
    passos: [
      'Provar renda remota de pelo menos 2,5x o salário mínimo espanhol, nos últimos 3 meses.',
      'Comprovar vínculo com o trabalho: contrato, extratos, nota fiscal ou CNPJ.',
      'Contratar seguro médico e ter comprovante de endereço na Espanha.',
      'Solicitar a residência de longa duração para trabalhadores remotos.',
    ],
  },
};

const RESUMO: Record<string, string> = {
  'reino-unidos-estudo':
    'Curso de graduação no Reino Unido, com visto de estudante de 2 anos. É o caminho mais caro do MVP, mas o mais direto para quem quer um diploma reconhecido.',
  'espanha-estudo':
    'Estudar na Espanha pelo visto de estudos, com permanência de 1 a 2 anos. Mais barato que o Reino Unido e sem IELTS obrigatório na maioria dos casos.',
  'espanha-digital-nomad':
    'Residência na Espanha trabalhando 100% remoto para cliente fora do país. Exige renda estável comprovada nos últimos meses, não savings parado.',
};

export function diagnosticar(respostas: Respostas): Diagnostico {
  const avisos: string[] = [];

  // ---------- sanidade das entradas ----------
  const idade = Number(respostas.idade);
  const idadeValida = Number.isFinite(idade) && idade >= 16 && idade <= 80;
  const dinheiro = DINHEIRO[respostas.dinheiro] ?? 0;
  const temDinheiro = respostas.dinheiro in DINHEIRO;
  const semMedio = respostas.ensinoMedio === 'nao';
  const inglesBasico = respostas.ingles === 'basico';
  const aceitaFora = respostas.foraEuropa === 'sim';
  const objetivo = respostas.objetivo;

  const completo =
    idadeValida &&
    temDinheiro &&
    !!objetivo &&
    !!respostas.ingles &&
    !!respostas.ensinoMedio &&
    !!respostas.passagem &&
    !!respostas.foraEuropa;

  // Nível de partida. Todas começam em média: nenhuma rota é impossível por
  // definição, e nenhuma é garantida só de bater o formulário.
  const nivel: Record<string, number> = {
    'reino-unidos-estudo': 1,
    'espanha-estudo': 1,
    'espanha-digital-nomad': 1,
  };

  // ---------- 1. Dinheiro abaixo de R$ 3 mil: regra dura ----------
  // Não é um -1, é um piso. Com esse valor nenhuma rota se sustenta, e fingir
  // que uma é viável seria o pior erro possível nesta tela. O piso é aplicado
  // no fim (passo 7) pelo mesmo motivo do ensino médio.
  const semReserva = respostas.dinheiro === 'ate_3k';
  if (semReserva) {
    avisos.push(
      'Com esse valor, o caminho mais viável é aumentar a renda ou buscar patrocínio. ' +
        'Nenhuma rota é totalmente impossível, mas o custo de manutenção na Europa vai pesar.'
    );
  } else {
    // Inglaterra é a mais cara; o Nomad exige renda comprovada, não só reserva.
    if (dinheiro < 20_000) nivel['reino-unidos-estudo'] -= 1;
    if (dinheiro < 8_000) nivel['espanha-digital-nomad'] -= 1;
    if (dinheiro >= 60_000) nivel['reino-unidos-estudo'] += 1;
  }

  // ---------- 2. Sem ensino médio completo ----------
  // O aviso sai aqui, mas o efeito no nível é aplicado no fim (passo 7).
  // Ver a nota naquele passo: é um bloqueio, não um desconto.
  if (semMedio) {
    avisos.push(
      'Sem o ensino médio completo você não consegue comprovar escolaridade, ' +
        'que é documento obrigatório em quase toda solicitação de visto.'
    );
  }

  // ---------- 3. Inglês básico ----------
  // A rota da Espanha não sobe com espanhol: nenhuma das 8 perguntas pergunta
  // sobre espanhol, então não temos esse dado. Quando existir essa pergunta,
  // é aqui que entra o +1.
  if (inglesBasico) {
    nivel['reino-unidos-estudo'] -= 1;
  }

  // ---------- 4. Aceitar ficar fora da Europa ----------
  // Sobe o Nomad: dá para montar o histórico de renda remote enquanto ainda
  // está no Brasil, em vez de tentar a residência de uma vez só.
  if (aceitaFora) {
    nivel['espanha-digital-nomad'] += 1;
  }

  // ---------- 5. Idade ----------
  if (idadeValida && idade < 25) {
    nivel['reino-unidos-estudo'] += 1;
    nivel['espanha-estudo'] += 1;
    nivel['espanha-digital-nomad'] -= 1;
  }

  if (idadeValida && idade > 35) {
    nivel['espanha-digital-nomad'] += 1;
    nivel['reino-unidos-estudo'] -= 1;
  }

  // ---------- 6. Objetivo declarado ----------
  if (objetivo === 'estudar') {
    nivel['reino-unidos-estudo'] += 1;
    nivel['espanha-estudo'] += 1;
    nivel['espanha-digital-nomad'] -= 1;
  }

  if (objetivo === 'trabalhar') {
    nivel['espanha-digital-nomad'] += 1;
    nivel['reino-unidos-estudo'] -= 1;
  }

  if (objetivo === 'os_dois') {
    nivel['reino-unidos-estudo'] += 1;
  }

  if (objetivo === 'morar') {
    nivel['espanha-digital-nomad'] += 1;
  }

  // ---------- 7. Bloqueios aplicados por último ----------
  // Fica no fim de propósito. Estas duas regras não são descontos, são
  // condições que impedem a rota. Aplicadas na ordem da lista, o +1 de idade
  // ou de objetivo logo em seguida devolveria a Inglaterra para "alta" e a
  // regra não valeria nada.

  // Sem ensino médio: interpretação de "todas abaixo de média" é nenhuma rota
  // ficar acima de média.
  if (semMedio) {
    for (const slug of Object.keys(nivel)) {
      nivel[slug] = Math.min(nivel[slug], 1);
    }
    // A Inglaterra cai mais um nível: o diploma é requisito explícito do CAS.
    nivel['reino-unidos-estudo'] -= 1;
  }

  // Sem reserva: piso absoluto. Vence qualquer ajuste, inclusive os +1.
  if (semReserva) {
    for (const slug of Object.keys(nivel)) {
      nivel[slug] = 0;
    }
  }

  // ---------- montagem ----------
  const rotas: Rota[] = Object.keys(BASE).map((slug) => ({
    ...BASE[slug],
    ...FAIXAS[slug],
    viabilidade: ROTULO[Math.max(0, Math.min(2, nivel[slug]))],
    resumo: RESUMO[slug],
  }));

  // Ordena por viabilidade; desempate pelo custo — entre duas rotas igualmente
  // viáveis, a mais barata é a melhor notícia.
  rotas.sort((a, b) => NIVEL[b.viabilidade] - NIVEL[a.viabilidade] || a.custoMin - b.custoMin);

  // Working Holiday não entra: para brasileiros não existe esse acordo. Vale
  // dizer isso, porque é a dúvida mais comum que o app recebe.
  avisos.push(
    'Working Holiday não entra na lista: esse acordo não existe para brasileiros.'
  );

  return { rotas, avisos, completo };
}

/** Remove o aviso que só faz sentido depois que a pessoa viu a tela. */
export function avisoComplementares(avisos: string[]): string[] {
  return avisos.filter((a) => !a.startsWith('Working Holiday'));
}