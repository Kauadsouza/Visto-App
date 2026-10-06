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
const BASE: Record<string, Omit<Rota, 'viabilidade' | 'resumo'>> = {
  'reino-unidos-estudo': {
    slug: 'reino-unidos-estudo',
    nome: 'Estudo na Inglaterra',
    custoMin: 25_000,
    custoMax: 45_000,
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
    custoMin: 15_000,
    custoMax: 30_000,
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
    custoMin: 20_000,
    custoMax: 40_000,
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