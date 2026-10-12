/**
 * =============================================================
 * Base de conhecimento da IA auxiliar
 * =============================================================
 *
 * Sem LLM, sem servidor, sem internet. A IA do app é um conjunto de
 * regras que mapeia pergunta → resposta + fonte. É a versão mais
 * honesta de "inteligência artificial" que cabe num MVP de bolso.
 *
 * Por que isso basta:
 *   - As perguntas de imigração mudam devagar. As respostas também.
 *   - O usuário quer informação estruturada, não prosa criativa.
 *   - Cada resposta traz a fonte — fica explícito que é regra local.
 *
 * Para dúvidas que a base não cobre, a resposta padrão manda para a
 * consultoria humana. Isso evita o pior cenário do regex-match: inventar
 * uma resposta plausível mas errada.
 * =============================================================
 */

export interface RespostaIA {
  texto: string;
  /** Onde a pessoa confirma — URL ou documento do app. */
  fontes: string[];
  /** Quão específica a regra. 0 a 1. */
  confianca: number;
}

interface Intent {
  /** id estável, útil pra log. */
  slug: string;
  /** Regex sobre a pergunta normalizada (lowercase, sem acento, sem pontuação). */
  padrao: RegExp;
  /** Resposta, com {{variaveis}} opcionais (nenhum por enquanto). */
  resposta: (pergunta: string) => RespostaIA;
  /** Tópicos cobertos — para desempate. */
  peso?: number;
}

const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Resposta padrão quando nenhuma regra bate. */
const FALTA = {
  texto:
    'Essa eu não sei responder com segurança aqui. A consultoria de humanos ' +
    'cobre exatamente essa dúvida — você pode contratar um plano na aba ' +
    'Consultoria.',
  fontes: ['Consultoria Visto'],
  confianca: 0,
} as const;

const INTENTS: Intent[] = [
  // ---------- vistos / rotas ----------
  {
    slug: 'rotas-quais',
    padrao: /(quais|que|listar).*rotas|(qual.*(caminho|opcao|opcao))/i,
    resposta: () => ({
      texto:
        'No app existem três rotas para brasileiros: Estudo na Inglaterra, ' +
        'Estudo na Espanha e Espanha — Digital Nomad. Working Holiday não ' +
        'vale para brasileiros. As outras duas saem do diagnóstico com base ' +
        'no seu perfil.',
      fontes: ['Diagnóstico (no app)', 'ACNUR — acordos bilaterais'],
      confianca: 0.9,
    }),
  },
  {
    slug: 'sem-ensino-medio',
    padrao: /(sem|nao tenho|nao fiz).*ensino.medi|ensino.medi.*(sem|incompleto|nao)/i,
    resposta: () => ({
      texto:
        'Sem o ensino médio completo você não consegue comprovar ' +
        'escolaridade, que é documento obrigatório em praticamente toda ' +
        'solicitação de visto. O caminho mais comum é terminar o ensino ' +
        'médio via Enem ou Encceja antes de pedir o visto.',
      fontes: ['UKVI — escolaridade', 'Consulado Geral da Espanha em Brasília'],
      confianca: 0.95,
    }),
  },
  {
    slug: 'estudo-sem-ingles',
    padrao: /(ingles|sem ingles|nao sei ingles|ielts|toefl)/i,
    resposta: () => ({
      texto:
        'Para a Inglaterra o IELTS é praticamente obrigatório — sem ele a ' +
        'universidade não emite a oferta condicional. Para a Espanha ' +
        'estudando, depende da universidade: a maioria aceita curso de ' +
        'espanhol como prova de proficiência em vez de inglês.',
      fontes: ['UKVI — Student visa', 'Universidades espanholas (cursos em espanhol)'],
      confianca: 0.85,
    }),
  },
  {
    slug: 'sem-dinheiro',
    padrao: /(sem dinheiro|nao tenho|falta.*dinheiro|pouco dinheiro|nao da)/i,
    resposta: () => ({
      texto:
        'Com menos de R$ 3 mil nenhuma das rotas se sustenta em 6 meses. ' +
        'O caminho é aumentar a renda antes de pedir, buscar patrocínio ' +
        'de empresa, ou acumular por mais 6–12 meses. O app mostra isso ' +
        'no diagnóstico quando você responde quanto tem disponível.',
      fontes: ['Diagnóstico (no app)'],
      confianca: 0.85,
    }),
  },
  {
    slug: 'digital-nomad-requisitos',
    padrao: /(nômade|nomade|digital nomad|trabalho remoto|trabalho a distancia)/i,
    resposta: () => ({
      texto:
        'A Espanha exige renda de pelo menos 2,5x o salário mínimo ' +
        'espanhol comprovada nos últimos 3 meses, vínculo formal com a ' +
        'empresa/cliente (CLT, PJ, contrato), seguro médico privado e ' +
        'comprovante de moradia. O processo leva de 3 a 6 meses.',
      fontes: ['Consulado Geral da Espanha em Brasília — teletrabalho'],
      confianca: 0.9,
    }),
  },
  {
    slug: 'inglaterra-custo',
    padrao: /(custo|preco|quanto custa|valor).*(inglaterra|reino|uk)/i,
    resposta: () => ({
      texto:
        'A Inglaterra é a rota mais cara do MVP. Os valores que aparecem ' +
        'no app são estimativas: CAS (£490), taxa de visto (£490), ' +
        'manutenção (£1.035/ano), IELTS (~£220), VAC, passagem e seguro. ' +
        'Total estimado R$ 25–45 mil para os primeiros 6 meses.',
      fontes: ['UKVI — fees', 'TABELA_CUSTOS no app'],
      confianca: 0.85,
    }),
  },
  {
    slug: 'espanha-custo',
    padrao: /(custo|preco|quanto custa).*(espanha)/i,
    resposta: () => ({
      texto:
        'Para a Espanha (estudo ou Digital Nomad) o app estima R$ 15–40 ' +
        'mil para os primeiros 6 meses. Inclui tradução juramentada, ' +
        'seguro médico, taxa consular e, no caso do nomad, comprovante ' +
        'de moradia. Os valores são estimativas — validar antes.',
      fontes: ['Consulado Geral da Espanha em Brasília — taxas'],
      confianca: 0.85,
    }),
  },

  // ---------- Schengen / contador ----------
  {
    slug: 'schengen-90-180',
    padrao: /(schengen|90 180|90 dias|bloco)/i,
    resposta: () => ({
      texto:
        'O espaço Schengen funciona como uma janela móvel de 180 dias: ' +
        'você pode ficar até 90 dias dentro dela. Se passou 60 dias na ' +
        'Espanha em janeiro, pode usar os 30 restantes até julho, não ' +
        'no mesmo ano. O app calcula isso pelo seu histórico de entradas.',
      fontes: ['acervo oficial Schengen (Acordo de Schengen)'],
      confianca: 0.9,
    }),
  },
  {
    slug: 'residencia-espanha',
    padrao: /(residencia|cidadania|nacionalidade).*(espanha|spain)/i,
    resposta: () => ({
      texto:
        'A residência de longa duração na Espanha pede 5 anos de ' +
        'permanência legal contínua. O app mostra seu progresso em ' +
        '"anos contados para a residência" no contador da home. ' +
        'Cada ano de visto renovável conta.',
      fontes: ['Consulado Geral da Espanha em Brasília — residencia'],
      confianca: 0.85,
    }),
  },
  {
    slug: 'working-holiday',
    padrao: /(working holiday|wh|intercambio.*trabalho)/i,
    resposta: () => ({
      texto:
        'Working Holiday é um acordo bilateral — alguns países têm com ' +
        'o Brasil, mas Reino Unido, Espanha e a maioria dos países ' +
        'comuns de imigração brasileira não. A exceção histórica foi a ' +
        'Austrália e Nova Zelândia, que hoje têm programas suspensos. ' +
        'Por isso essa opção não aparece no app.',
      fontes: ['MRE — acordos bilaterais'],
      confianca: 0.95,
    }),
  },

  // ---------- processo ----------
  {
    slug: 'documentos-basicos',
    padrao: /(documento|papel|papelada|reunir.*documento)/i,
    resposta: () => ({
      texto:
        'Para qualquer rota você vai precisar de: passaporte válido ' +
        '(6+ meses), histórico escolar traduzido, comprovante financeiro, ' +
        'e seguro médico. A lista completa por rota está no checklist ' +
        'do app, organizada em 5 fases.',
      fontes: ['UKVI — documentos', 'Consulado Geral da Espanha em Brasília'],
      confianca: 0.85,
    }),
  },
  {
    slug: 'tempo-total',
    padrao: /(quanto tempo|demora|prazo total|quanto demora)/i,
    resposta: () => ({
      texto:
        'Da decisão de ir até o visto em mãos: 2 a 6 meses. Estudo na ' +
        'Espanha costuma ser o mais rápido (2–5 meses); Inglaterra o ' +
        'mais demorado por causa do CAS. O Digital Nomad cai em 3–6 ' +
        'meses, mas precisa de vínculo de trabalho já formado.',
      fontes: ['UKVI — tempos médios', 'Consulado Geral da Espanha em Brasília'],
      confianca: 0.8,
    }),
  },

  // ---------- meta ----------
  {
    slug: 'assessoria-juridica',
    padrao: /(advogado|juridica|assessoria|juridico)/i,
    resposta: () => ({
      texto:
        'O Visto não é assessoria jurídica. A informação aqui é ' +
        'educacional e baseada em fontes oficiais. Para decisão final ' +
        'o caminho é um advogado imigracionista — você pode contratar ' +
        'um na aba Consultoria.',
      fontes: ['Termos do app'],
      confianca: 1,
    }),
  },
  {
    slug: 'pagamento-app',
    padrao: /(app|preco|valor|assinatura|paga|custo).*(app|plano|assinatura|acesso completo)/i,
    resposta: () => ({
      texto:
        'O acesso completo é o plano pago do app: libera o checklist ' +
        'inteiro, o contador detalhado e a consultoria. Sem ele, você ' +
        'vê 3 itens do checklist. O valor atual está em "Gerenciar ' +
        'acesso" na aba Conta.',
      fontes: ['Termos do app'],
      confianca: 0.9,
    }),
  },
];

/** Resposta padrão. */
const RESPOSTA_FALTA: RespostaIA = {
  ...FALTA,
  fontes: ['Consultoria Visto'],
  confianca: 0,
};

export function consultarIA(pergunta: string): RespostaIA {
  const norm = normalizar(pergunta);
  if (norm.length === 0) {
    return {
      texto: 'Pergunta vazia — pode reformular?',
      fontes: [],
      confianca: 0,
    };
  }

  let melhor: { intent: Intent; score: number } | null = null;

  for (const intent of INTENTS) {
    if (!intent.padrao.test(norm)) continue;
    const peso = intent.peso ?? 1;
    // Score combina match do padrão com a quantidade de palavras da regex
    // reconhecidas. Regex mais específicos vencem.
    const matches = norm.match(intent.padrao);
    const score = (matches?.[0].length ?? 0) * peso;
    if (!melhor || score > melhor.score) {
      melhor = { intent, score };
    }
  }

  if (!melhor) {
    return RESPOSTA_FALTA;
  }

  return melhor.intent.resposta(pergunta);
}