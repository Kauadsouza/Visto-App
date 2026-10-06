/**
 * As 8 perguntas do questionário.
 *
 * Ficam declaradas aqui (e não dentro da tela) para que diagnóstico, tela e
 * sanitização leiam a mesma fonte — é o que impede o tipo da tela divergir do
 * tipo da regra de negócio.
 *
 * Todas as respostas são string. Isso mantém a persistência simples e evita
 * que o JSON salvo no dispositivo guarde tipos inesperados.
 */

export interface Respostas {
  idade: string;
  objetivo: string;
  dinheiro: string;
  area: string;
  ingles: string;
  ensinoMedio: string;
  passagem: string;
  foraEuropa: string;
}

export const RESPOSTAS_VAZIAS: Respostas = {
  idade: '',
  objetivo: '',
  dinheiro: '',
  area: '',
  ingles: '',
  ensinoMedio: '',
  passagem: '',
  foraEuropa: '',
};

/** As chaves aceitas. Qualquer outra vira lixo e é descartada. */
export const CHAVES_RESPOSTA = Object.keys(RESPOSTAS_VAZIAS) as (keyof Respostas)[];

export interface Opcao {
  valor: string;
  rotulo: string;
}

export interface Pergunta {
  chave: keyof Respostas;
  texto: string;
  ajuda?: string;
  tipo: 'numero' | 'opcoes' | 'texto';
  opcoes?: Opcao[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export const PERGUNTAS: Pergunta[] = [
  {
    chave: 'idade',
    texto: 'Qual sua idade?',
    ajuda: 'A faixa etária muda quais vistos aceitam você.',
    tipo: 'numero',
    min: 16,
    max: 80,
    placeholder: 'Ex.: 27',
  },
  {
    chave: 'objetivo',
    texto: 'Qual seu objetivo?',
    ajuda: 'O que você quer fazer nos primeiros 2 anos fora.',
    tipo: 'opcoes',
    opcoes: [
      { valor: 'estudar', rotulo: 'Estudar' },
      { valor: 'trabalhar', rotulo: 'Trabalhar' },
      { valor: 'os_dois', rotulo: 'Estudar e trabalhar' },
      { valor: 'morar', rotulo: 'Quero sair e morar' },
    ],
  },
  {
    chave: 'dinheiro',
    texto: 'Quanto você tem disponível para investir nos primeiros 6 meses?',
    ajuda: 'Valor já guardado, separado do seu custo de vida.',
    tipo: 'opcoes',
    opcoes: [
      { valor: 'ate_3k', rotulo: 'Até R$ 3 mil' },
      { valor: '3_8k', rotulo: 'R$ 3 mil a R$ 8 mil' },
      { valor: '8_20k', rotulo: 'R$ 8 mil a R$ 20 mil' },
      { valor: '20_60k', rotulo: 'R$ 20 mil a R$ 60 mil' },
      { valor: '60k_mais', rotulo: 'Mais de R$ 60 mil' },
    ],
  },
  {
    chave: 'area',
    texto: 'Qual sua área de atuação profissional?',
    ajuda: 'Ex.: engenharia de software, enfermagem, design, logística.',
    tipo: 'texto',
    placeholder: 'Ex.: técnico em logística',
  },
  {
    chave: 'ingles',
    texto: 'Qual seu nível de inglês?',
    ajuda: 'Para a Inglaterra isso é decisivo.',
    tipo: 'opcoes',
    opcoes: [
      { valor: 'basico', rotulo: 'Básico' },
      { valor: 'intermediario', rotulo: 'Intermediário' },
      { valor: 'avancado', rotulo: 'Avançado' },
      { valor: 'nativo', rotulo: 'Nativo' },
    ],
  },
  {
    chave: 'ensinoMedio',
    texto: 'Você tem diploma de ensino médio completo?',
    ajuda: 'Vários vistos exigem isso como comprovação de escolaridade.',
    tipo: 'opcoes',
    opcoes: [
      { valor: 'sim', rotulo: 'Sim' },
      { valor: 'nao', rotulo: 'Não' },
    ],
  },
  {
    chave: 'passagem',
    texto: 'Você tem passagem aérea comprada ou recurso para comprar?',
    ajuda: 'Nenhuma bolsa cobre passagem. É um item separado no orçamento.',
    tipo: 'opcoes',
    opcoes: [
      { valor: 'comprada', rotulo: 'Tenho passagem comprada' },
      { valor: 'tenho_recurso', rotulo: 'Tenho recurso para comprar' },
      { valor: 'nao', rotulo: 'Não tenho' },
    ],
  },
  {
    chave: 'foraEuropa',
    texto: 'Você aceita ficar um período fora da Europa antes de conseguir o visto permanente?',
    ajuda: 'Muitos caminhos exigem construir histórico primeiro.',
    tipo: 'opcoes',
    opcoes: [
      { valor: 'sim', rotulo: 'Sim, aceito' },
      { valor: 'nao', rotulo: 'Não, quero ir direto' },
      { valor: 'depende', rotulo: 'Depende do país' },
    ],
  },
];